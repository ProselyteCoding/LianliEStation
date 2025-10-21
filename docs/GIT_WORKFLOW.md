# Git 工作流指南

本文档详细说明"连理e站"项目的 Git 工作流程，帮助团队从**不规范的直接 main 提交**过渡到**规范的分支开发模式**。

[toc]

---

## 🎯 为什么需要规范的 Git 工作流

### 当前问题

❌ **直接在 main 分支提交**：
- 多人同时修改容易冲突
- 未经测试的代码直接上线，风险高
- 难以回滚到稳定版本
- 无法并行开发多个功能
- 提交历史混乱，难以追溯

### 规范工作流的优势

✅ **使用分支开发**：
- 功能隔离，互不影响
- 代码审查，保证质量
- 稳定的生产环境
- 清晰的提交历史
- 团队协作更高效

---

## 🌿 分支策略

### 分支体系

```
main (生产环境)
  ↑
  └── dev (开发环境)
        ↑
        ├── feature/user-login (功能开发)
        ├── feature/market-search (功能开发)
        ├── fix/navbar-bug (Bug 修复)
        ├── docs/git-workflow (文档更新)
        └── refactor/api-structure (代码重构)
```

### 分支说明

| 分支 | 说明 | 来源 | 合并到 | 生命周期 |
|------|------|------|--------|----------|
| **main** | 生产环境，稳定代码 | - | - | 永久 |
| **dev** | 开发环境，日常集成 | main | main | 永久 |
| **feature/*** | 新功能开发 | dev | dev | 临时（完成后删除） |
| **fix/*** | Bug 修复 | dev | dev | 临时（完成后删除） |
| **refactor/*** | 代码重构 | dev | dev | 临时（完成后删除） |
| **docs/*** | 文档更新 | dev | dev | 临时（完成后删除） |
| **chore/*** | 构建/工具/配置 | dev | dev | 临时（完成后删除） |
| **hotfix/*** | 紧急修复 | main | main + dev | 临时（完成后删除） |

### 分支保护规则

**main 分支**：
```
✅ 只接受来自 dev 的合并
✅ 需要 Pull Request + Code Review
✅ 合并后打 tag 标记版本
✅ 禁止直接推送
```

**dev 分支**：
```
✅ 接受来自 feature/fix/docs 等分支的 PR
⚠️ 建议经过 Code Review
✅ 定期合并到 main
✅ 过渡期允许直接提交（逐步收紧）
```

**功能分支**：
```
✅ 从 dev 创建
✅ 开发完成后通过 PR 合并到 dev
✅ 合并后删除
✅ 可随意提交和推送
```

---

## 🔄 完整工作流程

### 阶段一：准备工作

#### 1. 确保本地有 dev 分支

```bash
# 查看当前分支
git branch

# 如果没有 dev 分支，从远程拉取
git fetch origin
git checkout -b dev origin/dev

# 如果远程也没有 dev，从 main 创建
git checkout main
git pull origin main
git checkout -b dev
git push origin dev
```

#### 2. 同步最新代码

```bash
# 切换到 dev 分支
git checkout dev

# 拉取最新代码
git pull origin dev
```

### 阶段二：功能开发

#### 3. 创建功能分支

```bash
# 从 dev 创建新分支
git checkout -b feature/your-feature-name

# 示例
git checkout -b feature/user-login
git checkout -b fix/navbar-display
git checkout -b docs/api-update
```

#### 4. 进行开发

```bash
# 编写代码...
# 测试功能...

# 查看修改
git status

# 查看详细改动
git diff
```

#### 5. 提交代码

```bash
# 添加修改的文件
git add .

# 或者添加特定文件
git add src/components/Login.tsx

# 提交（遵循提交规范）
git commit -m "feat(auth): add user login functionality"

# 可以多次提交
git commit -m "feat(auth): add remember me checkbox"
git commit -m "feat(auth): add login error handling"
```

#### 6. 推送到远程

```bash
# 第一次推送需要设置上游分支
git push -u origin feature/user-login

# 后续推送
git push
```

### 阶段三：代码审查与合并

#### 7. 创建 Pull Request

**在 GitHub 上操作**：

1. 打开项目仓库
2. 点击 "Pull requests" 标签
3. 点击 "New pull request"
4. 选择分支：
   - base: `dev`
   - compare: `feature/your-feature-name`
5. 填写 PR 信息：
   ```markdown
   ## 📋 修改类型
   - [x] 新功能 (feat)
   
   ## 🎯 修改内容
   添加用户登录功能，包括：
   - 登录表单
   - 记住我功能
   - 错误处理
   
   ## ✅ 测试情况
   - [x] 本地测试通过
   - [x] 浏览器兼容性测试
   ```
6. 指定 Reviewer（可选）
7. 点击 "Create pull request"

#### 8. Code Review（可选，建议）

**Reviewer 检查**：
- [ ] 代码功能是否正确
- [ ] 是否符合命名规范
- [ ] 是否有明显的性能问题
- [ ] 错误处理是否完善

**提出修改建议**：
```
🟡 建议：这里可以使用 useMemo 优化性能
🔴 必须修改：这里缺少错误处理
🟢 可选：考虑提取为独立组件
```

**修改代码**：
```bash
# 在功能分支上继续修改
git add .
git commit -m "fix(auth): add error handling"
git push

# PR 会自动更新
```

#### 9. 合并到 dev

**在 GitHub 上操作**：

1. Review 通过后，点击 "Merge pull request"
2. 选择合并方式：
   - **Merge commit**: 保留所有提交历史（推荐）
   - **Squash and merge**: 合并为一次提交
   - **Rebase and merge**: 线性历史
3. 点击 "Confirm merge"
4. 删除功能分支（点击 "Delete branch"）

**或者在命令行操作**：

```bash
# 切换到 dev
git checkout dev

# 合并功能分支
git merge feature/user-login

# 推送到远程
git push origin dev

# 删除本地功能分支
git branch -d feature/user-login

# 删除远程功能分支
git push origin --delete feature/user-login
```

### 阶段四：发布到生产

#### 10. 从 dev 合并到 main

```bash
# 确保 dev 已经充分测试

# 切换到 dev，拉取最新代码
git checkout dev
git pull origin dev

# 切换到 main，拉取最新代码
git checkout main
git pull origin main

# 合并 dev 到 main
git merge dev

# 推送到远程
git push origin main
```

#### 11. 打版本标签

```bash
# 打 tag
git tag -a v0.1.0 -m "Release version 0.1.0"

# 推送 tag
git push origin v0.1.0

# 或推送所有 tag
git push origin --tags
```

---

## ⚡ 常用命令速查

### 分支操作

```bash
# 查看所有分支
git branch -a

# 创建分支
git checkout -b feature/new-feature

# 切换分支
git checkout dev

# 删除本地分支
git branch -d feature/old-feature

# 强制删除本地分支
git branch -D feature/old-feature

# 删除远程分支
git push origin --delete feature/old-feature
```

### 同步更新

```bash
# 拉取远程最新代码
git pull origin dev

# 拉取并变基（保持历史整洁）
git pull origin dev --rebase

# 获取远程更新但不合并
git fetch origin

# 查看远程分支
git remote -v
```

### 提交操作

```bash
# 添加所有修改
git add .

# 添加特定文件
git add path/to/file

# 提交
git commit -m "feat(module): description"

# 修改最后一次提交
git commit --amend -m "new message"

# 推送
git push

# 强制推送（慎用！）
git push -f
```

### 查看状态

```bash
# 查看当前状态
git status

# 查看提交历史
git log

# 查看简洁提交历史
git log --oneline --graph

# 查看文件改动
git diff

# 查看已暂存的改动
git diff --staged
```

### 撤销操作

```bash
# 撤销工作区修改
git checkout -- file.txt

# 撤销暂存区
git reset HEAD file.txt

# 撤销最后一次提交（保留修改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃修改）
git reset --hard HEAD~1

# 撤销已推送的提交（创建新提交）
git revert HEAD
```

---

## 🎬 常见场景处理

### 场景 1：开发新功能

```bash
# 1. 同步 dev
git checkout dev
git pull origin dev

# 2. 创建功能分支
git checkout -b feature/new-awesome-feature

# 3. 开发和提交
git add .
git commit -m "feat(module): add awesome feature"

# 4. 推送
git push -u origin feature/new-awesome-feature

# 5. 创建 PR（在 GitHub 上）

# 6. 合并后删除分支
git checkout dev
git pull
git branch -d feature/new-awesome-feature
```

### 场景 2：修复 Bug

```bash
# 1. 同步 dev
git checkout dev
git pull origin dev

# 2. 创建修复分支
git checkout -b fix/critical-bug

# 3. 修复和提交
git add .
git commit -m "fix(module): resolve critical bug"

# 4. 推送并创建 PR
git push -u origin fix/critical-bug

# 5. 紧急情况可以快速合并
```

### 场景 3：功能分支开发时间长，需要同步 dev 的新代码

```bash
# 在功能分支上
git checkout feature/long-running-feature

# 方法 1：merge（简单，但会产生合并提交）
git merge dev

# 方法 2：rebase（保持历史整洁，但可能有冲突）
git rebase dev

# 推送（如果用了 rebase，需要强制推送）
git push -f
```

### 场景 4：紧急修复线上 Bug (Hotfix)

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. 修复和提交
git add .
git commit -m "fix: critical production bug"

# 3. 推送
git push -u origin hotfix/critical-fix

# 4. 合并到 main
git checkout main
git merge hotfix/critical-fix
git push origin main

# 5. 同时合并到 dev（避免 dev 缺少修复）
git checkout dev
git merge hotfix/critical-fix
git push origin dev

# 6. 删除 hotfix 分支
git branch -d hotfix/critical-fix
git push origin --delete hotfix/critical-fix

# 7. 打 tag
git tag -a v0.1.1 -m "Hotfix: critical bug"
git push origin v0.1.1
```

### 场景 5：解决合并冲突

```bash
# 当 git merge 或 git pull 出现冲突时

# 1. 查看冲突文件
git status

# 2. 手动编辑冲突文件，解决冲突标记
<<<<<<< HEAD
你的代码
=======
别人的代码
>>>>>>> branch-name

# 3. 标记为已解决
git add conflicted-file.txt

# 4. 完成合并
git commit -m "chore: resolve merge conflicts"

# 5. 推送
git push
```

### 场景 6：撤销错误的提交

**情况 A：还没推送**

```bash
# 撤销最后一次提交，保留修改
git reset --soft HEAD~1

# 撤销最后一次提交，丢弃修改
git reset --hard HEAD~1
```

**情况 B：已经推送**

```bash
# 创建一个新提交来撤销
git revert HEAD

# 推送
git push
```

### 场景 7：同时开发多个功能

```bash
# 功能 A
git checkout -b feature/function-a
# 开发...
git commit -m "feat: add function A"
git push -u origin feature/function-a

# 切换到功能 B（功能 A 未完成）
git checkout dev
git checkout -b feature/function-b
# 开发...
git commit -m "feat: add function B"
git push -u origin feature/function-b

# 随时切换
git checkout feature/function-a  # 继续开发 A
git checkout feature/function-b  # 继续开发 B
```

---

## 💡 最佳实践

### 提交原则

1. **小而频繁**：
   ```bash
   # ✅ 好
   git commit -m "feat(auth): add login form"
   git commit -m "feat(auth): add login validation"
   git commit -m "feat(auth): add error handling"
   
   # ❌ 不好
   git commit -m "feat(auth): complete login feature"  # 一次性提交太多
   ```

2. **原子性**：
   ```bash
   # ✅ 好：一次提交只做一件事
   git commit -m "fix(navbar): fix menu display bug"
   
   # ❌ 不好：一次提交做多件事
   git commit -m "fix navbar and add login and update styles"
   ```

3. **有意义的信息**：
   ```bash
   # ✅ 好
   git commit -m "feat(market): add search filter by category"
   
   # ❌ 不好
   git commit -m "update"
   git commit -m "fix bug"
   git commit -m "WIP"
   ```

### 分支原则

1. **及时清理**：
   ```bash
   # 合并后删除功能分支
   git branch -d feature/old-feature
   git push origin --delete feature/old-feature
   ```

2. **定期同步**：
   ```bash
   # 每天开始工作前
   git checkout dev
   git pull origin dev
   ```

3. **避免长期分支**：
   - 功能分支不要超过 1 周
   - 超过 1 周考虑拆分功能
   - 定期合并 dev 的更新

### 协作原则

1. **沟通优先**：
   - 大功能开发前先讨论
   - 遇到问题及时反馈
   - 重大修改提前通知

2. **代码审查**：
   - 自己先 review 一遍再提 PR
   - 给出建设性的反馈
   - 及时响应 review 意见

3. **文档同步**：
   - 新功能更新文档
   - API 变更及时通知
   - 保持文档与代码一致

---

## 🚀 快速开始检查清单

### 新成员加入

- [ ] 克隆项目
- [ ] 阅读本文档
- [ ] 了解分支策略
- [ ] 了解提交规范
- [ ] 拉取 dev 分支
- [ ] 尝试创建第一个功能分支

### 开始新功能

- [ ] 同步 dev 分支
- [ ] 创建功能分支
- [ ] 遵循命名规范
- [ ] 小步提交
- [ ] 推送到远程
- [ ] 创建 PR
- [ ] 合并后删除分支

### 发布新版本

- [ ] dev 分支充分测试
- [ ] 合并 dev 到 main
- [ ] 打版本标签
- [ ] 更新版本文档
- [ ] 通知团队

---

## 📚 参考资料

- [Git 分支管理策略](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Angular 提交规范](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [如何写好提交信息](https://chris.beams.io/posts/git-commit/)

---

## ❓ 疑问解答

**Q: 为什么不直接在 main 开发？**
A: main 是生产环境，需要保持稳定。直接在 main 开发容易引入未测试的代码。

**Q: 每次都要创建分支太麻烦了？**
A: 刚开始可能觉得麻烦，但很快会习惯。分支开发能避免很多问题，长远来看节省时间。

**Q: 小改动也要创建分支吗？**
A: 过渡期可以直接在 dev 修改。长期建议所有改动都使用分支，养成习惯。

**Q: PR 必须要 review 吗？**
A: 过渡期不强制，但建议重要功能进行 review。长期目标是所有 PR 都要 review。

**Q: 遇到冲突怎么办？**
A: 不要慌，按照 "场景 5" 的步骤解决。实在不会可以求助团队。

**Q: 可以直接在别人的分支上提交吗？**
A: 不建议。如果需要协作，可以创建新分支，或者通过 PR 的方式贡献。

---

**规范的工作流需要时间适应，但会让团队协作更高效！加油！🚀**
