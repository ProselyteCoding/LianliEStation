# LianliEStation 连理e站

连理e站 —— 校园智联生活平台

<!-- PROJECT SHIELDS -->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />

<p align="center">
  <a href="https://github.com/ProselyteCoding/LianliEStation/">
    <img src="assets/logo.png" alt="Logo" width="80" height="80">
  </a>
  <h3 align="center">连理e站</h3>
  <p align="center">
    连理e站 —— 校园智联生活平台
    <br /><br />
    <a href="https://github.com/ProselyteCoding/LianliEStation/">  
      <img src="assets/宣传视频.gif" alt="宣传视频" width="800" height="450">  
    </a> 
    <br /><br />
    <a href="https://github.com/ProselyteCoding/LianliEStation"><strong>探索本项目的文档 »</strong></a>
    <br /><br />
    <a href="https://www.lianliestation.xin/">访问网站</a>
    ·
    <a href="https://github.com/ProselyteCoding/LianliEStation/issues">报告Bug</a>
    ·
    <a href="https://github.com/ProselyteCoding/LianliEStation/issues">提出新特性</a>
  </p>

</p>

## 目录

- [LianliEStation 连理e站](#lianliestation-连理e站)
  - [目录](#目录)
    - [上手指南](#上手指南)
      - [日常使用指南(访问网站，无需安装)](#日常使用指南访问网站无需安装)
      - [开发前的配置要求](#开发前的配置要求)
      - [安装步骤](#安装步骤)
    - [文件目录说明](#文件目录说明)
    - [开发的架构](#开发的架构)
    - [部署](#部署)
    - [使用到的框架](#使用到的框架)
    - [贡献者](#贡献者)
      - [如何参与开源项目](#如何参与开源项目)
    - [版本控制](#版本控制)
    - [作者](#作者)
    - [版权说明](#版权说明)
    - [鸣谢](#鸣谢)

### 上手指南

#### 日常使用指南(访问网站，无需安装)

1. 使用微信搜索"连理e站"服务号并关注
2. 点击页面左下角"连理e站"链接跳转
3. 完成注册后登录即可访问使用

#### 开发前的配置要求

1. 已安装并配置了 `Node.js` 环境
2. 全局安装了 `npm` 作为包管理器

#### 安装步骤

1. 克隆仓库

```sh
git clone https://github.com/ProselyteCoding/LianliEStation.git
```

2. 安装依赖包

```sh
# 前端依赖包安装
cd frontend
npm install
```
```sh
# 后端依赖包安装
cd ../server
npm install
```

### 文件目录说明

```
frontend/
├── public/                 # 静态资源
│   ├── index.html         # HTML 模板
│   ├── favicon.ico        # 网站图标
│   └── robots.txt         # 搜索引擎配置
│
├── src/
│   ├── components/        # 公共组件
│   │   ├── Navbar/       # 导航栏组件
│   │   ├── Tabbar/       # 底部导航栏
│   │   ├── ImageCropper/ # 图片裁剪器
│   │   └── NoticeModal/  # 通知弹窗
│   │
│   ├── pages/            # 页面组件
│   │   ├── Login/        # 登录页
│   │   ├── Market/       # 商城页
│   │   ├── Forum/        # 校园墙页
│   │   ├── User/         # 用户中心
│   │   └── Admin/        # 管理员后台
│   │
│   ├── store/            # Zustand 状态管理
│   │   ├── index.ts      # Store 导出
│   │   ├── userStore.ts  # 用户状态
│   │   ├── goodsStore.ts # 商品状态
│   │   └── forumStore.ts # 校园墙状态
│   │
│   ├── api/              # API 调用层
│   │   ├── index.ts      # Axios 实例配置
│   │   └── api.md        # API 文档
│   │
│   ├── utils/            # 工具函数
│   │   ├── format.ts     # 格式化函数
│   │   ├── validate.ts   # 验证函数
│   │   └── storage.ts    # 本地存储封装
│   │
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useAuth.ts    # 认证 Hook
│   │   └── useFetch.ts   # 数据获取 Hook
│   │
│   ├── assets/           # 静态资源
│   │   ├── images/       # 图片
│   │   ├── icons/        # SVG 图标
│   │   └── styles/       # 全局样式
│   │
│   ├── App.tsx           # 根组件
│   ├── App.scss          # 根样式
│   ├── index.js          # 入口文件
│   └── declarations.d.ts # TypeScript 类型声明
│
├── package.json          # 依赖配置
├── tsconfig.json         # TypeScript 配置
└── README.md             # 前端文档

server/
├── routes/               # 路由模块
│   ├── auth.js          # 认证路由 (登录/注册/密码)
│   ├── users.js         # 用户路由
│   ├── goods.js         # 商品路由
│   ├── forum.js         # 校园墙路由
│   ├── publish.js       # 发布路由
│   ├── favorites.js     # 收藏路由
│   ├── history.js       # 历史路由
│   ├── messages.js      # 信箱路由
│   ├── appeals.js       # 申诉路由
│   ├── admin.js         # 管理员路由
│   └── aiTemplate.js    # AI 模板路由
│
├── middlewares/         # 中间件
│   ├── checkBan.js     # 封禁检查中间件
│   ├── limiter.js      # 限流中间件
│   ├── logIP.js        # IP 记录中间件
│   ├── mailer.js       # 邮件服务
│   └── uploadImg.js    # 图片上传中间件
│
├── oldRoutes/          # 旧版路由（已弃用）
│   ├── appeals.js
│   ├── campusWall.js
│   ├── posts.js
│   └── responses.js
│
├── public/             # 静态文件
│   └── uploads/        # 上传的图片
│       ├── avatars/    # 头像
│       ├── banners/    # Banner
│       └── goods/      # 商品图片
│
├── app.js              # 应用入口
├── db.js               # 数据库连接配置
├── package.json        # 依赖配置
└── README.md           # 后端文档
```

### 开发的架构

请阅读项目中的说明文档，暂未统一整理。

### 部署

[https://www.lianliestation.xin/](https://www.lianliestation.xin/)

### 使用到的框架

- [React](https://react.dev/)
- [Express](https://expressjs.com/)

### 贡献者

请阅读**CONTRIBUTING.md** 查阅为该项目做出贡献的开发者。目前暂未创建该文件。

#### 如何参与开源项目

贡献使开源社区成为一个学习、激励和创造的绝佳场所。你所作的任何贡献都是我们**非常感谢**的。

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 版本控制

该项目使用 Git 进行版本管理。您可以在 repository 参看当前可用版本。

### 作者

Proselyte

- GitHub: https://github.com/ProselyteCoding
- 邮箱: fan042182@gmail.com 或 3197908785@qq.com
- qq: 3197908785

### 版权说明

该项目签署了 MIT 授权许可，详情请参阅 [LICENSE.txt](https://github.com/ProselyteCoding/LianliEStation/blob/main/LICENSE)

### 鸣谢

感谢所有为“连理e站”的设计、开发、测试、上线做出贡献的同学！特别感谢 **Wzy 学长** 和 **OurEDA 红色狐狸老师** 的支持与指导。

<!-- links -->

[your-project-path]: ProselyteCoding/LianliEStation
[contributors-shield]: https://img.shields.io/github/contributors/ProselyteCoding/LianliEStation.svg?style=flat-square
[contributors-url]: https://github.com/ProselyteCoding/LianliEStation/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/ProselyteCoding/LianliEStation.svg?style=flat-square
[forks-url]: https://github.com/ProselyteCoding/LianliEStation/network/members
[stars-shield]: https://img.shields.io/github/stars/ProselyteCoding/LianliEStation.svg?style=flat-square
[stars-url]: https://github.com/ProselyteCoding/LianliEStation/stargazers
[issues-shield]: https://img.shields.io/github/issues/ProselyteCoding/LianliEStation.svg?style=flat-square
[issues-url]: https://img.shields.io/github/issues/ProselyteCoding/LianliEStation.svg
[license-shield]: https://img.shields.io/github/license/ProselyteCoding/LianliEStation.svg?style=flat-square
[license-url]: https://github.com/ProselyteCoding/LianliEStation/blob/main/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/ProselyteCoding
