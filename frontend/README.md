# 连理e站 - 前端项目文档

"连理e站"——校园智联生活平台前端项目，基于 React + TypeScript 开发。此文档侧重于设计层面的说明，开发的具体规则与要求参考[项目规范与设计文档](../docs/PROJECT_STANDARDS.md)。

[toc]

---

## 🏗️ 架构设计

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.x | UI 框架 |
| **TypeScript** | 5.x | 类型系统 |
| **Zustand** | 4.x | 状态管理 |
| **Ant Design** | 5.x | UI 组件库 |
| **React Router** | 6.x | 路由管理 |
| **Axios** | 1.x | HTTP 请求 |
| **SCSS** | - | 样式预处理 |
| **js-cookie** | 3.x | Cookie 管理 |

### 设计原则

- **组件化开发**：页面组件 + 业务组件 + 通用组件
- **类型安全**：充分利用 TypeScript 类型系统
- **状态集中管理**：Zustand Store 统一管理应用状态
- **响应式设计**：移动优先，兼顾桌面端

---

## 📁 目录结构

说明：

- 组件封装至 `/components` 目录
- 页面组件在 `/pages` 目录
- 全局状态管理及具体 API 操作实现在 `/store` 目录
- API 封装在 `/api` 目录
- `utils` 目录存放工具函数
- `hooks` 目录存放自定义钩子函数

```
frontend/
├── public/                 # 静态资源
│   ├── index.html
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── components/        # 公共组件
│   │   ├── Navbar/       # 导航栏
│   │   ├── Tabbar/       # 用户底部导航
│   │   ├── MTabbar/      # 管理员底部导航
│   │   ├── ImageCropper/ # 图片裁剪器
│   │   ├── NoticeModal/  # 通知弹窗
│   │   └── ProtectedRoute/ # 路由保护
│   │
│   ├── pages/            # 页面组件
│   │   ├── Login/        # 登录/注册
│   │   ├── Market/       # 商城（商品浏览）
│   │   ├── Forum/        # 校园墙
│   │   ├── Publish/      # 发布（AI 模板生成）
│   │   ├── User/         # 用户中心
│   │   │   ├── User.tsx
│   │   │   ├── Settings/ # 设置
│   │   │   └── ...
│   │   ├── Messages/     # 信箱
│   │   ├── History/      # 发布历史
│   │   ├── Favorites/    # 收藏
│   │   └── Admin/        # 管理员后台
│   │       ├── MMarket/  # 商城管理
│   │       ├── MUser/    # 用户管理
│   │       ├── MAppeals/ # 申诉管理
│   │       └── MData/    # 数据统计
│   │
│   ├── store/            # Zustand 状态管理
│   │   ├── index.ts      # Store 导出
│   │   ├── userStore.ts  # 用户状态
│   │   ├── goodsStore.ts # 商品状态
│   │   └── forumStore.ts # 校园墙状态
│   │
│   ├── api/              # API 调用
│   │   └── index.ts      # Axios 配置
│   │
│   ├── utils/            # 工具函数
│   ├── hooks/            # 自定义 Hooks
│   ├── assets/           # 静态资源（图片、图标）
│   │
│   ├── App.tsx           # 根组件
│   ├── App.scss          # 全局样式
│   └── index.js          # 入口文件
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧩 核心模块

### 1. 认证模块（Login/Register）

**功能**：
- 用户注册（邮箱、昵称、密码）
- 用户登录（用户名/密码）
- 密码重置（邮箱验证）

**技术实现**：
- Zustand `userStore` 管理认证状态
- JWT Token 存储在 Cookie
- 路由守卫保护需要登录的页面

---

### 2. 商城模块（Market）

**功能**：
- 商品列表浏览（分页加载）
- 标签筛选（数码电子、学习资料等 8 类）
- 排序功能（最新、价格、热度）
- 商品详情查看
- 联系发布者（QQ）
- 点赞、收藏、投诉

**技术实现**：
- 状态管理：`goodsStore`
- 列表优化：虚拟滚动（考虑）
- 图片懒加载

---

### 3. 校园墙模块（Forum）

**功能**：
- 帖子列表浏览
- 标签筛选（新闻通知、吐槽倾诉等 7 类）
- 帖子详情查看
- 评论、点赞、收藏

**技术实现**：
- 状态管理：`forumStore`
- 评论系统

---

### 4. 发布模块（Publish）

**核心特色**：AI 智能生成商品/帖子描述

**流程**：
1. 用户输入关键词（如："二手 Kindle，9成新"）
2. 调用通义千问 API 生成描述和分类建议
3. 用户确认模板，上传图片（最多 3 张）
4. 提交发布

**技术实现**：
- AI 接口集成（`/api/publish/template`）
- 图片裁剪器（ImageCropper 组件）
- 图片上传（Multer）

---

### 5. 用户中心（User）

**功能**：
- 个人资料展示
- 设置（头像、昵称、主题、密码）
- 发布历史（确认交易完成）
- 收藏列表
- 消息信箱（申诉结果、违规通知）

**技术实现**：
- 资料修改：`changeProfile`、`changeImage`
- 历史记录：LocalStorage 缓存 + 数据库同步

---

### 6. 管理员后台（Admin）

**四大模块**：

#### 6.1 商城管理（MMarket）
- 浏览所有商品
- 删除违规商品
- 向发布者发送违规通知

#### 6.2 用户管理（MUser）
- 查询用户（通过 QQ）
- 查看用户发布历史
- 封禁/解封用户
- 修改信用分

#### 6.3 申诉管理（MAppeals）
- 查看用户申诉
- 回复申诉
- 更新申诉状态

#### 6.4 数据统计（MData）
- 用户数、商品数、帖子数
- 违规统计
- 标签分布图表
- 7 日趋势图

---

## 🔄 状态管理

使用 **Zustand** 进行轻量级状态管理。

### userStore（用户状态）

```typescript
interface UserState {
  // 状态
  isAuthenticated: boolean;      // 是否已登录
  isAdmin: boolean;              // 是否是管理员
  currentUser: User | null;      // 当前用户信息
  
  // 动作
  login: (credentials) => Promise<void>;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
  changeProfile: (data) => Promise<void>;
  changeImage: (type, file) => Promise<void>;
}
```

**持久化策略**：
- 只持久化 `isAuthenticated` 和 `isAdmin`
- 用户详细信息每次从 API 获取（保证数据最新）

### goodsStore（商品状态）

管理商品列表、筛选条件、当前商品详情等。

### forumStore（校园墙状态）

管理帖子列表、筛选条件、当前帖子详情等。

---

## 🚦 路由设计

### 用户端路由

| 路径 | 组件 | 说明 | 保护 |
|------|------|------|------|
| `/` | Redirect | 重定向到 `/market` | - |
| `/login` | Login | 登录/注册页 | - |
| `/market` | Market | 商城列表 | ✅ |
| `/market/:id` | GoodsDetail | 商品详情 | ✅ |
| `/forum` | Forum | 校园墙列表 | ✅ |
| `/forum/:id` | PostDetail | 帖子详情 | ✅ |
| `/publish` | Publish | 发布页 | ✅ |
| `/user` | User | 用户中心 | ✅ |
| `/user/settings` | Settings | 设置 | ✅ |
| `/user/settings/reset/:type` | Reset | 修改资料 | ✅ |
| `/messages` | Messages | 信箱 | ✅ |
| `/history` | History | 历史 | ✅ |
| `/favorites` | Favorites | 收藏 | ✅ |

### 管理员路由

| 路径 | 组件 | 说明 | 保护 |
|------|------|------|------|
| `/admin` | Admin | 管理员主页 | ✅ Admin |
| `/admin/market` | MMarket | 商城管理 | ✅ Admin |
| `/admin/users` | MUser | 用户管理 | ✅ Admin |
| `/admin/appeals` | MAppeals | 申诉管理 | ✅ Admin |
| `/admin/data` | MData | 数据统计 | ✅ Admin |

### 路由保护

使用 `ProtectedRoute` 组件保护需要登录/管理员权限的路由：

```typescript
// App.tsx
<Route
  path="/market"
  element={
    <ProtectedRoute>
      <Market />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/*"
  element={
    <ProtectedRoute requireAdmin={true}>
      <Admin />
    </ProtectedRoute>
  }
/>
```

---

## 🎨 组件设计

### 布局组件

#### Navbar - 导航栏
- **用途**：二级页面顶部导航
- **功能**：显示标题、返回按钮
- **位置**：Settings、History、Favorites、Messages 等

#### Tabbar - 用户底部导航
- **用途**：用户端主页面底部导航
- **页面**：Market（商城）、Forum（校园墙）、User（用户中心）
- **图标**：SVG 格式，选中/未选中两种状态

### 功能组件

#### ImageCropper - 图片裁剪器
- **用途**：上传头像、商品图片、背景图时裁剪
- **功能**：
  - 缩放、旋转、拖拽
  - 固定比例裁剪
  - 预览功能
  - 输出 File 对象

#### NoticeModal - 通知弹窗
- **用途**：未登录时提示、操作成功/失败提示
- **类型**：login、success、error、warning

#### ProtectedRoute - 路由保护
- **用途**：保护需要认证/管理员权限的路由
- **功能**：
  - 检查登录状态
  - 检查管理员权限
  - 自动重定向到登录页

---

## 🛠️ 开发指南

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm start
```

浏览器自动打开 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

生成的静态文件在 `build/` 目录

### 代码规范

请遵循项目的代码规范：
- 变量命名：小驼峰（`userName`）
- 组件命名：大驼峰（`UserProfile.tsx`）
- CSS 类名：小写+连字符（`user-card`）
- 详见：[项目规范文档](../docs/PROJECT_STANDARDS.md)

### Git 工作流

请使用规范的分支开发流程：
1. 从 `dev` 创建功能分支
2. 开发并提交（遵循提交规范）
3. 创建 PR 到 `dev`
4. Code Review 后合并
- 详见：[Git 工作流指南](../docs/GIT_WORKFLOW.md)

---

## 🧪 测试账号

### 说明

为方便测试，提供以下预设账号。生产环境请删除或修改这些账号。

**测试痛点**：
- 每次注册需重新填写信息较繁琐
- 密码采用单向加密，无法从数据库直接查看

**解决方案**：
- 使用下表预设账号快速测试
- 统一密码格式便于记忆

### 测试账号表

| 序号 | 昵称 | 邮箱 | QQ | 用户名 | 校区 | 密码 | 角色 |
|------|------|------|-----|--------|------|------|------|
| 1 | test1 | test1@test.com | 123456 | 123456 | 凌水主校区 | Tt123456 | 用户 |
| 2 | test2 | test2@test.com | 234567 | 234567 | 凌水主校区 | Tt234567 | 用户 |
| 3 | test3 | test3@test.com | 345678 | 345678 | 凌水主校区 | Tt345678 | 用户 |
| 4 | test4 | test4@test.com | 456789 | 456789 | 凌水主校区 | Tt456789 | 用户 |
| 5 | admin | admin@test.com | 999999 | admin | 凌水主校区 | Admin123 | 管理员 |

**注意**：
- 校区选项：1-凌水主校区、2-开发区校区、3-盘锦校区
- 管理员账号仅用于测试后台功能
- 生产环境务必修改默认密码

---

## 📝 开发笔记

### 当前进度

- ✅ 用户认证模块
- ✅ 商城模块（浏览、详情、筛选、收藏、申诉）
- ✅ 发布模块（AI 模板生成、发布）
- ✅ 用户中心（资料修改、设置）
- ✅ 管理员后台（基础功能已完成，关键词统计未完成）
- ✅ 校园墙模块（浏览、详情、筛选、评论、收藏）

### 已知问题

1. ~~图片裁剪器在部分设备上兼容性问题~~ ✅ 已修复
2. ~~修改用户信息后刷新显示旧数据~~ ✅ 已修复（Token 更新）
3. ~~qq_id 必填导致 400 错误~~ ✅ 已修复（改为可选）

### 待优化

- [ ] 图片懒加载优化
- [ ] 列表虚拟滚动（长列表性能）
- [ ] PWA 支持（离线访问）
- [ ] 图标加载方案
- [ ] Loading 效果优化
- [ ] 双 Token 机制
- [ ] PC端、微信小程序端支持（PC端已预留路由、小程序端需设计迁移方案）

---

## 📚 相关文档

- [项目规范与设计文档](../docs/PROJECT_STANDARDS.md) - 完整的开发规范和 API 设计
- [贡献指南](../docs/CONTRIBUTING.md) - 团队协作和贡献流程
- [Git 工作流指南](../docs/GIT_WORKFLOW.md) - 分支管理和提交规范
- [后端 API 文档](../server/新API文档.md) - 接口文档

---

## 📞 联系方式

- **项目负责人**: [@ProselyteCoding](https://github.com/ProselyteCoding)
- **Issues**: [GitHub Issues](https://github.com/ProselyteCoding/LianliEStation/issues)

---

**Happy Coding! 🚀**
