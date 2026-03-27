#!/bin/bash

# ZUFEK CMS - 500错误诊断和修复脚本

echo "🔍 开始诊断ZUFEK网站问题..."
echo ""

# 1. 检查目录结构
echo "1️⃣ 检查应用目录..."
if [ -d "/var/www/zufek" ]; then
    echo "✅ 应用目录存在"
    cd /var/www/zufek
else
    echo "❌ 应用目录不存在"
    echo "请确保代码已部署到 /var/www/zufek"
    exit 1
fi

# 2. 清除所有缓存
echo ""
echo "2️⃣ 清除缓存..."
php artisan config:clear && echo "✅ Config缓存已清除"
php artisan cache:clear && echo "✅ Cache已清除"
php artisan view:clear && echo "✅ View已清除"
php artisan route:clear && echo "✅ Route已清除"

# 3. 重新生成缓存
echo ""
echo "3️⃣ 重新生成缓存..."
php artisan config:cache && echo "✅ Config缓存已生成"
php artisan route:cache && echo "✅ Route缓存已生成"

# 4. 检查权限
echo ""
echo "4️⃣ 检查和修复权限..."
sudo chown -R www-data:www-data /var/www/zufek && echo "✅ 所有权已修复"
sudo chmod -R 755 /var/www/zufek && echo "✅ 目录权限已修复"
sudo chmod -R 775 /var/www/zufek/storage /var/www/zufek/bootstrap/cache && echo "✅ 存储权限已修复"

# 5. 检查数据库
echo ""
echo "5️⃣ 检查数据库..."
php artisan tinker --execute="
try {
    \DB::connection()->getPdo();
    echo '✅ 数据库连接成功' . PHP_EOL;
} catch (\Exception \$e) {
    echo '❌ 数据库连接失败: ' . \$e->getMessage() . PHP_EOL;
}
" 2>&1 | grep -E "✅|❌"

# 6. 检查迁移
echo ""
echo "6️⃣ 检查数据库迁移..."
php artisan migrate:status 2>&1 | tail -3

# 7. 检查服务
echo ""
echo "7️⃣ 检查服务状态..."
echo "Nginx状态:"
sudo systemctl status nginx --no-pager 2>&1 | head -3
echo ""
echo "PHP-FPM状态:"
sudo systemctl status php8.2-fpm --no-pager 2>&1 | head -3

# 8. 重启服务
echo ""
echo "8️⃣ 重启Web服务..."
sudo systemctl restart nginx && echo "✅ Nginx已重启"
sudo systemctl restart php8.2-fpm && echo "✅ PHP-FPM已重启"

# 9. 测试访问
echo ""
echo "9️⃣ 测试本地访问..."
curl -s http://localhost/ > /dev/null 2>&1 && echo "✅ 本地访问成功" || echo "❌ 本地访问失败"

# 10. 最终信息
echo ""
echo "================================"
echo "✅ 诊断和修复完成！"
echo "================================"
echo ""
echo "📍 访问地址:"
echo "  前端: http://your_vps_ip/"
echo "  后台: http://your_vps_ip/admin"
echo ""
echo "📋 如果仍有问题，查看日志:"
echo "  tail -f /var/www/zufek/storage/logs/laravel.log"
echo ""
