# 🚀 ZUFEK CMS Website - 部署与更新指南

## 📋 目录
- [快速更新](#快速更新)
- [自动化部署](#自动化部署)
- [Webhook自动部署](#webhook自动部署)
- [故障排查](#故障排查)

---

## ⚡ 快速更新

### 最简单的方式：一键更新

```bash
# 在VPS上执行
cd /var/www/zufek
sudo bash update.sh
```

这个脚本会自动：
1. ✅ 拉取最新代码
2. ✅ 更新PHP依赖
3. ✅ 更新前端依赖
4. ✅ 构建前端资源
5. ✅ 运行数据库迁移
6. ✅ 清除缓存
7. ✅ 重启服务

**耗时**: 通常3-5分钟

---

## 🔧 自动化部署选项

### 方式1：使用update.sh脚本 (推荐)

#### 1️⃣ 首次设置（在VPS上执行）

```bash
# SSH连接到VPS
ssh root@your_vps_ip

# 进入应用目录
cd /var/www/zufek

# 给脚本执行权限
chmod +x update.sh

# 创建快捷命令（可选）
sudo ln -sf /var/www/zufek/update.sh /usr/local/bin/zufek-update
```

#### 2️⃣ 之后每次更新只需

```bash
# 方式 A: 直接运行脚本
sudo bash /var/www/zufek/update.sh

# 方式 B: 使用快捷命令（如果创建了符号链接）
sudo zufek-update
```

---

### 方式2：手动执行更新步骤

```bash
cd /var/www/zufek

# 1. 更新代码
git fetch origin
git pull origin claude/b2b-battery-website-ilqmE

# 2. 更新PHP依赖
composer update --no-dev --optimize-autoloader

# 3. 更新前端
npm ci
npm run build

# 4. 数据库迁移
php artisan migrate --force

# 5. 清除缓存
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. 重启服务
systemctl restart nginx php8.2-fpm
```

---

## 🔔 Webhook自动部署

### 什么是Webhook？
提交代码到GitHub后，自动在VPS上部署。完全自动化！

### 配置步骤

#### 1️⃣ 在VPS上安装webhook服务

```bash
# 安装webhook
apt-get install -y webhook

# 给脚本执行权限
chmod +x /var/www/zufek/webhook-deploy.sh

# 创建webhook配置文件
sudo tee /etc/webhook.conf > /dev/null <<'EOF'
[
  {
    "id": "zufek-deploy",
    "execute-command": "/var/www/zufek/webhook-deploy.sh",
    "command-working-directory": "/var/www/zufek",
    "response-message": "Deploying..."
  }
]
EOF

# 启动webhook服务
sudo systemctl restart webhook
sudo systemctl enable webhook

# 验证webhook是否运行
curl http://localhost:9000/hooks/zufek-deploy
```

#### 2️⃣ 配置GitHub Webhook

1. 进入 GitHub 仓库 > Settings > Webhooks
2. 点击 "Add webhook"
3. 填写以下信息：
   - **Payload URL**: `http://your_vps_ip:9000/hooks/zufek-deploy`
   - **Content type**: `application/json`
   - **Events**: 选择 "Push events"
   - **Active**: ✅ 勾选

4. 点击 "Add webhook"

#### 3️⃣ 测试webhook

推送一个测试提交：

```bash
git commit --allow-empty -m "Test webhook deployment"
git push origin claude/b2b-battery-website-ilqmE
```

检查VPS日志：

```bash
tail -f /var/log/zufek-deploy.log
```

---

## 📊 更新状态监控

### 查看部署日志

```bash
# Webhook部署日志
tail -f /var/log/zufek-deploy.log

# 应用日志
tail -f /var/www/zufek/storage/logs/laravel.log

# Nginx日志
tail -f /var/log/nginx/error.log

# PHP-FPM日志
journalctl -u php8.2-fpm -f
```

### 实时监控部署过程

```bash
# 监控磁盘使用
watch -n 1 'df -h /var/www/zufek'

# 监控进程
watch -n 1 'ps aux | grep -E "nginx|php"'
```

---

## 🔐 安全建议

### 1. 保护webhook端口
```bash
# 使用防火墙限制webhook端口（可选）
ufw allow from your_ip_address to any port 9000
```

### 2. 验证webhook来源
webhook可以配置GitHub密钥验证：

```bash
# 生成密钥
openssl rand -hex 32

# 在GitHub webhook中添加 Secret
```

### 3. 定期备份
```bash
# 备份数据库
mysqldump -u zufek -p zufek_cms > ~/backup-$(date +%Y%m%d).sql

# 备份SQLite
cp /var/www/zufek/database/database.sqlite ~/backup-sqlite-$(date +%Y%m%d)
```

---

## ❌ 故障排查

### 问题1: 更新脚本权限不足

```bash
# 解决方案
sudo chown -R www-data:www-data /var/www/zufek
sudo chmod -R 755 /var/www/zufek
sudo chmod -R 775 /var/www/zufek/storage /var/www/zufek/bootstrap/cache
```

### 问题2: Composer依赖冲突

```bash
# 清除Composer缓存
composer clear-cache

# 重新安装
composer install --no-dev --optimize-autoloader
```

### 问题3: NPM构建失败

```bash
# 清除NPM缓存
npm cache clean --force

# 重新安装和构建
rm -rf node_modules package-lock.json
npm ci
npm run build
```

### 问题4: 数据库迁移失败

```bash
# 检查迁移状态
php artisan migrate:status

# 重新运行迁移
php artisan migrate:refresh --force

# 重新种植数据
php artisan db:seed --class=ProductSeeder --force
```

### 问题5: Webhook日志权限

```bash
# 确保日志目录可写
sudo mkdir -p /var/log
sudo chmod 777 /var/log
sudo touch /var/log/zufek-deploy.log
sudo chmod 666 /var/log/zufek-deploy.log
```

---

## 📅 定时自动更新（可选）

### 使用cron定时更新

```bash
# 编辑crontab
sudo crontab -e

# 添加以下行（每天凌晨2点检查更新）
0 2 * * * /var/www/zufek/update.sh >> /var/log/zufek-cron.log 2>&1
```

---

## 📞 常见命令快速参考

```bash
# 一键更新
sudo bash /var/www/zufek/update.sh

# 查看部署日志
tail -f /var/log/zufek-deploy.log

# 查看应用日志
tail -f /var/www/zufek/storage/logs/laravel.log

# 检查服务状态
systemctl status nginx php8.2-fpm

# 重启服务
systemctl restart nginx php8.2-fpm

# 检查数据库
php artisan tinker

# 清除所有缓存
php artisan cache:clear && php artisan config:clear

# 检查磁盘
df -h
```

---

## ✨ 最佳实践

1. **推送前测试**: 在本地测试后再推送
2. **定期备份**: 部署前备份数据库
3. **监控日志**: 部署后检查日志确保无错误
4. **版本控制**: 使用git标签标记发布版本
5. **缓存清理**: 更新后清除浏览器缓存

---

## 📝 更新检查清单

- [ ] 代码已推送到正确分支
- [ ] 本地测试通过
- [ ] 数据库备份已创建
- [ ] 运行 `update.sh` 脚本
- [ ] 检查部署日志无错误
- [ ] 访问网站验证更新成功
- [ ] 清除浏览器缓存

---

**需要帮助？** 查看主 [README.md](README.md) 或检查日志文件获取更多信息。
