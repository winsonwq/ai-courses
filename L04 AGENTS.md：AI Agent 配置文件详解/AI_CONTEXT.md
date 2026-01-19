# AI 上下文信息

本文档为 AI Agent 提供项目的上下文信息，帮助 AI 更好地理解项目背景和特殊要求。

## 项目背景

### 项目名称
AI 课程学习项目

### 项目目标
通过实践学习 AI 开发相关技术，包括：
- LLM 基础使用
- Tool Use 和 Agent 开发
- Prompt Engineering
- AI Agent 配置和管理

### 目标受众
- AI 开发初学者
- 希望学习 AI 辅助开发的开发者
- 对 AI Agent 配置感兴趣的开发者

## 技术栈

### 后端
- **语言**：TypeScript
- **运行时**：Node.js 18+
- **包管理**：npm

### 开发工具
- **IDE**：Cursor / VS Code
- **代码检查**：ESLint
- **代码格式化**：Prettier
- **测试框架**：Jest

## 项目结构

```
ai-lessions/
├── 01-llm/                    # LLM 基础
├── 02-L02 .../                # Tool Use 实操
├── 03-L03 .../                # Prompt Engineering
├── 04-L04 .../                # AGENTS.md 配置（当前课程）
├── common/                    # 公共模块
│   ├── src/
│   │   ├── llm-client.ts      # LLM 客户端封装
│   │   └── env-loader.ts      # 环境变量加载
└── docs/                      # 文档
```

## 特殊要求

### 代码风格
- 所有课程代码应该清晰易懂，适合教学
- 添加充分的注释说明
- 使用有意义的变量名

### 文档要求
- 每个课程都有详细的 README.md
- 代码示例应该完整可运行
- 提供清晰的运行说明

### 依赖管理
- 使用 `common` 模块共享代码
- 避免重复代码
- 保持依赖版本一致

## 常见模式

### LLM 调用模式
项目使用 `common/src/llm-client.ts` 封装的 LLM 客户端：

```typescript
import { LLMClient } from '../common/src/llm-client';

const client = new LLMClient();
const response = await client.call({
  messages: [
    { role: 'user', content: 'Hello' }
  ]
});
```

### 环境变量
使用 `common/src/env-loader.ts` 加载环境变量：

```typescript
import { loadEnv } from '../common/src/env-loader';

loadEnv();  // 加载 .env 文件
```

## 开发流程

### 创建新课程
1. 创建课程目录（格式：`04-L04 课程名称`）
2. 创建 `README.md` 说明文档
3. 创建 `package.json` 和 `tsconfig.json`
4. 创建示例代码
5. 更新根目录 `README.md`

### 代码审查
- 确保代码符合项目规范
- 检查文档是否完整
- 验证示例代码可运行

## 注意事项

### 不要做的事情
- ❌ 不要硬编码 API Key
- ❌ 不要提交 `.env` 文件
- ❌ 不要使用过时的 API
- ❌ 不要忽略错误处理

### 应该做的事情
- ✅ 使用环境变量管理配置
- ✅ 添加错误处理
- ✅ 编写清晰的文档
- ✅ 提供可运行的示例

## 参考资源

- [项目主 README](../README.md)
- [AGENTS.md](./AGENTS.md) - AI Agent 配置
- [编码规范](./docs/coding-standards.md)
- [Git 工作流](./docs/git-workflow.md)
