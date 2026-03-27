#!/bin/bash

# =============================================================================
# ZUFEK CMS Website - Webhook 自动部署脚本
# 用途: GitHub Webhook 触发自动部署
# 配置: GitHub Webhook > http://your_vps_ip:9000/hooks/zufek-deploy
# =============================================================================

set -e

# 配置
APP_DIR="/var/www/zufek"
BRANCH="claude/b2b-battery-website-ilqmE"
LOG_FILE="/var/log/zufek-deploy.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 记录日志
log_message() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

# 颜色输出函数
log_info()    { echo "[INFO] $1" | tee -a "$LOG_FILE"; }
log_success() { echo "[✓] $1" | tee -a "$LOG_FILE"; }
log_error()   { echo "[✗] $1" | tee -a "$LOG_FILE"; }

log_info "=========================================="
log_info "ZUFEK CMS - Webhook 自动部署开始"
log_info "时间: $TIMESTAMP"
log_info "=========================================="

# 进入应用目录
if [ ! -d "$APP_DIR" ]; then
    log_error "应用目录不存在: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

# 更新代码
log_info "正在拉取最新代码..."
git fetch origin
git pull origin "$BRANCH" > /dev/null 2>&1

# 检查是否有更改
CHANGES=$(git diff origin/$BRANCH..HEAD --name-only | wc -l)
if [ $CHANGES -eq 0 ]; then
    log_info "代码已是最新，无需更新"
    exit 0
fi

log_info "检测到 $CHANGES 个文件变更，开始部署..."

# 更新PHP依赖
log_info "更新PHP依赖..."
composer update --no-dev --optimize-autoloader --no-interaction -q || composer install --no-dev --optimize-autoloader -q

# 更新前端依赖
log_info "更新前端依赖..."
npm ci --silent

# 构建前端资源
log_info "构建前端资源..."
npm run build

# 数据库迁移
log_info "运行数据库迁移..."
php artisan migrate --force -q

# 清除缓存
log_info "清除并重新生成缓存..."
php artisan config:cache -q
php artisan route:cache -q
php artisan view:cache -q

# 重启服务
log_info "重启服务..."
systemctl restart nginx php8.2-fpm

log_success "=========================================="
log_success "部署完成！时间: $(date '+%Y-%m-%d %H:%M:%S')"
log_success "=========================================="

# 发送通知（可选 - 需要配置邮件或Slack）
# 这里可以添加邮件或Slack通知逻辑

exit 0
