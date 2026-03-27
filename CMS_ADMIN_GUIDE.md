# 🎛️ ZUFEK CMS 后台管理系统使用指南

## 📍 登录方式

### 访问地址
```
http://your_vps_ip/admin
```

### 登录凭证
```
邮箱: info@zufek.com
密码: danli1219
```

### 如果遇到登录问题
1. **清除浏览器缓存**
   - Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
   - 清除所有cookie

2. **检查VPS端口**
   ```bash
   curl http://localhost/admin
   ```

3. **重启PHP-FPM**
   ```bash
   sudo systemctl restart php8.2-fpm nginx
   ```

---

## 🎯 后台功能模块

### 1️⃣ **产品管理 (Products)**
管理网站上所有的电池产品。

**可编辑字段：**
- 产品名称
- 型号
- 描述和详细信息
- 容量、电压、尺寸、重量
- 工艺类型 (卷绕/叠片)
- 应用领域
- 内阻、循环寿命、能量密度
- 证书认证
- 产品亮点
- 工作温度范围
- 产品图片上传

**功能：**
- ✅ 创建新产品
- ✅ 编辑现有产品
- ✅ 删除产品
- ✅ 按工艺类型过滤
- ✅ 按应用领域过滤
- ✅ 搜索产品

---

### 2️⃣ **页面内容 (Page Sections)**
管理网站各个页面的section内容。

**可管理的Pages：**
- `home` - 首页
- `about` - 关于我们
- `solutions` - 解决方案
- `products` - 产品页

**可编辑字段：**
- 页面名称
- Section名称
- 标题 (Title)
- 副标题 (Subtitle)
- 描述文本
- 背景颜色
- 背景图片上传
- 排序顺序
- 是否显示 (Active/Inactive)

**功能：**
- ✅ 为每个页面创建多个sections
- ✅ 调整sections顺序
- ✅ 启用/禁用sections
- ✅ 上传背景图片
- ✅ 管理section动画效果

---

### 3️⃣ **动画效果 (Animation Effects)**
配置页面元素的动态效果。

**可选动画效果：**
```
• fadeIn        - 淡入
• slideInUp     - 从下向上滑入
• slideInDown   - 从上向下滑入
• slideInLeft   - 从左向右滑入
• slideInRight  - 从右向左滑入
• scaleIn       - 缩放进入
• pulse         - 脉冲效果
• bounce        - 弹跳效果
• glow          - 发光效果
```

**可配置参数：**
- 动画类型
- 目标元素 (选择应用的页面section)
- 动画时长 (milliseconds)
- 延迟时间 (milliseconds)
- 是否启用

**功能：**
- ✅ 为任何section配置进场动画
- ✅ 调整动画时长
- ✅ 设置动画延迟
- ✅ 快速启用/禁用动画
- ✅ 预览动画效果

---

### 4️⃣ **网站设置 (Site Content)**
管理全局网站内容和设置。

**可管理内容：**
- 导航菜单文本
- Footer文本
- 公司信息
- 联系方式
- 社交媒体链接
- SEO标题和描述
- 其他全局配置

**字段类型：**
- 文本字段 (Text)
- 长文本 (Textarea)
- 图片 (Image)
- 超链接 (URL)

**功能：**
- ✅ 编辑任何站点内容
- ✅ 管理多语言内容（可扩展）
- ✅ 版本历史
- ✅ 快速发布

---

### 5️⃣ **咨询管理 (Inquiries)**
管理客户提交的询盘和咨询。

**查看信息：**
- 客户名称和邮箱
- 咨询内容
- 提交时间
- 状态 (新/已读)

**功能：**
- ✅ 查看所有咨询
- ✅ 标记为已读
- ✅ 导出咨询列表
- ✅ 回复客户邮件

---

## 📋 常见操作步骤

### 添加新产品
1. 进入 **Products** 模块
2. 点击 **+ Create**
3. 填写所有产品信息
4. 上传产品图片（可选）
5. 点击 **Save**

### 修改页面标题
1. 进入 **Page Sections**
2. 查找需要编辑的section
3. 点击编辑按钮
4. 修改标题/副标题
5. 点击 **Save**

### 配置动画效果
1. 进入 **Animation Effects**
2. 点击 **+ Create**
3. 选择动画类型（例：fadeIn）
4. 选择目标元素
5. 设置时长和延迟
6. 启用该效果
7. 点击 **Save**

### 更新Footer文本
1. 进入 **Site Content**
2. 搜索 "footer"
3. 编辑对应的内容
4. 点击 **Save**

---

## 🎨 动画效果配置建议

### 首页推荐配置
```
Hero Title:    fadeIn, 0.6s, 0ms
Hero Subtitle: slideInUp, 0.8s, 200ms
Features:      scaleIn, 0.6s, 400ms
CTA Button:    pulse, 2s, 800ms
```

### 关于页面推荐配置
```
Timeline Items: slideInLeft, 0.6s, staggered
Values Cards:   fadeIn, 0.5s, staggered
Stats Numbers:  bounce, 0.4s, on scroll
```

### 解决方案页推荐配置
```
Solution Cards: slideInRight, 0.7s, staggered
Feature List:   fadeIn, 0.5s, 100ms between
Application:    scaleIn, 0.6s, 200ms
```

---

## 🔒 安全提示

1. **定期备份**
   ```bash
   mysqldump -u zufek -p zufek_cms > backup-$(date +%Y%m%d).sql
   ```

2. **修改默认密码**
   - 进入后台
   - 点击右上角账户
   - 修改密码

3. **限制后台访问**
   ```bash
   # 在 .env 中添加IP白名单
   ADMIN_IP_WHITELIST=your_ip_address
   ```

---

## 📊 性能优化

### 图片优化
- 推荐尺寸：1920x1280px
- 文件格式：JPG/PNG
- 文件大小：< 500KB

### 内容优化
- 避免过长的描述文本
- 使用清晰的标题
- 保持描述简洁（最多200字）

---

## 🆘 故障排查

### 问题1: 无法访问 /admin
**解决：**
```bash
php artisan config:clear
php artisan cache:clear
sudo systemctl restart nginx
```

### 问题2: 登录后页面空白
**解决：**
```bash
php artisan view:clear
php artisan filament:cache-components
```

### 问题3: 图片无法上传
**解决：**
```bash
sudo chmod -R 775 /var/www/zufek/storage/app/public
```

### 问题4: 动画效果不显示
**解决：**
1. 检查前端JavaScript是否加载
2. 确保动画元素有正确的class
3. 在浏览器开发者工具检查console错误

---

## 📚 更多资源

- **前端代码**: `/resources/views/`
- **产品数据**: `/app/Models/Product.php`
- **数据库**: SQLite (`database/database.sqlite`)
- **API文档**: `/app/Filament/Resources/`

---

## ✨ 最佳实践

1. **编辑前备份**
   - 重要更改前，先备份数据库

2. **按步骤发布**
   - 先在本地测试
   - 再在VPS发布

3. **内容管理**
   - 保持英文统一
   - 定期更新产品
   - 活跃管理咨询

4. **性能维护**
   - 定期清除缓存
   - 监控数据库大小
   - 定期备份

---

**需要帮助？** 查看logs:
```bash
tail -f /var/www/zufek/storage/logs/laravel.log
```
