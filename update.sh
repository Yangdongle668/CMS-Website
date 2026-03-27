#!/bin/bash

# =============================================================================
# ZUFEK CMS Website - 自动更新脚本
# 用途: 快速更新代码、依赖、数据库迁移和缓存
# 使用: sudo bash update.sh
# =============================================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}${GREEN}==>${NC}${BOLD} $1${NC}"; }

# 检查权限
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 权限运行: sudo bash update.sh"
fi

# 配置
APP_DIR="${1:-.}"
BRANCH="claude/b2b-battery-website-ilqmE"
PHP_VERSION="8.2"

echo -e "${BOLD}"
echo "╔════════════════════════════════════════════════╗"
echo "║   ZUFEK CMS Website - 自动更新脚本            ║"
echo "║   Branch: $BRANCH"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# 进入应用目录
if [ ! -d "$APP_DIR" ]; then
    error "应用目录不存在: $APP_DIR"
fi

cd "$APP_DIR"
info "工作目录: $(pwd)"

# ============================================================
# 步骤 1: 更新代码
# ============================================================
step "步骤 1/7: 从GitHub更新代码"
git fetch origin
git pull origin "$BRANCH" || error "拉取代码失败"
success "代码已更新"

# ============================================================
# 步骤 2: 更新PHP依赖
# ============================================================
step "步骤 2/7: 更新PHP依赖"
composer update --no-dev --optimize-autoloader --no-interaction -q || composer install --no-dev --optimize-autoloader -q
success "PHP依赖已更新"

# ============================================================
# 步骤 3: 更新前端依赖
# ============================================================
step "步骤 3/7: 更新前端依赖"
npm ci --silent
success "NPM依赖已安装"

# ============================================================
# 步骤 4: 构建前端资源
# ============================================================
step "步骤 4/7: 构建前端资源"
npm run build
success "前端资源已构建"

# ============================================================
# 步骤 5: 数据库迁移
# ============================================================
step "步骤 5/7: 运行数据库迁移"
php artisan migrate --force -q
success "数据库迁移完成"

# ============================================================
# 步骤 6: 清除缓存
# ============================================================
step "步骤 6/7: 清除并重新生成缓存"
php artisan config:cache -q
php artisan route:cache -q
php artisan view:cache -q
success "缓存已清除并重新生成"

# ============================================================
# 步骤 7: 重启服务
# ============================================================
step "步骤 7/7: 重启 Nginx 和 PHP-FPM 服务"
systemctl restart nginx
systemctl restart php${PHP_VERSION}-fpm
success "服务已重启"

# ============================================================
# 完成
# ============================================================
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔════════════════════════════════════════════════╗"
echo "║            ✅ 更新成功完成！                  ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}更新时间:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "  ${BOLD}应用路径:${NC} $APP_DIR"
echo -e "  ${BOLD}当前分支:${NC} $BRANCH"
echo ""
echo -e "  ${BOLD}查看日志:${NC}"
echo -e "    tail -f $APP_DIR/storage/logs/laravel.log"
echo ""
