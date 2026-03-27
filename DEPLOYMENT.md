# B2B Battery Website - Deployment Guide

## Project Overview

This is a Laravel 10 + Filament Admin Panel B2B e-commerce website for battery products. It includes:

- **Admin Panel**: Filament-based product and inquiry management
- **Frontend**: Customer-facing website with product listing and inquiry forms
- **SEO**: Complete SEO optimization with meta tags, sitemap, and schema.org
- **GDPR Compliance**: Cookie banner and privacy policies
- **Email**: Automated admin notifications for inquiries

## Local Development Setup

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 16+ (for asset compilation)
- MySQL 8+ or SQLite (default)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd cms-website
composer install
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Database setup:**
```bash
# For SQLite (default - no additional setup needed)
touch database/database.sqlite

# For MySQL:
# - Update DB_CONNECTION, DB_HOST, DB_USERNAME, DB_PASSWORD in .env
# - Create database: mysql -u root -p -e "CREATE DATABASE cms_website;"
```

4. **Run migrations:**
```bash
php artisan migrate
```

5. **Seed test data:**
```bash
php artisan db:seed
```

6. **Generate SEO sitemap:**
```bash
php artisan sitemap:generate
```

7. **Start development server:**
```bash
php artisan serve
```

8. **Compile assets (in another terminal):**
```bash
npm run dev
```

Visit:
- Frontend: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## Admin Login

Default credentials (created during setup):
- **Email:** admin@example.com
- **Password:** password

**Change password immediately in production!**

## Email Configuration

### Development (Testing)

1. Set `MAIL_MAILER=log` in `.env` - emails will be saved to `storage/logs`
2. Check `storage/logs/laravel.log` to verify email sending

### Production (Gmail)

1. Enable 2-factor authentication on Gmail
2. Generate [App Password](https://myaccount.google.com/apppasswords)
3. Update `.env`:
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### Production (Other SMTP Providers)

- **SendGrid**: https://sendgrid.com/docs/for-developers/sending-email/php/
- **Zoho Mail**: https://www.zoho.com/mail/help/smtp-configuration.html
- **AWS SES**: https://docs.aws.amazon.com/ses/latest/dg/send-email-set-up.html

## Production Deployment

### 1. Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring \
    php8.2-xml php8.2-curl php8.2-zip composer nginx mysql-server

# Create application directory
sudo mkdir -p /var/www/cms-website
sudo chown $USER:$USER /var/www/cms-website
```

### 2. Deploy Application

```bash
cd /var/www/cms-website

# Clone repository
git clone <repository-url> .

# Install dependencies
composer install --optimize-autoloader --no-dev

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database
# - Update .env with MySQL credentials
# - Create database in MySQL
php artisan migrate --force
php artisan db:seed

# Setup file storage
php artisan storage:link
chmod -R 755 storage bootstrap/cache

# Compile assets
npm install
npm run build

# Generate sitemap
php artisan sitemap:generate
```

### 3. Nginx Configuration

Create `/etc/nginx/sites-available/cms-website`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/cms-website/public;
    index index.php;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/cms-website/public;
    index index.php;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Laravel rewrite rules
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /\.env {
        deny all;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cms-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

Renewal is automatic with Let's Encrypt.

### 5. Database Backups

Setup automated daily backups:

```bash
# Create backup script: /usr/local/bin/backup-cms.sh
#!/bin/bash
BACKUP_DIR="/backups/cms-website"
DB_NAME="cms_website"
DB_USER="cms_user"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | \
    gzip > $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

# Add to crontab:
# 0 2 * * * /usr/local/bin/backup-cms.sh
```

### 6. Monitoring & Logs

```bash
# View application logs
tail -f /var/www/cms-website/storage/logs/laravel.log

# View Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# View PHP-FPM logs
tail -f /var/log/php8.2-fpm.log
```

## Maintenance Tasks

### Regular Updates

```bash
# Update Composer dependencies
composer update

# Run migrations (if any new ones)
php artisan migrate

# Update npm packages
npm update

# Rebuild assets
npm run build
```

### Clearing Caches

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Regenerate Sitemap

```bash
php artisan sitemap:generate
```

### Database Maintenance

```bash
# Run migrations
php artisan migrate

# Seed demo data (only in development)
php artisan db:seed
```

## Security Checklist

- [ ] Change admin password from default
- [ ] Set `APP_DEBUG=false` in production
- [ ] Configure proper `.env` file with strong values
- [ ] Enable HTTPS/SSL
- [ ] Setup automated backups
- [ ] Configure email notifications
- [ ] Review and adjust CORS settings
- [ ] Setup file upload restrictions
- [ ] Enable database passwords
- [ ] Setup fail2ban or similar for brute force protection
- [ ] Regularly update dependencies (`composer update`)

## Troubleshooting

### Admin panel not loading

```bash
php artisan filament:install --panels
php artisan cache:clear
php artisan route:clear
```

### Emails not sending

1. Check `storage/logs/laravel.log`
2. Verify SMTP credentials in `.env`
3. Check firewall/port 587 access
4. Test with: `php artisan tinker` > `Mail::raw('test', fn($m) => $m->to('test@example.com'));`

### Database migration errors

```bash
# Rollback last migration
php artisan migrate:rollback

# Rollback all
php artisan migrate:reset

# Migrate fresh (warning: loses data)
php artisan migrate:fresh --seed
```

## Support

For issues or questions:
- Check logs in `storage/logs/laravel.log`
- Review Laravel documentation: https://laravel.com/docs
- Check Filament documentation: https://filamentphp.com/docs

## License

This project is proprietary and confidential.
