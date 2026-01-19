# Git 工作流详细说明

本文档详细说明了项目的 Git 工作流程和提交规范。

## Commit 信息规范

### Conventional Commits 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型详解

#### feat - 新功能
用于添加新功能或特性。

```
feat(auth): 添加 OAuth 登录支持

实现了 Google 和 GitHub OAuth 登录功能
- 添加 OAuth 配置管理
- 实现回调处理逻辑
- 添加用户信息同步

Closes #123
```

#### fix - 修复 Bug
用于修复代码中的错误。

```
fix(api): 修复用户列表分页错误

当 pageSize 为 0 时会导致服务器 500 错误
现在会返回默认值 20，并添加参数验证

Fixes #456
```

#### docs - 文档更新
用于更新文档，不涉及代码变更。

```
docs: 更新 API 文档

添加了用户认证相关的 API 端点说明
更新了错误码对照表
```

#### style - 代码格式
用于代码格式调整，不影响功能（空格、缩进、分号等）。

```
style: 统一使用单引号

使用 Prettier 格式化所有文件
统一使用单引号而非双引号
```

#### refactor - 重构
用于代码重构，既不是新功能也不是修复 bug。

```
refactor(user-service): 提取用户验证逻辑

将用户验证逻辑提取到独立的 Validator 类
提高代码可测试性和可维护性
```

#### perf - 性能优化
用于性能相关的改进。

```
perf(database): 优化用户查询性能

添加数据库索引
使用连接池减少连接开销
查询时间从 500ms 降低到 50ms
```

#### test - 测试相关
用于添加或修改测试代码。

```
test(user-service): 添加用户创建测试

添加了用户创建功能的单元测试
覆盖正常流程和异常情况
测试覆盖率达到 90%
```

#### chore - 构建/工具相关
用于构建工具、依赖管理、配置文件等。

```
chore: 更新依赖版本

更新 TypeScript 到 5.0
更新 Jest 到 29.0
修复安全漏洞
```

#### ci - CI/CD 相关
用于持续集成和部署相关的变更。

```
ci: 添加 GitHub Actions 工作流

添加自动测试和代码检查工作流
添加自动部署到 staging 环境
```

### Scope 范围说明

Scope 应该明确指定变更影响的范围：

- `auth`: 认证相关
- `api`: API 相关
- `ui`: 用户界面
- `db`: 数据库
- `config`: 配置
- `utils`: 工具函数
- `test`: 测试
- `docs`: 文档

如果变更影响多个范围，可以省略 scope 或使用 `*`。

### Subject 主题行规则

1. **使用祈使语气**
   - ✅ "添加用户登录功能"
   - ❌ "添加了用户登录功能"
   - ❌ "添加用户登录功能了"

2. **首字母小写**
   - ✅ "fix: 修复登录 bug"
   - ❌ "fix: 修复登录 Bug"

3. **不以句号结尾**
   - ✅ "feat: 添加新功能"
   - ❌ "feat: 添加新功能。"

4. **长度限制**
   - 不超过 50 个字符
   - 如果超过，在 body 中详细说明

5. **清晰明确**
   - ✅ "fix: 修复分页参数验证"
   - ❌ "fix: 修复 bug"
   - ❌ "fix: 更新代码"

### Body 正文规则

1. **说明原因和方式**
   - 为什么做这个变更
   - 如何实现的
   - 有什么影响

2. **格式要求**
   - 与 subject 之间空一行
   - 每行不超过 72 个字符
   - 使用列表说明多个变更点

3. **示例**
```
feat(auth): 添加 JWT 刷新机制

实现了自动刷新 JWT token 的功能：
- 在 token 过期前 5 分钟自动刷新
- 使用 refresh token 获取新的 access token
- 刷新失败时自动登出用户

这解决了用户在使用过程中突然被登出的问题。
```

### Footer 页脚规则

#### 关联 Issue

```
Closes #123
Fixes #456
Resolves #789
```

#### 破坏性变更

```
BREAKING CHANGE: API 响应格式变更

用户列表 API 的响应格式从数组改为对象：
- 旧格式: User[]
- 新格式: { data: User[], total: number, page: number }

迁移指南：更新所有调用该 API 的代码
```

## 分支管理

### 分支命名规范

#### 主分支
- `main` 或 `master`: 生产环境代码
- `develop`: 开发环境代码

#### 功能分支
```
feature/<功能名称>
feature/user-authentication
feature/payment-integration
```

#### 修复分支
```
fix/<问题描述>
fix/login-error
fix/memory-leak
```

#### 文档分支
```
docs/<文档主题>
docs/api-documentation
docs/installation-guide
```

#### 热修复分支
```
hotfix/<问题描述>
hotfix/security-patch
hotfix/critical-bug
```

### 分支工作流

#### 功能开发流程

1. 从 `develop` 创建功能分支
```bash
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication
```

2. 在功能分支上开发
```bash
# 开发代码
git add .
git commit -m "feat: 添加用户认证功能"
```

3. 推送到远程
```bash
git push origin feature/user-authentication
```

4. 创建 Pull Request
   - 从 `feature/user-authentication` 到 `develop`
   - 填写 PR 描述
   - 等待代码审查

5. 合并后删除分支
```bash
git checkout develop
git pull origin develop
git branch -d feature/user-authentication
```

#### 热修复流程

1. 从 `main` 创建热修复分支
```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug
```

2. 修复问题并提交
```bash
git commit -m "fix: 修复关键 bug"
```

3. 合并到 `main` 和 `develop`
```bash
# 合并到 main
git checkout main
git merge hotfix/critical-bug
git push origin main

# 合并到 develop
git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

## Pull Request 规范

### PR 标题

PR 标题应该遵循 commit 格式：

```
feat(auth): 添加 OAuth 登录支持
fix(api): 修复用户列表分页错误
```

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 重构
- [ ] 性能优化
- [ ] 其他

## 变更描述
简要描述这次 PR 的内容和目的。

## 相关 Issue
Closes #123

## 变更内容
- 变更点 1
- 变更点 2
- 变更点 3

## 测试说明
- [ ] 已添加单元测试
- [ ] 已添加集成测试
- [ ] 已手动测试

## 截图（如适用）
<!-- 如果是 UI 相关变更，请添加截图 -->

## 检查清单
- [ ] 代码符合项目规范
- [ ] 已通过所有测试
- [ ] 已更新相关文档
- [ ] 已通过代码审查
```

### PR 审查要求

1. **代码质量**
   - 代码符合项目规范
   - 没有明显的 bug
   - 错误处理完善

2. **测试覆盖**
   - 新功能有对应的测试
   - 测试通过
   - 覆盖率达标

3. **文档更新**
   - 更新了相关文档
   - 添加了必要的注释

4. **性能影响**
   - 没有明显的性能问题
   - 大型变更需要性能测试

## Git Hooks

### Pre-commit Hook

在提交前自动运行：
- 代码格式化（Prettier）
- 代码检查（ESLint）
- 测试（如果快速测试）

### Commit-msg Hook

验证 commit 信息格式：
- 检查是否符合 Conventional Commits 格式
- 检查 subject 长度
- 检查 type 是否有效

### Pre-push Hook

在推送前运行：
- 运行完整测试套件
- 检查代码覆盖率
- 检查是否有未提交的变更

## 最佳实践

### 1. 频繁提交
- 每完成一个小功能就提交
- 提交信息清晰明确
- 避免大型提交

### 2. 保持分支同步
- 定期从主分支拉取更新
- 及时解决冲突
- 保持分支干净

### 3. 使用 Rebase
- 在合并前使用 rebase 整理提交历史
- 保持线性提交历史
- 避免不必要的合并提交

### 4. 代码审查
- 所有 PR 必须经过审查
- 认真对待审查意见
- 及时回复和修改

### 5. 提交前检查
- 运行测试确保通过
- 检查代码格式
- 确认没有调试代码

## 常见问题

### Q: 如何修改上一个 commit 的信息？
```bash
git commit --amend -m "新的 commit 信息"
```

### Q: 如何合并多个 commit？
```bash
git rebase -i HEAD~3  # 交互式 rebase 最近 3 个 commit
```

### Q: 如何撤销已推送的 commit？
```bash
# 创建新的 commit 撤销
git revert <commit-hash>

# 或者强制推送（谨慎使用）
git reset --hard <commit-hash>
git push --force
```

### Q: 如何从其他分支 cherry-pick commit？
```bash
git cherry-pick <commit-hash>
```
