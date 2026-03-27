# ZUFEK CMS Website

B2B enterprise website for **DONGGUAN ZUFEK TECHNOLOGY CO.,LTD** - a polymer lithium battery manufacturer. Built with Laravel 10, Filament v3 admin panel, and Tailwind CSS.

## Tech Stack

- **Backend**: Laravel 10, PHP 8.1+
- **Admin Panel**: Filament v3 (products, inquiries, CMS content, animations)
- **Frontend**: Blade templates, Tailwind CSS (CDN), AOS, GSAP, Swiper
- **Database**: SQLite (dev) / MySQL (production)
- **Build**: Vite 5, Laravel Vite Plugin
- **Auth**: Laravel Sanctum

## Features

- Product catalog with filtering (process type, application, capacity) and comparison
- 5 solution pages (Wound Cell, Stacked Cell, Wearables, Medical, IoT)
- Customer inquiry form with email notifications
- Filament admin panel for full content management
- CMS-managed page sections with 9 animation effects
- SEO: meta tags, Open Graph, JSON-LD Schema, sitemap generation
- GDPR cookie consent banner
- Responsive design with mobile navigation

## Quick Start (Local Development)

```bash
# 1. Clone & install
git clone https://github.com/yangdongle668/cms-website.git
cd cms-website
composer install
npm install

# 2. Environment setup
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed

# 3. Create admin user
php artisan make:filament-user

# 4. Start development servers
php artisan serve     # http://localhost:8000
npm run dev           # Vite HMR (separate terminal)
```

Admin panel: `http://localhost:8000/admin`

## Project Structure

```
app/
  Filament/Resources/     # Admin: Product, Inquiry, PageSection, SiteContent, AnimationEffect
  Http/Controllers/       # ProductController, InquiryController, SolutionController
  Models/                 # Product, Inquiry, PageSection, SiteContent, AnimationEffect, User
  Mail/                   # InquiryReceived (email notification)
resources/views/
  layouts/app.blade.php   # Main layout (nav, footer, cookie banner)
  home.blade.php          # Homepage with 7 sections
  products/               # index, show, compare
  solutions/              # index, wound-cell, stacked-cell, wearables, medical, iot
  inquiries/create.blade.php
routes/web.php            # All frontend routes
config/                   # Standard Laravel config files
database/migrations/      # 10 migration files
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage (6 featured products) |
| `/products` | Product listing with filters & sort |
| `/products/compare` | Compare 2-4 products side by side |
| `/products/{slug}` | Product detail page |
| `/solutions` | Solutions overview |
| `/solutions/{type}` | wound-cell, stacked-cell, wearables, medical, iot |
| `/contact` | Inquiry/quote form |
| `/about` | About company |
| `/privacy` | Privacy policy |
| `/cookies` | Cookie policy |
| `/admin` | Filament admin panel |

## Production Deployment (VPS)

### Prerequisites

- Ubuntu 20.04+ or Debian 11+
- PHP 8.1+ with extensions: mbstring, xml, curl, zip, sqlite3/mysql, gd, bcmath
- Composer 2.x
- Node.js 18+ & npm
- Nginx
- MySQL (optional, SQLite works for small sites)

### One-Click Deploy

```bash
sudo bash deploy.sh
```

The `deploy.sh` script handles: PHP/Nginx installation, Composer/npm dependencies, database migration, Vite build, Nginx config, SSL (Let's Encrypt), and service setup.

### Manual Deploy

```bash
# On server
cd /var/www/zufek
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo systemctl restart php8.2-fpm nginx
```

### Auto-Update via Webhook

Set up GitHub webhook pointing to your server using `webhook-deploy.sh`. It will auto-pull and rebuild on push.

### Update Script

```bash
sudo bash update.sh
```

Handles: git pull, composer update, npm build, migrations, cache clear, service restart.

## Environment Configuration

Key `.env` variables for production:

```env
APP_NAME="ZUFEK Battery"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql          # or sqlite
DB_HOST=127.0.0.1
DB_DATABASE=cms_website
DB_USERNAME=your_user
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
```

## Admin Panel Guide

Access at `/admin` after creating a user via `php artisan make:filament-user`.

**Modules:**
- **Products** - CRUD for battery products with specs, images, SEO fields
- **Inquiries** - View/manage customer contact submissions
- **Page Sections** - Edit homepage/about/solutions content blocks (drag to reorder)
- **Site Content** - Global settings (navigation, footer, contact info)
- **Animation Effects** - Configure 9 animation types per section (fadeIn, slideIn, scaleIn, pulse, bounce, glow)

**Dashboard widgets:** Stats overview, latest products, content update log.

## Troubleshooting

**500 Error after deploy:**
```bash
php artisan config:clear
php artisan cache:clear
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

**Database issues:**
```bash
# SQLite: ensure file exists
touch database/database.sqlite
php artisan migrate

# MySQL: check credentials in .env
php artisan migrate:status
```

**Assets not loading:**
```bash
npm run build                    # Rebuild Vite assets
php artisan view:clear           # Clear cached views
```

## License

MIT
