#!/bin/bash

# =============================================================================
# ZUFEK CMS Website - VPS 一键部署脚本
# 支持系统: Ubuntu 20.04 / 22.04 / Debian 11+
# 要求: PHP 8.1+, Nginx, Node.js 18+
# =============================================================================

set -e

# 禁用交互式提示，自动同意所有更新
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

# ============================================================
# 配置区域 - 修改以下变量
# ============================================================
REPO_URL="https://github.com/Yangdongle668/CMS-Website.git"
BRANCH="claude/b2b-battery-website-ilqmE"
APP_DIR="/var/www/zufek"
DOMAIN=""                  # 例如: zufek.com 或留空跳过Nginx配置
APP_USER="www-data"
PHP_VERSION="8.2"          # 可选: 8.1 / 8.2 / 8.3
INSTALL_SSL=false          # true=安装Let's Encrypt SSL (需要有效域名)
DB_TYPE="sqlite"           # sqlite 或 mysql
MYSQL_DB="zufek_cms"       # 仅 DB_TYPE=mysql 时有效
MYSQL_USER="zufek"         # 仅 DB_TYPE=mysql 时有效
MYSQL_PASS=""              # 仅 DB_TYPE=mysql 时有效，留空自动生成

# ============================================================
# 颜色输出
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
step()    { echo -e "\n${BOLD}${GREEN}==>${NC}${BOLD} $1${NC}"; }

# ============================================================
# 检查Root权限
# ============================================================
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 权限运行: sudo bash deploy.sh"
fi

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════╗"
echo "║   ZUFEK CMS Website - 一键部署脚本      ║"
echo "║   DONGGUAN ZUFEK TECHNOLOGY CO.,LTD     ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# 自动生成MySQL密码（如未设置）
if [ "$DB_TYPE" = "mysql" ] && [ -z "$MYSQL_PASS" ]; then
    MYSQL_PASS=$(openssl rand -base64 16)
fi

# ============================================================
# 步骤 1: 更新系统并安装依赖
# ============================================================
step "步骤 1/9: 更新系统并安装基础依赖"

# 自动同意所有更新和重启
export NEEDRESTART_MODE=a

apt-get update -qq
apt-get upgrade -y -qq -o Dpkg::Pre-Install-Pkgs::="/usr/sbin/etckeeper pre-install 2>/dev/null || true" -o DPkg::Post-Install-Pkgs::="/usr/sbin/etckeeper post-install 2>/dev/null || true" || true

# 安装基础依赖（自动同意）
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    curl wget git unzip zip \
    software-properties-common \
    apt-transport-https ca-certificates \
    lsb-release gnupg needrestart

success "基础依赖安装完成"

# ============================================================
# 步骤 2: 安装 PHP
# ============================================================
step "步骤 2/9: 安装 PHP ${PHP_VERSION}"

if ! php -v 2>/dev/null | grep -q "PHP ${PHP_VERSION}"; then
    add-apt-repository -y ppa:ondrej/php 2>/dev/null || true
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        php${PHP_VERSION} \
        php${PHP_VERSION}-fpm \
        php${PHP_VERSION}-cli \
        php${PHP_VERSION}-mbstring \
        php${PHP_VERSION}-xml \
        php${PHP_VERSION}-bcmath \
        php${PHP_VERSION}-curl \
        php${PHP_VERSION}-zip \
        php${PHP_VERSION}-gd \
        php${PHP_VERSION}-intl \
        php${PHP_VERSION}-tokenizer \
        php${PHP_VERSION}-fileinfo

    if [ "$DB_TYPE" = "sqlite" ]; then
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq php${PHP_VERSION}-sqlite3
    else
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq php${PHP_VERSION}-mysql
    fi
fi

success "PHP $(php -r 'echo PHP_VERSION;') 安装完成"

# ============================================================
# 步骤 3: 安装 Composer
# ============================================================
step "步骤 3/9: 安装 Composer"

if ! command -v composer &>/dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

success "Composer $(composer --version --no-ansi | awk '{print $3}') 安装完成"

# ============================================================
# 步骤 4: 安装 Node.js 18 + npm
# ============================================================
step "步骤 4/9: 安装 Node.js 18"

if ! node -v 2>/dev/null | grep -q "v18\|v20\|v22"; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs
fi

success "Node.js $(node -v) / npm $(npm -v) 安装完成"

# ============================================================
# 步骤 5: 安装 Nginx
# ============================================================
step "步骤 5/9: 安装 Nginx"

if ! command -v nginx &>/dev/null; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx
fi

success "Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}') 安装完成"

# ============================================================
# 步骤 6: 安装 MySQL（可选）
# ============================================================
if [ "$DB_TYPE" = "mysql" ]; then
    step "步骤 6/9: 安装 MySQL"
    if ! command -v mysql &>/dev/null; then
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server
        systemctl start mysql
        systemctl enable mysql
    fi

    mysql -e "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    mysql -e "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASS}';" 2>/dev/null || true
    mysql -e "GRANT ALL PRIVILEGES ON \`${MYSQL_DB}\`.* TO '${MYSQL_USER}'@'localhost';" 2>/dev/null || true
    mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

    success "MySQL 数据库 '${MYSQL_DB}' 创建完成"
else
    info "跳过 MySQL 安装（使用 SQLite）"
fi

# ============================================================
# 步骤 7: 克隆/更新代码仓库
# ============================================================
step "步骤 7/9: 部署应用代码"

if [ -d "$APP_DIR/.git" ]; then
    info "检测到已有代码，执行更新..."
    cd "$APP_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    info "克隆代码仓库..."
    mkdir -p "$APP_DIR"
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

success "代码部署到 ${APP_DIR}"

# ============================================================
# 步骤 8: 配置 Laravel 应用
# ============================================================
step "步骤 8/9: 配置 Laravel 应用"

cd "$APP_DIR"

# 安装 PHP 依赖
info "安装 PHP 依赖 (composer install)..."
composer install --no-dev --optimize-autoloader --no-interaction -q

# 安装 Node.js 依赖并构建前端
info "安装前端依赖 (npm install)..."
npm ci --silent

info "构建前端资源 (npm run build)..."
npm run build

# 配置 .env 文件
if [ ! -f ".env" ]; then
    cp .env.example .env
    info "已从 .env.example 创建 .env"
fi

# 设置 APP_ENV 和 APP_DEBUG
sed -i "s/APP_ENV=.*/APP_ENV=production/" .env
sed -i "s/APP_DEBUG=.*/APP_DEBUG=false/" .env
sed -i "s|APP_URL=.*|APP_URL=http://${DOMAIN:-localhost}|" .env

# 配置数据库
if [ "$DB_TYPE" = "sqlite" ]; then
    sed -i "s/DB_CONNECTION=.*/DB_CONNECTION=sqlite/" .env
    # 移除 MySQL 相关配置
    sed -i '/^DB_HOST=/d; /^DB_PORT=/d; /^DB_DATABASE=/d; /^DB_USERNAME=/d; /^DB_PASSWORD=/d' .env
    touch database/database.sqlite
    success "SQLite 数据库文件已创建"
else
    sed -i "s/DB_CONNECTION=.*/DB_CONNECTION=mysql/" .env
    sed -i "s/DB_HOST=.*/DB_HOST=127.0.0.1/" .env
    sed -i "s/DB_PORT=.*/DB_PORT=3306/" .env
    sed -i "s/DB_DATABASE=.*/DB_DATABASE=${MYSQL_DB}/" .env
    sed -i "s/DB_USERNAME=.*/DB_USERNAME=${MYSQL_USER}/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${MYSQL_PASS}/" .env
fi

# 生成 APP_KEY
php artisan key:generate --force -q

# 配置 storage 链接
php artisan storage:link --force 2>/dev/null || true

# 运行数据库迁移
info "运行数据库迁移..."
php artisan migrate --force -q

# 可选: 运行数据填充
read -t 10 -p "$(echo -e ${YELLOW})是否填充示例产品数据? [y/N] $(echo -e ${NC})" SEED_CONFIRM 2>/dev/null || SEED_CONFIRM="n"
if [[ "$SEED_CONFIRM" =~ ^[Yy]$ ]]; then
    php artisan db:seed --force -q
    success "示例数据填充完成"
fi

# 优化缓存
php artisan config:cache -q
php artisan route:cache -q
php artisan view:cache -q

# 设置文件权限
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"

success "Laravel 应用配置完成"

# ============================================================
# 步骤 9: 配置 Nginx
# ============================================================
step "步骤 9/9: 配置 Nginx 虚拟主机"

NGINX_CONF="/etc/nginx/sites-available/zufek"

cat > "$NGINX_CONF" << NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN:-_};
    root ${APP_DIR}/public;
    index index.php index.html;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # 最大上传大小
    client_max_body_size 20M;

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
NGINX

# 启用站点
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/zufek
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# 测试 Nginx 配置
nginx -t -q && systemctl reload nginx

# 启动并启用服务
systemctl enable nginx php${PHP_VERSION}-fpm -q
systemctl restart nginx php${PHP_VERSION}-fpm

success "Nginx 配置完成"

# ============================================================
# 安装 SSL 证书 (可选)
# ============================================================
if [ "$INSTALL_SSL" = "true" ] && [ -n "$DOMAIN" ]; then
    info "安装 Let's Encrypt SSL 证书..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot python3-certbot-nginx
    DEBIAN_FRONTEND=noninteractive certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
        --email "admin@${DOMAIN}" --redirect && success "SSL 证书安装完成" || warn "SSL 安装失败，请手动配置"
fi

# ============================================================
# 完成 - 输出部署摘要
# ============================================================
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║            ✅ 部署成功完成！                ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}访问地址:${NC}    http://${DOMAIN:-$SERVER_IP}"
echo -e "  ${BOLD}后台地址:${NC}    http://${DOMAIN:-$SERVER_IP}/admin"
echo -e "  ${BOLD}应用目录:${NC}    ${APP_DIR}"
echo -e "  ${BOLD}数据库类型:${NC}  ${DB_TYPE}"
if [ "$DB_TYPE" = "mysql" ]; then
echo -e "  ${BOLD}数据库名:${NC}    ${MYSQL_DB}"
echo -e "  ${BOLD}数据库用户:${NC}  ${MYSQL_USER}"
echo -e "  ${BOLD}数据库密码:${NC}  ${MYSQL_PASS}  ${RED}(请妥善保管！)${NC}"
fi
echo ""
echo -e "  ${BOLD}后台初始账号:${NC}"
echo -e "    运行以下命令创建管理员账号:"
echo -e "    ${YELLOW}cd ${APP_DIR} && php artisan make:filament-user${NC}"
echo ""
echo -e "  ${BOLD}日志查看:${NC}"
echo -e "    ${YELLOW}tail -f ${APP_DIR}/storage/logs/laravel.log${NC}"
echo -e "    ${YELLOW}journalctl -u nginx -f${NC}"
echo ""
