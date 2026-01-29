# L04 AGENTS.md：AI Agent 配置文件详解

本课程深入探讨如何通过 `AGENTS.md` 文件配置 AI Agent 的行为，实现更精准、更可控的 AI 辅助开发体验。

## 课程目标

1. 理解 `AGENTS.md` 文件的来历和作用机制
2. 掌握 `AGENTS.md` 与 `README.md` 的区别和使用场景
3. 了解各种 AI Agent 配置文件的类型和用途
4. 学会编写和维护 `AGENTS.md` 文件
5. 掌握如何让 AI 自动完善配置文件

## 课程内容

### 第一部分：AGENTS.md 的来历与机制

#### 1. 为什么 AI 认识 AGENTS.md？

`AGENTS.md` 是一个约定俗成的文件名，被许多 AI 开发工具（如 Cursor、GitHub Copilot、Claude Desktop 等）自动识别和加载。

**识别机制：**
- **文件名约定**：AI 工具会在项目根目录查找 `AGENTS.md` 文件
- **自动加载**：当 AI 开始处理项目时，会自动读取并应用该文件中的规则
- **上下文注入**：文件内容会被注入到 AI 的上下文中，影响其行为

**为什么叫 AGENTS.md？**
- "Agent" 代表 AI 代理，即执行任务的 AI 助手
- `.md` 表示 Markdown 格式，便于人类阅读和 AI 解析
- 这是一个行业约定，类似于 `README.md`、`LICENSE` 等标准文件名

#### 2. AGENTS.md 的作用

`AGENTS.md` 是专门为 AI Agent 设计的配置文件，用于：

- **定义项目规范**：编码风格、命名约定、架构原则
- **指导 AI 行为**：告诉 AI 如何编写代码、如何提交代码
- **提供上下文**：项目背景、技术栈、特殊要求
- **约束 AI 输出**：确保 AI 生成的代码符合项目标准

### 第二部分：AGENTS.md vs README.md

#### 对比表

| 特性 | AGENTS.md | README.md |
|------|-----------|-----------|
| **目标读者** | AI Agent | 人类开发者 |
| **主要用途** | 配置 AI 行为 | 项目介绍和文档 |
| **内容重点** | 规则、约束、指令 | 功能说明、使用方法 |
| **格式要求** | 结构化、可执行 | 友好、易读 |
| **更新频率** | 频繁（随项目演进） | 相对稳定 |
| **AI 读取** | ✅ 自动读取并应用 | ⚠️ 可能读取但不强制应用 |

#### 使用场景区分

**AGENTS.md 应该包含：**
- ✅ 编码规范和风格指南
- ✅ Git 提交信息格式
- ✅ 代码审查标准
- ✅ 测试要求
- ✅ 架构决策和约束
- ✅ 特殊工具和流程说明

**README.md 应该包含：**
- ✅ 项目介绍和功能说明
- ✅ 安装和使用方法
- ✅ 项目结构说明
- ✅ 贡献指南（面向人类）
- ✅ 许可证信息
- ✅ 联系方式

**示例对比：**

```markdown
<!-- AGENTS.md -->
## 编码规范
- 使用 TypeScript，严格模式
- 函数名使用 camelCase
- 类名使用 PascalCase
- 必须包含 JSDoc 注释

<!-- README.md -->
## 项目介绍
这是一个使用 TypeScript 开发的 Web 应用，提供了...
```

### 第三部分：其他 AI Agent 配置文件

#### 标准配置文件

##### 1. `.cursorrules`
- **用途**：Cursor IDE 的专用配置文件
- **位置**：项目根目录
- **格式**：纯文本或 Markdown
- **特点**：Cursor 会自动读取并应用
- **优先级**：通常高于 `AGENTS.md`（如果同时存在）

**示例：**
```
使用 TypeScript 严格模式
所有函数必须有类型注解
使用 ESLint 和 Prettier
```

##### 2. `.github/copilot-instructions.md`
- **用途**：GitHub Copilot 的指令文件
- **位置**：`.github/` 目录下
- **格式**：Markdown
- **特点**：GitHub Copilot 会自动识别

##### 3. `.aiderignore`
- **用途**：Aider AI 代码助手的忽略文件
- **位置**：项目根目录
- **格式**：类似 `.gitignore`
- **特点**：指定 Aider 不应修改的文件

##### 4. `.promptrules` 或 `.promptrules.md`
- **用途**：通用 AI 提示词规则文件
- **位置**：项目根目录
- **格式**：Markdown 或纯文本
- **特点**：某些 AI 工具会识别

#### 非标准但常用的配置文件

##### 1. `AI_RULES.md` / `AI_RULES.txt`
- **用途**：自定义 AI 规则文件
- **特点**：需要工具明确支持

##### 2. `.ai-config.json`
- **用途**：JSON 格式的 AI 配置
- **格式**：JSON
- **特点**：结构化配置，便于程序解析

##### 3. `docs/ai-guidelines.md`
- **用途**：将 AI 规则放在 docs 目录
- **特点**：组织更清晰，适合大型项目

##### 4. `CONTRIBUTING.md`（部分内容）
- **用途**：贡献指南，AI 也会参考
- **特点**：人类和 AI 都能使用

### 第四部分：AGENTS.md 的结构与内容

#### 推荐结构

```markdown
# AI Agent 配置

## 目录
- [项目概述](#项目概述)
- [编码规范](#编码规范)
- [Git 工作流](#git-工作流)
- [测试要求](#测试要求)
- [架构约束](#架构约束)
- [特殊规则](#特殊规则)
- [参考文档](#参考文档)

## 项目概述
...

## 编码规范
...

## Git 工作流
...

## 测试要求
...

## 架构约束
...

## 特殊规则
...

## 参考文档
详见 [docs/](./docs/) 目录
```

#### 为什么需要目录？

1. **便于导航**：AI 和人类都能快速定位内容
2. **模块化组织**：不同规则可以放在不同章节
3. **引用方便**：可以在文档中交叉引用
4. **扩展性好**：可以链接到 `docs/` 目录下的详细规则

### 第五部分：通用规则示例

#### Git Commit 规则

```markdown
## Git 工作流

### Commit 信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**
```
feat(auth): 添加用户登录功能

实现了基于 JWT 的用户认证系统
支持记住登录状态

Closes #123
```

**规则：**
- 主题行不超过 50 个字符
- 主题行使用祈使语气（如 "添加" 而非 "添加了"）
- 正文和主题行之间空一行
- 正文每行不超过 72 个字符
```

#### 编码规范示例

```markdown
## 编码规范

### TypeScript 规范

1. **类型注解**
   - 所有函数参数和返回值必须有类型注解
   - 使用 `interface` 定义对象类型
   - 避免使用 `any`，优先使用 `unknown`

2. **命名约定**
   - 变量和函数：`camelCase`
   - 类和接口：`PascalCase`
   - 常量：`UPPER_SNAKE_CASE`
   - 私有成员：`_privateField`

3. **代码组织**
   - 每个文件只导出一个主要功能
   - 使用 `export default` 导出主功能
   - 辅助函数使用命名导出

4. **注释要求**
   - 所有公共函数必须有 JSDoc 注释
   - 复杂逻辑必须有行内注释
   - TODO 注释必须包含 issue 编号

**示例：**
```typescript
/**
 * 计算两个数的和
 * @param a - 第一个数
 * @param b - 第二个数
 * @returns 两数之和
 */
export function add(a: number, b: number): number {
  return a + b;
}
```
```

#### 测试要求示例

```markdown
## 测试要求

1. **覆盖率要求**
   - 单元测试覆盖率 ≥ 80%
   - 关键业务逻辑覆盖率 = 100%

2. **测试文件命名**
   - 单元测试：`*.test.ts`
   - 集成测试：`*.spec.ts`
   - 测试文件与源文件同目录

3. **测试结构**
   - 使用 `describe` 组织测试套件
   - 使用 `it` 或 `test` 编写测试用例
   - 每个测试用例只测试一个功能点

4. **Mock 规则**
   - 外部依赖必须 Mock
   - 使用 `jest.mock()` 或 `vi.mock()`
   - Mock 数据应该真实可信
```

### 第六部分：如何不断完善 AGENTS.md

#### 方法一：手动维护

**何时添加规则：**
- 发现 AI 生成的代码不符合项目标准
- 团队讨论确定了新的规范
- 项目架构发生变化
- 引入了新的工具或框架

**维护流程：**
1. 发现问题 → 2. 分析原因 → 3. 制定规则 → 4. 更新 AGENTS.md → 5. 验证效果

**示例场景：**
```
问题：AI 生成的函数缺少错误处理
解决：在 AGENTS.md 中添加"所有异步函数必须包含 try-catch"
```

#### 方法二：让 AI 自己完善

**在 AGENTS.md 中添加自完善规则：**

```markdown
## 自完善规则

### 规则更新流程

当 AI 在执行任务时发现以下情况，应该主动更新 AGENTS.md：

1. **发现新的编码模式**
   - 如果项目中存在重复的编码模式，应该将其总结为规则
   - 例如：发现所有 API 路由都使用相同的错误处理模式

2. **发现不一致的地方**
   - 如果发现代码与现有规则不一致，应该：
     a) 先修复代码使其符合规则
     b) 如果规则不合理，更新规则并说明原因

3. **发现最佳实践**
   - 如果在项目中发现了更好的实践方式，应该：
     a) 在 AGENTS.md 中记录
     b) 在相关代码中添加注释说明

### 更新格式

更新 AGENTS.md 时，应该：
1. 在相关章节添加新规则
2. 在规则后添加 `[由 AI 于 YYYY-MM-DD 添加]` 标记
3. 如果修改了现有规则，保留历史记录

**示例：**
```markdown
## 编码规范

### 错误处理
- 所有异步函数必须包含 try-catch
- 错误信息应该包含上下文信息
- [由 AI 于 2024-01-15 添加] 发现多个函数缺少错误处理，统一添加此规则
```
```

**使用提示词让 AI 自动完善：**

```markdown
## AI 指令

在执行任何代码修改任务时，AI 应该：

1. **检查一致性**
   - 检查生成的代码是否符合 AGENTS.md 中的所有规则
   - 如果不符合，先修改代码，再考虑是否需要更新规则

2. **识别模式**
   - 观察项目中的编码模式
   - 如果发现重复模式，建议将其添加到 AGENTS.md

3. **主动建议**
   - 如果发现可以改进的地方，主动建议更新 AGENTS.md
   - 提供具体的规则建议和理由

4. **记录决策**
   - 对于重要的架构决策，在 AGENTS.md 中记录
   - 说明决策原因和影响范围
```

### 第七部分：其他 AI Agent 交互文件

#### 标准文件夹和文件

##### 1. `.github/` 目录
- **`copilot-instructions.md`**：GitHub Copilot 指令
- **`CODEOWNERS`**：代码所有者（AI 可能参考）
- **`pull_request_template.md`**：PR 模板（AI 生成 PR 时参考）

##### 2. `docs/` 目录
- **`architecture.md`**：架构文档（AI 理解项目结构）
- **`api.md`**：API 文档（AI 生成 API 代码时参考）
- **`guidelines/`**：各种指南文档
  - `coding-standards.md`
  - `testing-guidelines.md`
  - `deployment.md`

##### 3. 配置文件
- **`tsconfig.json`**：TypeScript 配置（AI 理解类型系统）
- **`eslintrc.js`**：ESLint 配置（AI 遵循代码规范）
- **`prettierrc`**：Prettier 配置（AI 格式化代码）
- **`package.json`**：依赖和脚本（AI 了解项目依赖）

#### 非标准但有用的文件

##### 1. `AI_CONTEXT.md`
- **用途**：提供项目上下文信息
- **内容**：项目背景、业务逻辑、特殊要求

##### 2. `AI_EXAMPLES.md`
- **用途**：提供代码示例
- **内容**：展示期望的代码风格和模式

##### 3. `.aiignore`
- **用途**：指定 AI 不应处理的文件
- **格式**：类似 `.gitignore`

##### 4. `docs/ai/` 目录
- **用途**：专门存放 AI 相关文档
- **结构**：
  ```
  docs/ai/
  ├── rules.md          # 详细规则
  ├── examples.md       # 代码示例
  ├── patterns.md       # 设计模式
  └── decisions.md      # 架构决策记录
  ```

## 实践建议

### 1. 渐进式完善
- 不要一开始就写完整的 AGENTS.md
- 从基本规则开始，逐步添加
- 根据实际使用情况调整

### 2. 保持简洁
- 规则要清晰明确
- 避免过于复杂的规则
- 优先使用示例说明

### 3. 定期审查
- 定期检查规则是否仍然适用
- 删除过时的规则
- 合并重复的规则

### 4. 团队协作
- 与团队成员讨论规则
- 确保规则符合团队习惯
- 记录规则变更历史

### 5. 版本控制
- 将 AGENTS.md 纳入版本控制
- 重要变更通过 PR 审查
- 在 commit 中说明规则变更原因

## 项目结构

```
04-L04 AGENTS.md：AI Agent 配置文件详解/
├── README.md                    # 本文件
├── AGENTS.md                    # AI Agent 配置文件示例
├── .cursorrules                 # Cursor IDE 配置示例
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot 配置示例
├── docs/
│   ├── coding-standards.md      # 编码规范详细说明
│   ├── git-workflow.md          # Git 工作流详细说明
│   ├── testing-guidelines.md    # 测试指南
│   └── architecture.md          # 架构文档示例
└── examples/
    └── example-project/         # 示例项目
```

## 参考资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Cursor Rules Documentation](https://cursor.sh/docs)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [AI Coding Assistant Best Practices](https://github.com/features/copilot)

## 下一步

1. 查看 [AGENTS.md](./AGENTS.md) 查看完整示例
2. 查看 [docs/](./docs/) 目录了解详细规则文档
3. 参考示例项目了解实际应用
4. 开始为你的项目创建 AGENTS.md
