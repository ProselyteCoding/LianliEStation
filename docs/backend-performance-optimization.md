# 后端性能优化实施方案

**目标受众**: 后端开发人员  
**预期收益**: 
- 用户上传图片体积减少 **80-90%**
- 列表页 LCP 改善 **1-2s**
- 服务器存储成本降低 **60%**
- 带宽成本降低 **70%**
- 静态资源加载速度提升 **50%**
- 服务器响应时间优化 **30%**

---

## 一、问题背景

### 当前痛点

用户上传的原始图片直接存储和展示，存在以下问题：

| 问题 | 示例 | 影响 |
|------|------|------|
| **体积过大** | iPhone 照片 4032x3024, 3-5MB | 移动端流量消耗巨大 |
| **尺寸过大** | 列表页也加载 4000px 大图 | LCP 劣化 +2-3s |
| **格式低效** | PNG 格式占用空间大 | 存储和带宽成本高 |
| **无降级方案** | 不支持 WebP | 无法利用现代浏览器优势 |

### 前端已完成的工作

✅ 上传前压缩（1MB 限制）  
✅ 图片懒加载  
✅ 文字占位符  
⚠️ **但前端压缩有限**：只能减少 50-70% 体积，且无法生成多尺寸

---

## 二、技术方案

### 核心思路

**上传时一次处理，生成多尺寸 + 多格式图片**

```
用户上传原图 (3MB)
    ↓
后端接收 (Sharp 处理)
    ↓
生成 3 个尺寸 × 2 种格式
    ↓
返回 6 个 URL 给前端
```

### 推荐技术栈

**[Sharp](https://sharp.pixelplumbing.com/)** - Node.js 最快的图片处理库

**优势**:
- ⚡ 性能极高（基于 libvips，比 ImageMagick 快 4-5 倍）
- 🎯 API 简洁易用
- 📦 体积小（~9MB）
- ✅ 支持 WebP、AVIF 等现代格式
- 🔄 流式处理，内存占用低

---

## 三、实施步骤

### 步骤 1: 安装依赖

```bash
cd server
npm install sharp
```

**验证安装**:
```bash
node -e "const sharp = require('sharp'); console.log('Sharp 版本:', sharp.versions)"
```

---

### 步骤 2: 创建图片处理工具类

**文件**: `server/utils/imageProcessor.js`

```javascript
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * 图片处理配置
 */
const IMAGE_SIZES = {
  thumb: { width: 300, quality: 80 },    // 缩略图
  medium: { width: 800, quality: 85 },   // 列表页
  large: { width: 1920, quality: 90 }    // 详情页
};

/**
 * 处理上传的图片，生成多尺寸多格式版本
 * @param {string} inputPath - 原始图片路径
 * @param {string} outputDir - 输出目录
 * @param {string} filename - 文件名（不含扩展名）
 * @returns {Promise<Object>} 返回所有生成的图片 URL
 */
async function processUploadedImage(inputPath, outputDir, filename) {
  try {
    // 确保输出目录存在
    await fs.mkdir(outputDir, { recursive: true });

    const results = {};

    // 读取原图信息
    const metadata = await sharp(inputPath).metadata();
    console.log(`[图片处理] 原始尺寸: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}`);

    // 生成各种尺寸
    for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
      const jpegPath = path.join(outputDir, `${filename}-${sizeName}.jpg`);
      const webpPath = path.join(outputDir, `${filename}-${sizeName}.webp`);

      // 生成 JPEG 版本
      await sharp(inputPath)
        .resize(config.width, null, {
          fit: 'inside',           // 保持宽高比
          withoutEnlargement: true // 不放大小图
        })
        .jpeg({ 
          quality: config.quality,
          progressive: true        // 渐进式加载
        })
        .toFile(jpegPath);

      // 生成 WebP 版本（体积更小 25-35%）
      await sharp(inputPath)
        .resize(config.width, null, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ 
          quality: config.quality,
          effort: 4                // 压缩级别 0-6，4 为平衡点
        })
        .toFile(webpPath);

      // 记录生成的文件
      results[sizeName] = {
        jpeg: jpegPath.replace(/\\/g, '/'), // 转换为 URL 路径
        webp: webpPath.replace(/\\/g, '/')
      };

      console.log(`[图片处理] 生成 ${sizeName}: JPEG=${config.quality}%, WebP=${config.quality}%`);
    }

    // 删除原始上传文件（可选）
    // await fs.unlink(inputPath);

    return results;

  } catch (error) {
    console.error('[图片处理失败]', error);
    throw new Error(`图片处理失败: ${error.message}`);
  }
}

/**
 * 删除图片的所有尺寸版本
 * @param {Object} imagePaths - 图片路径对象
 */
async function deleteImageVersions(imagePaths) {
  try {
    for (const sizeVersions of Object.values(imagePaths)) {
      if (sizeVersions.jpeg) await fs.unlink(sizeVersions.jpeg).catch(() => {});
      if (sizeVersions.webp) await fs.unlink(sizeVersions.webp).catch(() => {});
    }
    console.log('[图片删除] 已删除所有版本');
  } catch (error) {
    console.error('[图片删除失败]', error);
  }
}

module.exports = {
  processUploadedImage,
  deleteImageVersions,
  IMAGE_SIZES
};
```

---

### 步骤 3: 修改上传接口

**文件**: `server/routes/goods.js` 和 `server/routes/forum.js`

#### 3.1 引入图片处理工具

```javascript
const { processUploadedImage, deleteImageVersions } = require('../utils/imageProcessor');
const path = require('path');
```

#### 3.2 修改商品发布接口

```javascript
// 原有上传中间件后添加处理逻辑
router.post('/publish', authToken, uploadImg.array('images', 9), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    
    // 处理上传的图片
    const processedImages = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filename = path.parse(file.filename).name; // 获取文件名（不含扩展名）
        const outputDir = path.join(__dirname, '../public/uploads/goods');
        
        // 处理图片，生成多尺寸版本
        const imagePaths = await processUploadedImage(
          file.path,           // 原始文件路径
          outputDir,           // 输出目录
          filename             // 文件名
        );
        
        // 转换为前端可用的 URL 格式
        const imageUrls = {
          thumb: {
            jpeg: `/uploads/goods/${filename}-thumb.jpg`,
            webp: `/uploads/goods/${filename}-thumb.webp`
          },
          medium: {
            jpeg: `/uploads/goods/${filename}-medium.jpg`,
            webp: `/uploads/goods/${filename}-medium.webp`
          },
          large: {
            jpeg: `/uploads/goods/${filename}-large.jpg`,
            webp: `/uploads/goods/${filename}-large.webp`
          }
        };
        
        processedImages.push(imageUrls);
      }
    }
    
    // 存储到数据库（存储 JSON 格式）
    const result = await db.query(
      'INSERT INTO goods (user_id, title, description, price, category, images) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description, price, category, JSON.stringify(processedImages)]
    );
    
    res.json({
      success: true,
      message: '商品发布成功',
      data: {
        id: result.insertId,
        images: processedImages
      }
    });
    
  } catch (error) {
    console.error('[商品发布失败]', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
```

#### 3.3 修改数据库表结构

```sql
-- 修改 goods 表的 images 字段为 JSON 类型
ALTER TABLE goods MODIFY COLUMN images JSON;

-- 或者使用 TEXT 类型存储 JSON 字符串（兼容性更好）
ALTER TABLE goods MODIFY COLUMN images TEXT;
```

#### 3.4 修改商品查询接口

```javascript
// 查询商品列表
router.get('/list', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    // ... 查询逻辑 ...
    
    // 解析 images JSON
    const goods = results.map(item => ({
      ...item,
      images: typeof item.images === 'string' 
        ? JSON.parse(item.images) 
        : item.images
    }));
    
    res.json({ success: true, data: goods });
    
  } catch (error) {
    console.error('[查询商品失败]', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
```

---

## 五、静态资源缓存策略

### 5.1 问题分析

**当前问题**:
- 每次访问都重新下载静态资源（图片、字体、CSS、JS）
- 浏览器无法利用缓存，流量浪费
- 服务器带宽压力大
- 用户体验差（重复加载）

### 5.2 Express 缓存配置

**文件**: `server/app.js`

#### 方案 1: 使用 express.static 的 maxAge 选项

```javascript
const express = require('express');
const path = require('path');
const app = express();

// 配置静态资源缓存策略
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '1y',  // 用户上传的图片缓存 1 年
  etag: true,    // 启用 ETag
  lastModified: true,  // 启用 Last-Modified
  immutable: true      // 资源不可变（适用于带哈希的文件名）
}));

// 字体文件缓存
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts'), {
  maxAge: '1y',
  immutable: true
}));

// 前端构建产物（带哈希的文件）
app.use('/static', express.static(path.join(__dirname, 'public/static'), {
  maxAge: '1y',
  immutable: true
}));

// HTML 文件不缓存或短缓存
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '5m',  // HTML 缓存 5 分钟
  etag: true
}));
```

#### 方案 2: 自定义缓存中间件（更灵活）

```javascript
// middlewares/cache.js
const path = require('path');

/**
 * 静态资源缓存中间件
 */
function cacheControl(req, res, next) {
  const ext = path.extname(req.url).toLowerCase();
  
  // 根据文件类型设置缓存策略
  const cacheSettings = {
    // 图片文件 - 长期缓存
    '.jpg': { maxAge: 31536000, immutable: true },   // 1 年
    '.jpeg': { maxAge: 31536000, immutable: true },
    '.png': { maxAge: 31536000, immutable: true },
    '.webp': { maxAge: 31536000, immutable: true },
    '.gif': { maxAge: 31536000, immutable: true },
    '.svg': { maxAge: 31536000, immutable: true },
    
    // 字体文件 - 长期缓存
    '.woff': { maxAge: 31536000, immutable: true },
    '.woff2': { maxAge: 31536000, immutable: true },
    '.ttf': { maxAge: 31536000, immutable: true },
    '.eot': { maxAge: 31536000, immutable: true },
    
    // JS/CSS 文件 - 长期缓存（假设有版本控制）
    '.js': { maxAge: 31536000, immutable: true },
    '.css': { maxAge: 31536000, immutable: true },
    
    // HTML 文件 - 短期缓存或不缓存
    '.html': { maxAge: 300 },  // 5 分钟
    
    // JSON 数据 - 不缓存
    '.json': { maxAge: 0, noCache: true }
  };
  
  const setting = cacheSettings[ext];
  
  if (setting) {
    if (setting.noCache) {
      // 不缓存
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      // 设置缓存
      const cacheControl = setting.immutable
        ? `public, max-age=${setting.maxAge}, immutable`
        : `public, max-age=${setting.maxAge}`;
      
      res.set('Cache-Control', cacheControl);
    }
  }
  
  next();
}

module.exports = cacheControl;
```

**使用中间件**:

```javascript
// app.js
const cacheControl = require('./middlewares/cache');

// 在静态资源中间件之前使用
app.use(cacheControl);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));
app.use(express.static(path.join(__dirname, 'public')));
```

### 5.3 Nginx 缓存配置（生产环境推荐）

如果使用 Nginx 作为反向代理：

```nginx
# /etc/nginx/sites-available/lianli-estation

server {
    listen 80;
    server_name example.com;
    
    # 前端静态文件目录
    root /path/to/frontend/build;
    index index.html;
    
    # 图片缓存 1 年
    location ~* \.(jpg|jpeg|png|gif|webp|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 字体缓存 1 年
    location ~* \.(woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # JS/CSS 缓存 1 年（假设文件名有哈希）
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # HTML 不缓存或短缓存
    location ~* \.html$ {
        expires 5m;
        add_header Cache-Control "public, must-revalidate";
    }
    
    # API 请求转发到后端
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # API 响应不缓存
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # 用户上传的图片
    location /uploads/ {
        alias /path/to/server/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # SPA 路由处理
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 六、HTTP 响应压缩

### 6.1 Gzip/Brotli 压缩

**安装依赖**:
```bash
npm install compression
```

**配置 Express**:

```javascript
// app.js
const compression = require('compression');

// 配置压缩中间件
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // 压缩所有可压缩的响应
    return compression.filter(req, res);
  },
  level: 6,  // 压缩级别 0-9，6 为平衡点
  threshold: 1024  // 只压缩大于 1KB 的响应
}));

// 其他中间件...
```

**Nginx Brotli 配置**（更优压缩）:

```nginx
# 需要先安装 ngx_brotli 模块

http {
    # Brotli 压缩
    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript image/svg+xml;
    
    # Gzip 压缩（降级方案）
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1024;
}
```

**预期效果**:
- JSON 响应减少 **60-70%**
- HTML 减少 **50-60%**
- CSS/JS 减少 **70-80%**

---

## 七、数据库查询优化

### 7.1 添加索引

**分析慢查询**:

```sql
-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 超过 1 秒的查询记录

-- 查看慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

**优化建议**:

```sql
-- 商品表索引
CREATE INDEX idx_category ON goods(category);
CREATE INDEX idx_user_id ON goods(user_id);
CREATE INDEX idx_created_at ON goods(created_at DESC);
CREATE INDEX idx_category_created ON goods(category, created_at DESC);

-- 帖子表索引
CREATE INDEX idx_created_at ON posts(created_at DESC);
CREATE INDEX idx_user_id ON posts(user_id);

-- 评论表索引
CREATE INDEX idx_post_id ON comments(post_id);
CREATE INDEX idx_parent_id ON comments(parent_id);
CREATE INDEX idx_user_id ON comments(user_id);

-- 收藏表复合索引
CREATE INDEX idx_user_goods ON favorites(user_id, goods_id);
CREATE INDEX idx_user_post ON favorites(user_id, post_id);
```

### 7.2 分页查询优化

**问题**: `LIMIT offset, count` 在 offset 很大时性能差

**优化方案**:

```javascript
// 原始查询（慢）
router.get('/list', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  
  // offset 越大越慢
  const goods = await db.query(
    'SELECT * FROM goods ORDER BY created_at DESC LIMIT ?, ?',
    [offset, limit]
  );
});

// 优化：使用游标分页（快）
router.get('/list', async (req, res) => {
  const limit = 20;
  const lastId = req.query.lastId || 0;  // 上一页最后一条记录的 ID
  
  // 使用 WHERE id > lastId 代替 OFFSET
  const goods = await db.query(
    'SELECT * FROM goods WHERE id > ? ORDER BY id DESC LIMIT ?',
    [lastId, limit]
  );
  
  res.json({
    success: true,
    data: goods,
    nextLastId: goods.length > 0 ? goods[goods.length - 1].id : null
  });
});
```

### 7.3 查询结果缓存

**使用 Redis 缓存热门数据**:

```javascript
const redis = require('redis');
const client = redis.createClient();

// 缓存商品列表
router.get('/list', async (req, res) => {
  const { category } = req.query;
  const cacheKey = `goods:list:${category}`;
  
  // 先查缓存
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: JSON.parse(cached),
      fromCache: true
    });
  }
  
  // 缓存未命中，查询数据库
  const goods = await db.query(
    'SELECT * FROM goods WHERE category = ? ORDER BY created_at DESC LIMIT 20',
    [category]
  );
  
  // 写入缓存，过期时间 5 分钟
  await client.setEx(cacheKey, 300, JSON.stringify(goods));
  
  res.json({ success: true, data: goods });
});

// 发布商品时清除缓存
router.post('/publish', authToken, async (req, res) => {
  // ... 发布逻辑 ...
  
  // 清除该分类的缓存
  await client.del(`goods:list:${category}`);
  
  res.json({ success: true });
});
```

---

### 旧数据兼容处理

**问题**: 数据库中已有的商品图片是字符串数组格式，需要兼容处理

**方案 1: 渐进式迁移**（推荐）

```javascript
// 在查询时动态转换
router.get('/list', async (req, res) => {
  try {
    const results = await db.query('SELECT * FROM goods');
    
    const goods = results.map(item => {
      let images = typeof item.images === 'string' 
        ? JSON.parse(item.images) 
        : item.images;
      
      // 兼容旧格式（字符串数组）
      if (Array.isArray(images) && typeof images[0] === 'string') {
        images = images.map(url => ({
          thumb: { jpeg: url, webp: url },
          medium: { jpeg: url, webp: url },
          large: { jpeg: url, webp: url }
        }));
      }
      
      return { ...item, images };
    });
    
    res.json({ success: true, data: goods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});
```

**方案 2: 批量迁移脚本**

```javascript
// scripts/migrate-images.js
const db = require('../db');
const { processUploadedImage } = require('../utils/imageProcessor');
const path = require('path');

async function migrateOldImages() {
  try {
    // 查询所有旧格式的商品
    const goods = await db.query('SELECT id, images FROM goods');
    
    for (const item of goods) {
      let images = JSON.parse(item.images);
      
      // 跳过已迁移的数据
      if (!Array.isArray(images) || typeof images[0] !== 'string') {
        continue;
      }
      
      const processedImages = [];
      
      for (const imageUrl of images) {
        const filename = path.basename(imageUrl, path.extname(imageUrl));
        const inputPath = path.join(__dirname, '../public', imageUrl);
        const outputDir = path.join(__dirname, '../public/uploads/goods');
        
        try {
          const imagePaths = await processUploadedImage(inputPath, outputDir, filename);
          
          const imageUrls = {
            thumb: {
              jpeg: `/uploads/goods/${filename}-thumb.jpg`,
              webp: `/uploads/goods/${filename}-thumb.webp`
            },
            medium: {
              jpeg: `/uploads/goods/${filename}-medium.jpg`,
              webp: `/uploads/goods/${filename}-medium.webp`
            },
            large: {
              jpeg: `/uploads/goods/${filename}-large.jpg`,
              webp: `/uploads/goods/${filename}-large.webp`
            }
          };
          
          processedImages.push(imageUrls);
        } catch (error) {
          console.error(`处理图片失败: ${imageUrl}`, error);
        }
      }
      
      // 更新数据库
      await db.query(
        'UPDATE goods SET images = ? WHERE id = ?',
        [JSON.stringify(processedImages), item.id]
      );
      
      console.log(`迁移商品 ${item.id} 完成`);
    }
    
    console.log('所有图片迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
  }
}

migrateOldImages();
```

运行迁移:
```bash
node scripts/migrate-images.js
```

---
