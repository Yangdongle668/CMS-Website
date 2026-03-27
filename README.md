# 🔋 ZUFEK 聚合物锂电池 B2B 电商网站

<div align="center">

![Laravel](https://img.shields.io/badge/Laravel-10.10-red?logo=laravel)
![PHP](https://img.shields.io/badge/PHP-8.1+-777BB4?logo=php)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0+-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green)

**DONGGUAN ZUFEK TECHNOLOGY CO.,LTD** - 专业聚合物锂电池供应商

[访问网站](#快速开始) • [功能特性](#功能特性) • [VPS部署](#vps一键部署) • [开发指南](#开发指南)

</div>

---

## 📋 项目概述

ZUFEK 聚合物锂电池 B2B 电商网站是一个现代化的企业级电池供应商展示和销售平台，专门为可穿戴设备和医疗设备制造商提供高品质的聚合物锂电池解决方案。

### 🎯 企业信息

- **公司名称**: DONGGUAN ZUFEK TECHNOLOGY CO.,LTD
- **成立年份**: 2018年
- **生产基地**: 中国 广东 东莞
- **主要产品**: 卷绕工艺电池、叠片工艺电池、异形定制电池
- **目标客户**: 可穿戴设备、医疗设备制造商

---

## ✨ 功能特性

### 🏠 首页
- ✅ 动画化Hero区域（parallax效果、渐变背景）
- ✅ 公司简介与核心优势展示
- ✅ 工艺技术对比（卷绕vs叠片）
- ✅ 异形电池定制能力展示
- ✅ 特色产品轮播展示
- ✅ 专业CTA区域

### 📦 产品管理
- ✅ 高级产品过滤系统
  - 工艺类型过滤（卷绕工艺、叠片工艺）
  - 应用领域过滤（可穿戴设备、医疗设备）
  - 容量范围过滤（300-600 / 600-1000 / 1000-2000 / 2000+ mAh）
  - 智能排序（默认、容量升序/降序、内阻升序）
- ✅ 动态产品网格展示
- ✅ 产品卡片包含15+技术参数
- ✅ 工艺类型彩色标签（绿色卷绕、紫色叠片）

### ⚖️ 产品对比页面
- ✅ 支持2-4个产品对比
- ✅ 完整技术参数对比表格
- ✅ 交互式产品选择
- ✅ 实时列表显示/隐藏

### 📧 询盘系统
- ✅ 产品预选询盘
- ✅ 自动邮件通知
- ✅ 表单验证和错误处理

### 🎨 设计与交互
- ✅ 现代化响应式设计（Mobile First）
- ✅ Tailwind CSS 美观UI
- ✅ 12种自定义Tailwind动画
- ✅ AOS (Animate On Scroll) 滚动动画
- ✅ GSAP 高级动画库
- ✅ Swiper 触摸滑块库
- ✅ 平滑过渡和悬停效果
- ✅ Font Awesome 6.4 图标库

### 🧭 导航与页脚
- ✅ 专业导航栏（ZUFEK品牌）
- ✅ 产品下拉菜单
- ✅ 移动响应式汉堡菜单
- ✅ 完整页脚（公司信息、快速链接、联系方式）

### 🔐 后台管理（Filament Admin）
- ✅ 产品管理（12个聚合物电池专用字段）
- ✅ 工艺类型选择（卷绕/叠片）
- ✅ 技术参数管理
  - 容量、电压、内阻、循环寿命
  - 能量密度、工作温度、重量
- ✅ 应用领域和定制说明
- ✅ 认证信息管理
- ✅ SEO字段（Meta Title/Description）

### 🎯 SEO优化
- ✅ Schema.org JSON-LD 结构化数据
- ✅ 中文SEO关键词优化
- ✅ Meta标签完整配置
- ✅ 规范链接和Open Graph

### 🍪 用户体验
- ✅ GDPR合规Cookie同意书
- ✅ 隐私政策页面
- ✅ Cookie政策页面
- ✅ 平滑页面加载

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **后端框架** | Laravel 10.10 |
| **PHP版本** | 8.1+ |
| **数据库** | SQLite (开发) / MySQL (生产) |
| **前端框架** | Tailwind CSS 3.0 |
| **前端库** | Vue.js / Alpine.js |
| **构建工具** | Vite 5.0 |
| **包管理** | Composer / npm |
| **动画库** | AOS 2.3, GSAP 3.14, Swiper 12.1 |
| **UI库** | Filament Admin v3.3 |
| **服务器** | Nginx / Apache |
| **服务器OS** | Ubuntu 20.04+ / Debian 11+ |

---

## 📊 数据库结构

### Products 表
```
id, name, model, description, image
capacity (mAh), voltage (V), size
process_type (wound/stacked), internal_resistance (mΩ)
capacity_min, capacity_max, cycle_life, energy_density
applications, certifications, customization_info
highlights, operating_temperature, weight
slug, meta_title, meta_description
```

### Inquiries 表
```
id, product_id, customer_name, email, phone
company, message, created_at
```

---

## 🚀 快速开始

### 本地开发环境

#### 前置要求
- PHP 8.1+
- Composer
- Node.js 18+
- Git

#### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/Yangdongle668/CMS-Website.git
cd CMS-Website
git checkout claude/b2b-battery-website-ilqmE
```

2. **安装PHP依赖**
```bash
composer install
```

3. **配置.env文件**
```bash
cp .env.example .env
php artisan key:generate
```

4. **安装Node.js依赖**
```bash
npm install
```

5. **构建前端资源**
```bash
npm run dev      # 开发模式（热重载）
npm run build    # 生产构建
```

6. **数据库迁移**
```bash
php artisan migrate
php artisan db:seed  # 填充示例产品数据
```

7. **创建后台管理员账号**
```bash
php artisan make:filament-user
```

8. **启动开发服务器**
```bash
php artisan serve
```

访问应用: http://localhost:8000
后台管理: http://localhost:8000/admin

---

## 🖥️ VPS 一键部署

### 系统要求
- Ubuntu 20.04 / 22.04 / Debian 11+
- 2GB 内存（推荐4GB+）
- 20GB 硬盘空间
- Root 或 sudo 权限

### 部署方法

#### 方法1：直接从GitHub下载运行（推荐）

```bash
sudo bash -c "curl -fsSL https://raw.githubusercontent.com/Yangdongle668/CMS-Website/claude/b2b-battery-website-ilqmE/deploy.sh | bash"
```

#### 方法2：手动下载后运行

```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/Yangdongle668/CMS-Website/claude/b2b-battery-website-ilqmE/deploy.sh

# 修改执行权限
chmod +x deploy.sh

# 编辑配置（可选）
nano deploy.sh
# 修改顶部的配置变量：
# - DOMAIN="你的域名.com"
# - DB_TYPE="sqlite" 或 "mysql"
# - INSTALL_SSL=true (需要有效域名)
# - PHP_VERSION="8.2"

# 运行部署
sudo bash deploy.sh
```

### 部署脚本做什么

脚本会自动执行以下步骤：

| 步骤 | 内容 |
|------|------|
| 1 | 更新系统，安装基础工具 (git, curl, unzip) |
| 2 | 安装 PHP 8.2 + FPM + 所有扩展 |
| 3 | 安装 Composer |
| 4 | 安装 Node.js 18 + npm |
| 5 | 安装 Nginx |
| 6 | 安装 MySQL（可选） |
| 7 | 克隆/更新代码仓库 |
| 8 | composer update + npm build + .env配置 + 数据库迁移 |
| 9 | Nginx虚拟主机配置 + 启动所有服务 |

### 部署后步骤

1. **创建管理员账号**
```bash
cd /var/www/zufek
php artisan make:filament-user
```

2. **配置域名DNS（如有）**
```bash
# 将A记录指向服务器IP
A记录: zufek.com -> 你的VPS_IP
```

3. **安装SSL证书（HTTPS）**
```bash
# 如果部署时选择了 INSTALL_SSL=true，证书已自动安装
# 否则手动运行：
sudo certbot --nginx -d zufek.com
```

### 部署配置示例

编辑 `deploy.sh` 顶部变量：

```bash
# GitHub仓库
REPO_URL="https://github.com/Yangdongle668/CMS-Website.git"
BRANCH="claude/b2b-battery-website-ilqmE"

# 部署位置
APP_DIR="/var/www/zufek"

# 你的域名
DOMAIN="zufek.com"

# 数据库类型
DB_TYPE="sqlite"      # 或 "mysql"

# MySQL配置（仅当 DB_TYPE="mysql" 时）
MYSQL_DB="zufek_cms"
MYSQL_USER="zufek"
MYSQL_PASS=""         # 留空自动生成随机密码

# PHP版本
PHP_VERSION="8.2"     # 8.1, 8.2, 8.3

# 自动安装 Let's Encrypt SSL
INSTALL_SSL=false     # 改为 true 启用HTTPS
```

### 部署完成后

部署脚本完成后会显示：

```
╔══════════════════════════════════════════════╗
║            ✅ 部署成功完成！                ║
╚══════════════════════════════════════════════╝

  访问地址:     http://zufek.com
  后台地址:     http://zufek.com/admin
  应用目录:     /var/www/zufek
  数据库类型:   sqlite

  后台初始账号:
    运行以下命令创建管理员账号:
    cd /var/www/zufek && php artisan make:filament-user

  日志查看:
    tail -f /var/www/zufek/storage/logs/laravel.log
    journalctl -u nginx -f
```

### 常见问题

#### Q: 部署出现 "composer lock file 不兼容"
**A:** 脚本会自动运行 `composer update` 解决依赖冲突

#### Q: 如何备份数据库？
```bash
# SQLite 备份
cp /var/www/zufek/database/database.sqlite /var/www/zufek/database/database.sqlite.backup

# MySQL 备份
mysqldump -u zufek -p zufek_cms > ~/backup.sql
```

#### Q: 如何更新代码？
```bash
cd /var/www/zufek
git fetch origin
git pull origin claude/b2b-battery-website-ilqmE
composer update
npm ci && npm run build
php artisan migrate
systemctl restart nginx
```

#### Q: 如何查看部署日志？
```bash
# 应用日志
tail -f /var/www/zufek/storage/logs/laravel.log

# Nginx日志
tail -f /var/log/nginx/error.log

# PHP-FPM日志
journalctl -u php8.2-fpm -f
```

---

## 📁 项目结构

```
CMS-Website/
├── app/
│   ├── Models/
│   │   └── Product.php          # 产品模型（12个字段）
│   ├── Http/Controllers/
│   │   ├── ProductController.php
│   │   └── InquiryController.php
│   └── Mail/
│       └── InquiryReceived.php
├── database/
│   ├── migrations/
│   │   └── *_add_polymer_battery_fields_to_products.php
│   └── seeders/
│       └── ProductSeeder.php    # 6个示例产品
├── resources/
│   ├── views/
│   │   ├── layouts/app.blade.php      # 主布局
│   │   ├── home.blade.php             # 首页
│   │   ├── products/
│   │   │   ├── index.blade.php        # 产品列表+过滤
│   │   │   ├── show.blade.php         # 产品详情
│   │   │   └── compare.blade.php      # 产品对比
│   │   └── about.blade.php            # 关于页面
│   ├── js/
│   │   └── app.js                     # 动画库初始化
│   └── css/
│       └── app.css
├── public/
│   └── build/                         # Vite构建输出
├── routes/
│   └── web.php                        # 路由定义
├── deploy.sh                          # VPS一键部署脚本 ⭐
├── .env.example
├── composer.json
├── package.json
├── tailwind.config.js                 # 自定义动画配置
├── vite.config.js
└── README.md                          # 本文件
```

---

## 🔐 安全特性

- ✅ CSRF保护
- ✅ GDPR Cookie同意书
- ✅ SQL注入防护（ORM）
- ✅ XSS防护
- ✅ 强制HTTPS（生产环境）
- ✅ 安全HTTP头配置
- ✅ 文件权限正确配置

---

## 📈 SEO优化

- ✅ 中文关键词：聚合物锂电池、异形电池、卷绕工艺、叠片工艺
- ✅ Schema.org JSON-LD结构化数据
- ✅ Open Graph社交分享
- ✅ Mobile-friendly响应式设计
- ✅ 快速页面加载（Nginx Gzip压缩）
- ✅ 正规链接和Meta标签

---

## 🎨 自定义

### 修改公司信息
编辑 `resources/views/layouts/app.blade.php` 和 `resources/views/home.blade.php`:
```blade
ZUFEK -> 你的公司名
东莞 -> 你的城市
```

### 修改主题颜色
编辑 `tailwind.config.js`:
```js
// 修改蓝色为其他颜色
from-blue-600 -> from-green-600
```

### 添加产品
1. 进入后台 `/admin`
2. 点击 Products
3. 填写所有字段（包括工艺类型、技术参数等）
4. 保存

---

## 📱 响应式设计

- ✅ 移动端 (< 640px)
- ✅ 平板端 (640px - 1024px)
- ✅ 桌面端 (> 1024px)
- ✅ 超大屏 (> 1280px)

---

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 👥 贡献

欢迎提交 Pull Request 或报告 Issues！

---

## 📧 联系方式

**DONGGUAN ZUFEK TECHNOLOGY CO.,LTD**

- 📧 邮箱: sales@zufek.com
- 📞 电话: +86 138 0013 8000
- 📍 地址: 中国 广东 东莞

---

<div align="center">

Made with ❤️ by ZUFEK Team

</div>
