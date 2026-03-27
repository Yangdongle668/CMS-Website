# 🔧 500错误排查和修复指南

## ⚡ 快速修复 (3步)

### Step 1: 清除缓存
```bash
cd /var/www/zufek
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Step 2: 重启服务
```bash
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
```

### Step 3: 运行诊断脚本
```bash
cd /var/www/zufek
sudo bash fix-500-error.sh
```

---

## 📋 详细排查步骤

### 问题1: 数据库连接失败

**症状**: 访问网站显示500，日志中有数据库错误

**修复**:
```bash
# 检查数据库文件
ls -la /var/www/zufek/database/

# 如果database.sqlite不存在，重新运行迁移
php artisan migrate --force

# 重新种植产品数据
php artisan db:seed --class=UpdateProductsEnglish
```

### 问题2: 权限问题

**症状**: 存储目录无法写入，日志无法创建

**修复**:
```bash
# 修复所有权
sudo chown -R www-data:www-data /var/www/zufek

# 修复权限
sudo chmod -R 755 /var/www/zufek
sudo chmod -R 775 /var/www/zufek/storage /var/www/zufek/bootstrap/cache

# 创建日志目录
mkdir -p /var/www/zufek/storage/logs
touch /var/www/zufek/storage/logs/laravel.log
sudo chmod 666 /var/www/zufek/storage/logs/laravel.log
```

### 问题3: 缓存问题

**症状**: 部署后仍显示旧内容或错误

**修复**:
```bash
# 一键清除所有缓存
php artisan optimize:clear

# 重新生成缓存
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 问题4: PHP错误

**症状**: 日志中显示PHP错误

**修复**:
```bash
# 查看详细错误日志
tail -100 /var/www/zufek/storage/logs/laravel.log

# 检查PHP版本
php --version

# 检查PHP扩展
php -m | grep -E "mbstring|json|pdo"

# 重启PHP-FPM
sudo systemctl restart php8.2-fpm
```

### 问题5: Nginx配置问题

**症状**: 某些页面404，但首页正常

**修复**:
```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -50 /var/log/nginx/error.log

# 重新加载Nginx
sudo systemctl reload nginx
```

---

## 🐛 常见500错误原因

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| Class not found | 类文件缺失或autoload错误 | `composer dump-autoload` |
| Database error | 数据库连接失败 | 检查database/database.sqlite |
| Permission denied | 文件权限不足 | `chmod -R 775 storage/` |
| Call to undefined | 方法或函数不存在 | `php artisan migrate` |
| Syntax error | PHP语法错误 | 检查最近修改的文件 |

---

## 🔍 完整诊断命令

```bash
# 1. 检查所有关键文件
echo "检查关键文件..."
test -f /var/www/zufek/artisan && echo "✅ artisan存在" || echo "❌ artisan缺失"
test -f /var/www/zufek/composer.json && echo "✅ composer.json存在" || echo "❌ composer.json缺失"
test -f /var/www/zufek/database/database.sqlite && echo "✅ 数据库存在" || echo "❌ 数据库缺失"

# 2. 检查PHP版本和扩展
echo "检查PHP环境..."
php --version
php -m | grep -E "json|pdo|mbstring|ctype"

# 3. 检查Composer依赖
echo "检查Composer..."
composer check-platform-reqs 2>&1 | head -20

# 4. 运行Laravel健康检查
echo "运行Laravel检查..."
php artisan about

# 5. 查看最近的错误
echo "查看错误日志..."
tail -20 /var/www/zufek/storage/logs/laravel.log
```

---

## ✅ 验证修复成功

运行以下命令验证一切正常：

```bash
# 1. 检查应用状态
php artisan tinker --execute="
echo '=== 应用检查 ===' . PHP_EOL;
echo '✅ 数据库连接: ' . (\DB::connection()->getDatabaseName() ? '成功' : '失败') . PHP_EOL;
echo '✅ 产品数量: ' . \App\Models\Product::count() . PHP_EOL;
echo '✅ 用户数量: ' . \App\Models\User::count() . PHP_EOL;
echo '✅ 页面sections: ' . \App\Models\PageSection::count() . PHP_EOL;
"

# 2. 检查Web访问
curl -I http://localhost/ 2>&1 | head -3

# 3. 检查admin访问
curl -I http://localhost/admin 2>&1 | head -3

# 4. 检查API
curl -s http://localhost/api/health 2>&1 || echo "无API端点"
```

---

## 📞 如果问题仍未解决

### 收集诊断信息
```bash
# 运行完整诊断
cd /var/www/zufek
sudo bash fix-500-error.sh > diagnostics.log 2>&1

# 查看诊断结果
cat diagnostics.log
```

### 检查关键日志
```bash
# Laravel日志
tail -100 /var/www/zufek/storage/logs/laravel.log

# Nginx日志
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log

# PHP-FPM日志
sudo journalctl -u php8.2-fpm -n 50
```

### 恢复数据库
```bash
# 删除所有表并重新迁移
php artisan migrate:refresh --force

# 重新种植数据
php artisan db:seed --class=UpdateProductsEnglish

# 重建缓存
php artisan optimize
```

---

## 🎯 预防措施

1. **定期备份**
```bash
# 每日备份数据库
0 2 * * * mysqldump -u root -p zufek > /backup/zufek-$(date +\%Y\%m\%d).sql
```

2. **监控日志**
```bash
# 实时监控日志
tail -f /var/www/zufek/storage/logs/laravel.log
```

3. **定期清理缓存**
```bash
# 在crontab中添加
0 */6 * * * cd /var/www/zufek && php artisan optimize:clear
```

4. **检查磁盘空间**
```bash
df -h /var/www/zufek
du -sh /var/www/zufek/storage/logs/
```

---

**祝修复顺利！** 🚀

如果遇到任何问题，请提供完整的错误日志。
