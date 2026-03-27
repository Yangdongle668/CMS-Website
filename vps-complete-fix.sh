#!/bin/bash

# 完整VPS诊断和修复脚本
set -e

echo "================================"
echo "🔧 完整VPS诊断和修复脚本"
echo "================================"
echo ""

cd /var/www/zufek

echo "1️⃣ 修复Git权限..."
git config --global --add safe.directory /var/www/zufek 2>/dev/null || true
git config --system --add safe.directory /var/www/zufek 2>/dev/null || true

echo "2️⃣ 检查Git状态..."
git status

echo ""
echo "3️⃣ 硬重置到远程分支..."
git fetch origin
git reset --hard origin/claude/b2b-battery-website-ilqmE
git clean -fd

echo ""
echo "4️⃣ 修复文件权限..."
sudo chown -R www-data:www-data /var/www/zufek
sudo chmod -R 755 /var/www/zufek
sudo chmod -R 775 /var/www/zufek/storage
sudo chmod -R 775 /var/www/zufek/bootstrap/cache

echo ""
echo "5️⃣ 清除所有缓存..."
rm -rf storage/framework/views/*
rm -rf storage/framework/cache/*
rm -f bootstrap/cache/compiled.php
php artisan view:clear || true
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true

echo ""
echo "6️⃣ 重新生成缓存..."
php artisan config:cache
php artisan route:cache

echo ""
echo "7️⃣ 检查数据库连接..."
php artisan tinker --execute="
try {
    \$conn = DB::connection();
    \$database = \$conn->getDatabaseName();
    echo '✅ 数据库连接正常: ' . \$database . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ 数据库连接错误: ' . \$e->getMessage() . PHP_EOL;
}
" 2>&1 || echo "⚠️ 数据库连接检查失败"

echo ""
echo "8️⃣ 重启所有服务..."
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx

echo ""
echo "9️⃣ 等待服务启动..."
sleep 3

echo ""
echo "🔟 测试主页..."
curl -s http://localhost/ > /tmp/test.html
if grep -q "ZUFEK\|Advanced" /tmp/test.html; then
    echo "✅ 主页加载成功"
else
    echo "❌ 主页加载失败，查看错误日志..."
fi

echo ""
echo "1️⃣1️⃣ 显示最新错误（最后50行）..."
echo "======================================="
tail -50 /var/www/zufek/storage/logs/laravel.log

echo ""
echo "1️⃣2️⃣ 显示Nginx错误..."
echo "======================================="
tail -20 /var/log/nginx/error.log 2>/dev/null || echo "未找到Nginx错误日志"

echo ""
echo "================================"
echo "✅ 诊断完成！"
echo "访问: http://103.213.247.116/"
echo "================================"
