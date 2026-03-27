#!/bin/bash

# Complete VPS 500 Error Fix Script
# Run this on your VPS server

set -e

echo "🔧 Starting comprehensive VPS fix..."
echo ""

cd /var/www/zufek || exit 1

echo "1️⃣ Pulling latest code from git..."
git fetch origin
git reset --hard origin/claude/b2b-battery-website-ilqmE
git clean -fd

echo ""
echo "2️⃣ Installing/updating dependencies..."
composer install --no-dev --optimize-autoloader

echo ""
echo "3️⃣ Clearing ALL Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
rm -rf bootstrap/cache/compiled.php

echo ""
echo "4️⃣ Running database migrations..."
php artisan migrate --force

echo ""
echo "5️⃣ Running optimizations..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache

echo ""
echo "6️⃣ Fixing file permissions..."
sudo chown -R www-data:www-data /var/www/zufek
sudo chmod -R 755 /var/www/zufek
sudo chmod -R 775 /var/www/zufek/storage /var/www/zufek/bootstrap/cache

echo ""
echo "7️⃣ Restarting services..."
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm

echo ""
echo "8️⃣ Testing connectivity..."
curl -s http://localhost/ > /dev/null 2>&1 && echo "✅ Local test passed" || echo "❌ Local test failed"

echo ""
echo "================================"
echo "✅ VPS Fix Complete!"
echo "================================"
echo ""
echo "Try accessing: http://103.213.247.116/"
echo ""
echo "If still having issues, check logs:"
echo "tail -100 /var/www/zufek/storage/logs/laravel.log"
