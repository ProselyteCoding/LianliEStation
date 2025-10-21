# 贡献指南

欢迎参与 **"连理e站"——校园智联生活平台** 的开发！本文档将帮助你快速了解项目的协作流程和贡献方式。

> 💡 **提示**：本文档专注于**团队协作流程**。关于代码规范、设计文档等详细内容，请查看 [项目规范与设计文档索引](./PROJECT_STANDARDS.md)。

[toc]

---

## 🎯 项目概述

### 项目定位

**"连理e站"** 是一款服务于校园生活的智能平台，主要包括：
- **二手交易模块**：帮助学生进行二手物品交易
- **校园墙模块**：提供校园信息交流平台

### 核心理念

1. **智能化**：引入大语言模型实现发布与审核的智能化
2. **简洁化**：做减法，只做最核心的功能，提供最友好的体验
3. **安全性**：完善的 AI + 人工双重审核机制，确保内容安全

### 技术栈

**前端**：
- React + TypeScript
- Ant Design 组件库
- Zustand 状态管理
- SCSS 样式

**后端**：
- Node.js + Express
- MySQL 数据库
- Redis 缓存
- AI 集成（智能审核、模板生成）

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/ProselyteCoding/LianliEStation.git
cd LianliEStation
```

### 2. 安装依赖

**前端**：
```bash
cd frontend
npm install
```

**后端**：
```bash
cd server
npm install
```

### 3. 配置环境

根据项目需求配置数据库、Redis 等环境变量（具体配置请参考各模块的 README）。

### 4. 启动开发服务器

**前端**：
```bash
cd frontend
npm start
```

**后端**：
```bash
cd server
npm start
```

---

## 🔄 开发工作流

### 标准开发流程

```
1. 从 dev 分支拉取最新代码
   ↓
2. 创建功能分支（feature/xxx 或 fix/xxx）
   ↓
3. 在功能分支上进行开发
   ↓
4. 提交代码（遵循提交规范）
   ↓
5. 推送到远程仓库
   ↓
6. 创建 Pull Request 到 dev
   ↓
7. Code Review 和讨论
   ↓
8. 合并到 dev 分支
   ↓
9. 测试稳定后，从 dev 合并到 main
```

### 详细步骤

#### 步骤 1：同步 dev 分支

```bash
# 切换到 dev 分支
git checkout dev

# 拉取最新代码
git pull origin dev
```

#### 步骤 2：创建功能分支

```bash
# 从 dev 创建新分支
git checkout -b feature/your-feature-name

# 或修复 bug
git checkout -b fix/bug-description
```

#### 步骤 3：开发和提交

```bash
# 进行开发...

# 查看修改
git status

# 添加文件
git add .

# 提交（遵循提交规范）
git commit -m "feat(module): add new feature"
```

#### 步骤 4：推送分支

```bash
# 推送到远程
git push origin feature/your-feature-name
```

#### 步骤 5：创建 Pull Request

1. 在 GitHub 上打开项目仓库
2. 点击 "New Pull Request"
3. 选择 `feature/your-feature-name` → `dev`
4. 填写 PR 标题和描述
5. 指定 Reviewer（如需要）
6. 提交 PR

---

## 🌿 分支管理规范

### 分支类型

| 分支类型 | 用途 | 命名示例 | 生命周期 |
|---------|------|---------|---------|
| **main** | 生产环境，稳定代码 | `main` | 永久 |
| **dev** | 开发环境，日常集成 | `dev` | 永久 |
| **feature/*** | 新功能开发 | `feature/login` | 临时 |
| **fix/*** | Bug 修复 | `fix/login-error` | 临时 |
| **refactor/*** | 代码重构 | `refactor/user-service` | 临时 |
| **docs/*** | 文档更新 | `docs/api-update` | 临时 |
| **chore/*** | 构建/工具/配置 | `chore/update-ci` | 临时 |
| **hotfix/*** | 紧急修复（从 main 拉取） | `hotfix/payment-bug` | 临时 |

### 分支保护规则

- **main 分支**：
  - ✅ 只接受来自 `dev` 的合并
  - ✅ 需要 Code Review
  - ✅ 合并后打 tag 标记版本
  
- **dev 分支**：
  - ✅ 接受来自 feature/fix/refactor/docs 等分支的 PR
  - ⚠️ 建议经过 Code Review
  - ✅ 定期合并到 main

- **功能分支**：
  - ✅ 从 dev 创建
  - ✅ 开发完成后通过 PR 合并到 dev
  - ✅ 合并后删除

### 分支命名规范

```bash
# ✅ 推荐
feature/user-login
fix/navbar-display-bug
docs/git-workflow
refactor/api-structure

# ❌ 不推荐
feature123
my-branch
test
```

**命名原则**：
- 使用小写字母
- 多个单词用 `-` 连接
- 简洁明确，见名知义
- 使用英文，避免拼音

---

## 📝 提交信息规范

采用 **Angular 提交规范**，格式如下：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| **feat** | 新功能 | `feat(auth): add user login` |
| **fix** | Bug 修复 | `fix(navbar): fix menu display issue` |
| **docs** | 文档更新 | `docs(api): update API documentation` |
| **style** | 代码格式（不影响功能） | `style(login): format code` |
| **refactor** | 重构（不改变功能） | `refactor(user): optimize user service` |
| **perf** | 性能优化 | `perf(market): improve loading speed` |
| **test** | 测试相关 | `test(auth): add login tests` |
| **chore** | 构建/工具/配置 | `chore(deps): update dependencies` |

### Scope 范围

指明修改的模块或功能：

**前端模块**：
- `auth` - 登录/注册
- `user` - 用户相关
- `market` - 商城模块
- `forum` - 校园墙模块
- `admin` - 管理员模块
- `publish` - 发布模块
- `ui` - UI 组件

**后端模块**：
- `api` - API 接口
- `db` - 数据库
- `cache` - 缓存
- `middleware` - 中间件

### Subject 主题

- 简短描述（50 字符以内）
- 使用动词开头（add, fix, update, remove 等）
- 首字母小写
- 结尾不加句号

### 示例

```bash
# ✅ 好的提交信息
feat(auth): add remember me function
fix(market): resolve goods loading error
docs(api): update user API documentation
refactor(user): optimize profile update logic

# ❌ 不好的提交信息
update
fix bug
修复登录问题
add some features
```

### 完整示例

```git
feat(publish): add AI template generation

- Integrated AI model for automatic content generation
- Added template selection UI
- Implemented error handling for AI service

Closes #123
```

---

## 🔍 Pull Request 流程

### 1. 创建 PR 前的检查

- [ ] 代码已在本地测试通过
- [ ] 遵循代码规范（见 [项目规范文档](./PROJECT_STANDARDS.md)）
- [ ] 提交信息符合规范
- [ ] 已同步最新的 dev 代码
- [ ] 解决了所有冲突

### 2. PR 标题规范

使用与提交信息相同的格式：

```
feat(auth): add user login functionality
fix(market): resolve product display issue
```

### 3. PR 描述模板

```markdown
## 📋 修改类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 其他

## 🎯 修改内容
简要描述本次 PR 的修改内容...

## 📸 截图（如有 UI 变化）
贴上修改前后的截图

## ✅ 测试情况
- [ ] 本地测试通过
- [ ] 浏览器兼容性测试
- [ ] 移动端适配测试（如适用）

## 🔗 关联 Issue
Closes #issue_number

## 📝 其他说明
其他需要说明的内容...
```

### 4. PR 合并流程

```
创建 PR
  ↓
自动化检查（如有配置）
  ↓
Code Review（必要时）
  ↓
讨论和修改
  ↓
通过 Review
  ↓
合并到 dev
  ↓
删除功能分支
```

---

## 👀 Code Review 规范

### Review 重点

**功能性**：
- [ ] 功能是否正确实现
- [ ] 边界情况是否处理
- [ ] 错误处理是否完善

**代码质量**：
- [ ] 代码是否符合规范
- [ ] 命名是否清晰易懂
- [ ] 是否有重复代码
- [ ] 是否有性能问题

**可维护性**：
- [ ] 代码逻辑是否清晰
- [ ] 注释是否充分
- [ ] 是否易于扩展

### Review 反馈方式

**建设性反馈**：
```
✅ 建议将这段逻辑提取为独立函数，提高可读性
✅ 这里可以使用 useMemo 优化性能
✅ 考虑添加错误处理逻辑

❌ 这代码写得不好
❌ 为什么要这样写？
```

**优先级标记**：
- 🔴 **必须修改**：严重问题，影响功能或安全
- 🟡 **建议修改**：可以优化，但不强制
- 🟢 **可选**：个人建议，可采纳可忽略

---

## ❓ 常见问题

### Q1: 如何同步最新的 dev 代码？

```bash
# 在功能分支上
git fetch origin
git rebase origin/dev

# 或者
git pull origin dev --rebase
```

### Q2: 如何解决合并冲突？

```bash
# 1. 拉取最新代码
git fetch origin

# 2. 合并 dev 分支
git merge origin/dev

# 3. 解决冲突后
git add .
git commit -m "chore: resolve merge conflicts"

# 4. 推送
git push origin your-branch
```

### Q3: 提交后发现错误怎么办？

**如果还没推送**：
```bash
# 修改最后一次提交
git commit --amend -m "fix(xxx): corrected commit message"
```

**如果已推送**：
```bash
# 创建新的提交修复
git commit -m "fix(xxx): fix previous error"
```

### Q4: 如何撤销提交？

```bash
# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃修改）
git reset --hard HEAD~1
```

### Q5: 功能分支开发时间过长，如何保持同步？

```bash
# 定期从 dev 拉取更新
git checkout dev
git pull origin dev

git checkout feature/your-feature
git merge dev

# 或使用 rebase（保持提交历史整洁）
git rebase dev
```

---

## 📞 联系方式

### 项目负责人
- **GitHub**: [@ProselyteCoding](https://github.com/ProselyteCoding)

### 讨论和反馈
- **Issues**: [GitHub Issues](https://github.com/ProselyteCoding/LianliEStation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ProselyteCoding/LianliEStation/discussions)

### 文档资源
- [项目规范与设计文档索引](./PROJECT_STANDARDS.md)
- [命名规范](../命名规范.md)
- [样式规范](../样式规范.md)
- [接口文档](../接口路由.md)

---

## 📚 延伸阅读

- [Git 工作流最佳实践](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [Angular 提交规范](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Code Review 最佳实践](https://google.github.io/eng-practices/review/)
- [如何写好 Pull Request](https://github.blog/2015-01-21-how-to-write-the-perfect-pull-request/)

---

## 🎉 感谢贡献

感谢每一位为"连理e站"项目做出贡献的开发者！你的每一次提交都让这个项目变得更好。

**Happy Coding! 🚀**
