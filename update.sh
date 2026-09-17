#!/usr/bin/env bash
# =============================================================
# Battery CMS — 一条命令更新 Docker 部署
#
#   ./update.sh                 拉取最新代码 → 备份数据库 → 重建镜像 → 重启 → 健康检查
#   ./update.sh --no-pull       不拉代码，只重建并重启（改完 .env 后用这个）
#   ./update.sh --pull-base     顺便刷新 node / postgres 基础镜像
#   ./update.sh --help          全部参数
#
# 设计要点：
#   • 先构建、后重启 —— 构建期间旧容器照常服务，停机只发生在 up -d 那几秒
#   • 重启前自动 pg_dump 一份数据库到 ./backups/
#   • 新容器起不来（健康检查不过）时自动回滚到更新前的镜像
#   • 数据库 schema 由容器启动时的 db:init 幂等应用，不需要手工迁移
#
# 退出码：0 成功 · 1 更新失败（已回滚）· 2 参数或环境问题
# =============================================================
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------- 参数 ----------
DO_PULL=true
DO_BACKUP=true
DO_ROLLBACK=true
DO_PRUNE=false
PULL_BASE=false
KEEP_BACKUPS=10
HEALTH_TIMEOUT=180

usage() {
  cat <<'USAGE'
用法: ./update.sh [选项]

  --no-pull        跳过 git pull（只重建镜像并重启当前代码）
  --no-backup      跳过数据库备份（不推荐）
  --no-rollback    新版本起不来时不自动回滚
  --pull-base      构建时刷新基础镜像（docker build --pull）
  --prune          更新成功后清理悬空镜像
  --keep N         保留最近 N 份数据库备份（默认 10）
  --timeout S      等待服务健康的秒数（默认 180）
  -h, --help       显示本帮助

示例:
  ./update.sh                    # 常规更新
  ./update.sh --no-pull          # 改了 .env 后重建重启
  ./update.sh --pull-base --prune  # 连基础镜像一起更新并清理旧镜像
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --no-pull)     DO_PULL=false ;;
    --no-backup)   DO_BACKUP=false ;;
    --no-rollback) DO_ROLLBACK=false ;;
    --pull-base)   PULL_BASE=true ;;
    --prune)       DO_PRUNE=true ;;
    --keep)        shift; KEEP_BACKUPS="${1:-10}" ;;
    --timeout)     shift; HEALTH_TIMEOUT="${1:-180}" ;;
    -h|--help)     usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

case "$KEEP_BACKUPS" in (*[!0-9]*|'') echo "--keep 需要一个数字" >&2; exit 2 ;; esac
case "$HEALTH_TIMEOUT" in (*[!0-9]*|'') echo "--timeout 需要一个数字" >&2; exit 2 ;; esac

# ---------- 输出 ----------
IS_TTY=false
if [ -t 1 ]; then IS_TTY=true; fi
if [ "$IS_TTY" = true ] && [ -z "${NO_COLOR:-}" ]; then
  C_OK=$'\033[32m'; C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_DIM=$'\033[2m'; C_B=$'\033[1m'; C_0=$'\033[0m'
else
  C_OK=''; C_WARN=''; C_ERR=''; C_DIM=''; C_B=''; C_0=''
fi
STEP=0
STEP_TOTAL=8
step()  { STEP=$((STEP + 1)); printf '\n%s[%d/%d] %s%s\n' "$C_B" "$STEP" "$STEP_TOTAL" "$1" "$C_0"; }
info()  { printf '      %s\n' "$1"; }
dim()   { printf '      %s%s%s\n' "$C_DIM" "$1" "$C_0"; }
ok()    { printf '      %s✓%s %s\n' "$C_OK" "$C_0" "$1"; }
warn()  { printf '      %s⚠%s %s\n' "$C_WARN" "$C_0" "$1"; }
fail()  { printf '\n%s✗ %s%s\n' "$C_ERR" "$1" "$C_0" >&2; }

# ---------- 环境自检 ----------
step "检查环境"
command -v docker >/dev/null 2>&1 || { fail "找不到 docker，请先安装 Docker Engine"; exit 2; }

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  fail "找不到 docker compose（v2 插件）或 docker-compose（v1）"; exit 2
fi

docker info >/dev/null 2>&1 || { fail "连不上 Docker 守护进程，请确认 dockerd 正在运行、当前用户有权限"; exit 2; }
[ -f docker-compose.yml ] || { fail "当前目录没有 docker-compose.yml：请在项目根目录运行 ./update.sh"; exit 2; }
[ -f .env ] || warn ".env 不存在，将全部使用 docker-compose.yml 里的默认值"

ok "docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo '?') · ${COMPOSE}"

# 从 .env 读一个键（不 source，避免被引号/空格/特殊字符坑到）
env_get() {
  local key="$1" def="${2:-}" val=''
  if [ -f .env ]; then
    val=$(grep -E "^[[:space:]]*${key}=" .env 2>/dev/null | tail -1 | cut -d= -f2- || true)
    val=$(printf '%s' "$val" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
  fi
  printf '%s' "${val:-$def}"
}

PG_USER=$(env_get PGUSER postgres)
PG_DB=$(env_get PGDATABASE battery_cms)

# 某个 compose 服务是否在运行（v1 / v2 都适用，不依赖 `ps --status`）
service_running() {
  local cid
  cid=$($COMPOSE ps -q "$1" 2>/dev/null | head -1)
  [ -n "$cid" ] || return 1
  [ "$(docker inspect -f '{{.State.Running}}' "$cid" 2>/dev/null)" = "true" ]
}

# ---------- 更新代码 ----------
step "更新代码"
OLD_COMMIT=''
NEW_COMMIT=''
if [ ! -d .git ]; then
  warn "不是 git 仓库，跳过拉取代码"
elif [ "$DO_PULL" != true ]; then
  dim "已指定 --no-pull，跳过"
  OLD_COMMIT=$(git rev-parse --short HEAD)
else
  if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
    fail "工作区有未提交的改动，先提交或还原，或用 ./update.sh --no-pull 跳过拉取"
    git status --short --untracked-files=no >&2
    exit 2
  fi
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  OLD_COMMIT=$(git rev-parse --short HEAD)
  if [ "$BRANCH" = "HEAD" ]; then
    fail "当前是游离 HEAD（没有签出分支），无法自动拉取。先 git checkout <分支>，或用 --no-pull"
    exit 2
  fi
  info "分支 ${BRANCH}，当前 ${OLD_COMMIT}"
  if ! git pull --ff-only origin "$BRANCH"; then
    fail "git pull 失败（网络问题，或本地与远端分叉需要手工处理）"
    exit 2
  fi
  NEW_COMMIT=$(git rev-parse --short HEAD)
  if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
    ok "代码已是最新（${NEW_COMMIT}），继续重建镜像"
  else
    ok "${OLD_COMMIT} → ${NEW_COMMIT}"
    git --no-pager log --oneline "${OLD_COMMIT}..${NEW_COMMIT}" | head -10 | sed 's/^/      /'
  fi
fi

# ---------- 备份数据库 ----------
step "备份数据库"
BACKUP_FILE=''
if [ "$DO_BACKUP" != true ]; then
  dim "已指定 --no-backup，跳过"
elif ! service_running db; then
  warn "db 容器未运行，跳过备份（首次部署时正常）"
else
  mkdir -p backups
  BACKUP_FILE="backups/${PG_DB}-$(date +%Y%m%d-%H%M%S).sql.gz"
  # 管道的退出码是 gzip 的，pg_dump 自己的要从 PIPESTATUS 取
  set +e
  $COMPOSE exec -T db pg_dump -U "$PG_USER" "$PG_DB" 2>/dev/null | gzip > "$BACKUP_FILE"
  DUMP_RC=${PIPESTATUS[0]}
  set -e
  if [ "$DUMP_RC" -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    ok "已备份到 ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"
    # 只保留最近 N 份
    ls -1t "backups/${PG_DB}"-*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | while read -r old; do
      rm -f "$old" && dim "清理旧备份 ${old}"
    done
  else
    rm -f "$BACKUP_FILE"; BACKUP_FILE=''
    fail "数据库备份失败，已中止更新（确认 PGUSER/PGDATABASE 与 .env 一致；想跳过备份加 --no-backup）"
    exit 1
  fi
fi

# ---------- 记录回滚点 ----------
step "记录回滚点"
ROLLBACK_TAG=''
if docker image inspect battery-cms:latest >/dev/null 2>&1; then
  ROLLBACK_TAG="battery-cms:rollback"
  docker tag battery-cms:latest "$ROLLBACK_TAG"
  ok "当前镜像已标记为 ${ROLLBACK_TAG}"
else
  dim "本机还没有 battery-cms:latest（首次部署），无需回滚点"
fi

# ---------- 构建 ----------
step "构建新镜像"
info "构建期间旧容器继续对外服务"
BUILD_ARGS=""
if [ "$PULL_BASE" = true ]; then BUILD_ARGS="--pull"; fi
if ! $COMPOSE build $BUILD_ARGS app; then
  fail "镜像构建失败，线上服务未受影响（仍在跑旧版本）"
  exit 1
fi
ok "构建完成"

# ---------- 重启 ----------
step "重启服务"
if [ "$PULL_BASE" = true ]; then
  $COMPOSE pull db redis 2>/dev/null || warn "基础镜像拉取失败，沿用本地镜像"
fi
if ! $COMPOSE up -d --remove-orphans; then
  fail "docker compose up 失败"
  $COMPOSE logs --tail=50 app || true
  exit 1
fi
info "容器已启动，数据库 schema 由 db:init 在启动时幂等应用"

# ---------- 健康检查 ----------
step "等待服务健康（最多 ${HEALTH_TIMEOUT}s）"

health_status() {
  local cid
  cid=$($COMPOSE ps -q app 2>/dev/null | head -1)
  [ -n "$cid" ] || { printf 'missing'; return; }
  docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else if .State.Running}}running-nohealthcheck{{else}}stopped{{end}}' "$cid" 2>/dev/null || printf 'missing'
}

WAITED=0
STATUS=''
while [ "$WAITED" -lt "$HEALTH_TIMEOUT" ]; do
  STATUS=$(health_status)
  case "$STATUS" in
    healthy|running-nohealthcheck) break ;;
    unhealthy|stopped|missing)
      # 容器可能还在重启中，给它几次机会再判定
      if [ "$WAITED" -ge 30 ]; then break; fi ;;
  esac
  sleep 3
  WAITED=$((WAITED + 3))
  if [ "$IS_TTY" = true ]; then
    printf '\r      %s等待中… %ss（当前状态：%s）%s' "$C_DIM" "$WAITED" "$STATUS" "$C_0"
  fi
done
if [ "$IS_TTY" = true ]; then printf '\r%*s\r' 60 ''; fi

if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "running-nohealthcheck" ]; then
  ok "服务已就绪（${STATUS}）"
else
  fail "服务未能就绪（已等待 ${WAITED}s，上限 ${HEALTH_TIMEOUT}s，当前状态：${STATUS}）"
  echo "      —— 最近 50 行日志 ——" >&2
  $COMPOSE logs --tail=50 app >&2 || true

  if [ "$DO_ROLLBACK" = true ] && [ -n "$ROLLBACK_TAG" ]; then
    printf '\n%s正在回滚到更新前的镜像…%s\n' "$C_WARN" "$C_0" >&2
    docker tag "$ROLLBACK_TAG" battery-cms:latest
    if $COMPOSE up -d --no-build --force-recreate app; then
      warn "已回滚到更新前的镜像，服务应恢复；请查看上面的日志定位问题"
      if [ -n "$BACKUP_FILE" ]; then info "数据库备份：${BACKUP_FILE}"; fi
      info "代码仍停留在更新后的版本，修好后重新执行 ./update.sh 即可"
    else
      fail "回滚也失败了，请手工处理：${COMPOSE} up -d"
    fi
  else
    warn "未自动回滚（--no-rollback 或没有可回滚的镜像）"
    if [ -n "$ROLLBACK_TAG" ]; then
      info "手工回滚：docker tag ${ROLLBACK_TAG} battery-cms:latest && ${COMPOSE} up -d --no-build --force-recreate app"
    fi
  fi
  exit 1
fi

# ---------- 收尾 ----------
step "完成"
if [ "$DO_PRUNE" = true ]; then
  docker image prune -f >/dev/null 2>&1 && dim "已清理悬空镜像"
fi

APP_PORT=$(env_get APP_PORT 3000)
PUBLIC_URL=$(env_get PUBLIC_URL "http://localhost:${APP_PORT}")
printf '\n%s✓ 更新完成%s\n' "$C_OK$C_B" "$C_0"
if [ -n "$NEW_COMMIT" ] && [ "$OLD_COMMIT" != "$NEW_COMMIT" ]; then
  info "代码：${OLD_COMMIT} → ${NEW_COMMIT}"
fi
if [ -n "$BACKUP_FILE" ]; then info "备份：${BACKUP_FILE}"; fi
info "站点：${PUBLIC_URL}"
info "后台：${PUBLIC_URL%/}/admin/login.html"
dim "查看日志：${COMPOSE} logs -f app"
if [ -n "$ROLLBACK_TAG" ]; then
  dim "如需回退：docker tag ${ROLLBACK_TAG} battery-cms:latest && ${COMPOSE} up -d --no-build --force-recreate app"
fi

# 末尾的条件判断不能决定脚本退出码：显式返回 0
exit 0
