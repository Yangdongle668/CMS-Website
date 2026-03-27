#!/bin/bash

# VPS 最终修复脚本 - 解决PHP版本兼容性问题
set -e

echo "================================"
echo "🔧 VPS 最终修复脚本"
echo "================================"
echo ""

cd /var/www/zufek

# 1. 修复Git权限
echo "1️⃣ 修复Git权限..."
git config --global --add safe.directory /var/www/zufek 2>/dev/null || true

# 2. 更新代码到最新版本
echo "2️⃣ 拉取最新代码..."
git fetch origin
git reset --hard origin/claude/b2b-battery-website-ilqmE
git status

# 3. 检查composer.lock
echo ""
echo "3️⃣ 检查composer.lock中的PHP版本要求..."
tail -10 composer.lock | grep -A 5 "platform"

# 4. 删除vendor和重新安装
echo ""
echo "4️⃣ 清除vendor并重新安装..."
rm -rf vendor/
rm -rf bootstrap/cache/*

# 使用composer install（从lock文件安装）而不是composer update
composer install --no-dev --optimize-autoloader --no-interaction

# 5. 检查安装是否成功
echo ""
echo "5️⃣ 验证PHP兼容性..."
php artisan --version

# 6. 清除所有缓存
echo ""
echo "6️⃣ 清除所有缓存..."
rm -rf storage/framework/views/*
rm -rf storage/framework/cache/*
rm -f bootstrap/cache/compiled.php

php artisan view:clear || true
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true

# 7. 重新生成缓存
echo ""
echo "7️⃣ 重新生成缓存..."
php artisan config:cache
php artisan route:cache

# 8. 修复权限
echo ""
echo "8️⃣ 修复文件权限..."
sudo chown -R www-data:www-data /var/www/zufek
sudo chmod -R 755 /var/www/zufek
sudo chmod -R 775 /var/www/zufek/storage
sudo chmod -R 775 /var/www/zufek/bootstrap/cache

# 9. 重启服务
echo ""
echo "9️⃣ 重启服务..."
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx

sleep 2

# 10. 测试
echo ""
echo "🔟 测试网站..."
http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$http_code" = "200" ]; then
    echo "✅ 网站可访问 (HTTP $http_code)"
else
    echo "⚠️  HTTP状态: $http_code（如果是301/302则为重定向，正常）"
fi

# 11. 显示日志
echo ""
echo "1️⃣1️⃣ 最新错误日志（如果有）："
echo "================================="
tail -30 /var/www/zufek/storage/logs/laravel.log | grep -i error || echo "✅ 无错误"

echo ""
echo "================================"
echo "✅ 修复完成！"
echo "================================"
echo ""
echo "访问网站: http://103.213.247.116/"
echo "如有问题，查看完整日志:"
echo "  tail -100 /var/www/zufek/storage/logs/laravel.log"
