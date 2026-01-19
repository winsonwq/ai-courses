# AI Agent 配置

> 本文档定义了本项目对 AI Agent 的行为要求和编码规范。
> AI 在执行任何代码相关任务时，必须严格遵守本文档中的规则。

## 目录

- [项目概述](#项目概述)
- [编码规范](#编码规范)
- [Git 工作流](#git-工作流)
- [测试要求](#测试要求)
- [架构约束](#架构约束)
- [特殊规则](#特殊规则)
- [自完善规则](#自完善规则)
- [参考文档](#参考文档)

## 项目概述

### 技术栈
- **语言**：TypeScript (严格模式)
- **运行时**：Node.js 18+
- **框架**：根据项目需要选择
- **包管理**：npm 或 pnpm

### 项目目标
本项目是一个 AI 课程学习项目，旨在通过实践学习 AI 开发相关技术。

### 核心原则
1. **代码质量优先**：可读性 > 性能 > 简洁性
2. **类型安全**：充分利用 TypeScript 的类型系统
3. **文档完善**：代码即文档，注释补充说明
4. **测试驱动**：关键功能必须有测试覆盖

## 编码规范

### TypeScript 规范

#### 类型注解
- ✅ **必须**：所有函数参数和返回值必须有类型注解
- ✅ **推荐**：使用 `interface` 定义对象类型，而非 `type`（除非需要联合类型）
- ❌ **禁止**：使用 `any`，优先使用 `unknown` 或具体类型
- ✅ **必须**：使用 `strict: true` 模式

**示例：**
```typescript
// ✅ 正确
interface User {
  id: number;
  name: string;
}

function getUser(id: number): Promise<User> {
  // ...
}

// ❌ 错误
function getUser(id: any): any {
  // ...
}
```

#### 命名约定
- **变量和函数**：`camelCase`
- **类和接口**：`PascalCase`
- **常量**：`UPPER_SNAKE_CASE`
- **私有成员**：`_privateField`（如果必须使用）
- **文件名**：`kebab-case.ts` 或 `PascalCase.ts`（组件文件）

**示例：**
```typescript
// ✅ 正确
const MAX_RETRY_COUNT = 3;
class UserService { }
function getUserById(id: number) { }
const userService = new UserService();

// ❌ 错误
const maxRetryCount = 3;  // 应该是常量
class userService { }      // 类名应该是 PascalCase
```

#### 代码组织
- 每个文件只导出一个主要功能（类、函数、常量）
- 使用 `export default` 导出主功能
- 辅助函数使用命名导出
- 导入顺序：外部库 → 内部模块 → 类型导入

**示例：**
```typescript
// ✅ 正确
import { readFile } from 'fs/promises';
import { UserService } from './services/user-service';
import type { User } from './types/user';

// ❌ 错误
import * as fs from 'fs';  // 避免使用 import *
```

#### 注释要求
- ✅ **必须**：所有公共函数必须有 JSDoc 注释
- ✅ **推荐**：复杂逻辑必须有行内注释
- ✅ **必须**：TODO 注释必须包含 issue 编号或说明

**JSDoc 模板：**
```typescript
/**
 * 函数功能描述
 * 
 * @param paramName - 参数说明
 * @returns 返回值说明
 * @throws {ErrorType} 异常情况说明
 * 
 * @example
 * ```typescript
 * const result = exampleFunction('input');
 * ```
 */
export function exampleFunction(paramName: string): string {
  // 实现
}
```

### 错误处理

- ✅ **必须**：所有异步函数必须包含 try-catch
- ✅ **必须**：错误信息应该包含上下文信息
- ✅ **推荐**：使用自定义错误类型
- ❌ **禁止**：静默吞掉错误（除非有明确理由）

**示例：**
```typescript
// ✅ 正确
async function fetchUser(id: number): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new UserNotFoundError(`Failed to fetch user ${id}: ${error.message}`);
  }
}

// ❌ 错误
async function fetchUser(id: number): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;  // 没有错误处理
}
```

### 代码风格

- 使用 2 个空格缩进
- 使用单引号（除非字符串包含单引号）
- 行尾不使用分号（除非必要）
- 最大行长度：100 字符
- 对象和数组末尾保留逗号

**示例：**
```typescript
// ✅ 正确
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
}

// ❌ 错误
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000
};
```

## Git 工作流

### Commit 信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关
- `ci`: CI/CD 相关

#### Scope（可选）

指定影响范围，如：`auth`、`api`、`ui`、`config`

#### Subject

- 使用祈使语气（如 "添加" 而非 "添加了"）
- 首字母小写
- 不以句号结尾
- 不超过 50 个字符

#### Body（可选）

- 说明修改的原因和方式
- 与主题行之间空一行
- 每行不超过 72 个字符

#### Footer（可选）

- 关联 issue：`Closes #123`、`Fixes #456`
- 破坏性变更：`BREAKING CHANGE: 描述变更`

#### 示例

```
feat(auth): 添加用户登录功能

实现了基于 JWT 的用户认证系统
支持记住登录状态和自动刷新 token

Closes #123
```

```
fix(api): 修复用户列表分页错误

当 pageSize 为 0 时会导致服务器错误
现在会返回默认值 20

Fixes #456
```

```
docs: 更新 README 安装说明

添加了 Node.js 版本要求和环境变量配置说明
```

### 分支命名

- `main` / `master`: 主分支
- `develop`: 开发分支
- `feature/<name>`: 功能分支
- `fix/<name>`: 修复分支
- `docs/<name>`: 文档分支

### PR 要求

- PR 标题遵循 commit 格式
- PR 描述应该清晰说明变更内容
- 必须通过所有 CI 检查
- 必须有代码审查
- 大型 PR 应该拆分成多个小 PR

## 测试要求

### 覆盖率要求

- 单元测试覆盖率 ≥ 80%
- 关键业务逻辑覆盖率 = 100%
- 工具函数覆盖率 = 100%

### 测试文件命名

- 单元测试：`*.test.ts`
- 集成测试：`*.spec.ts`
- 测试文件与源文件同目录或 `__tests__` 目录

### 测试结构

使用 `describe` 组织测试套件，使用 `it` 或 `test` 编写测试用例：

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when id exists', async () => {
      // 测试代码
    })

    it('should throw error when id not found', async () => {
      // 测试代码
    })
  })
})
```

### Mock 规则

- 外部依赖必须 Mock（API、数据库、文件系统等）
- 使用 `jest.mock()` 或 `vi.mock()`
- Mock 数据应该真实可信
- 测试后清理 Mock

### 测试最佳实践

- 每个测试用例只测试一个功能点
- 使用描述性的测试名称
- 遵循 AAA 模式：Arrange、Act、Assert
- 避免测试实现细节，测试行为

## 架构约束

### 目录结构

```
src/
├── types/          # 类型定义
├── utils/          # 工具函数
├── services/       # 业务逻辑
├── api/            # API 调用
├── config/         # 配置文件
└── __tests__/      # 测试文件
```

### 依赖规则

- 不允许循环依赖
- 上层模块可以依赖下层模块，反之不行
- 共享代码放在 `common/` 或 `shared/` 目录

### 设计原则

- **单一职责**：每个函数/类只做一件事
- **开闭原则**：对扩展开放，对修改关闭
- **依赖注入**：通过构造函数或参数注入依赖
- **接口隔离**：使用小而专的接口

## 特殊规则

### 环境变量

- ✅ **必须**：所有环境变量必须在 `.env.example` 中声明
- ✅ **必须**：使用 `process.env` 访问，并提供默认值
- ❌ **禁止**：在代码中硬编码敏感信息

**示例：**
```typescript
// ✅ 正确
const apiUrl = process.env.API_URL || 'http://localhost:3000';

// ❌ 错误
const apiUrl = 'http://localhost:3000';  // 硬编码
```

### 日志规范

- 使用结构化日志（JSON 格式）
- 日志级别：`debug`、`info`、`warn`、`error`
- 生产环境不输出 `debug` 日志
- 错误日志必须包含堆栈信息

### 性能要求

- API 响应时间 < 500ms（P95）
- 数据库查询使用索引
- 避免 N+1 查询问题
- 大文件使用流式处理

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
3. 如果修改了现有规则，保留历史记录（使用注释）

**示例：**
```markdown
### 错误处理
- 所有异步函数必须包含 try-catch
- 错误信息应该包含上下文信息
- [由 AI 于 2024-01-15 添加] 发现多个函数缺少错误处理，统一添加此规则
```

### AI 指令

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

5. **验证规则**
   - 定期检查规则是否仍然适用
   - 如果规则过时或不再需要，建议删除或更新

## 参考文档

详细的规则说明和示例，请参考 `docs/` 目录下的文档：

- [编码规范详细说明](./docs/coding-standards.md)
- [Git 工作流详细说明](./docs/git-workflow.md)
- [测试指南](./docs/testing-guidelines.md)
- [架构文档](./docs/architecture.md)

---

**最后更新**：2024-01-15  
**维护者**：项目团队  
**版本**：1.0.0
