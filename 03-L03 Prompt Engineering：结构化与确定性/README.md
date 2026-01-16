# L03 Prompt Engineering：结构化与确定性

本课程深入探讨如何通过结构化的提示词设计和 API 参数配置，实现更确定、更可控的 LLM 输出。

## 课程目标

1. 理解 JSON mode 和 Stream mode 的作用和使用场景
2. 掌握 Markdown 和 XML 在提示词编写中的优势
3. 学会通过提示词精确控制 LLM 的输出格式和内容

## 课程内容

### 第一部分：API 调用模式

#### 1. 普通模式调用
- 最基本的 LLM 调用方式
- 不使用 JSON mode 和 Stream mode
- 适合简单的对话场景

#### 2. JSON Mode 调用
- 使用 `response_format: { type: "json_object" }` 强制输出 JSON
- 适合需要结构化数据的场景
- 提高输出格式的确定性

#### 3. Stream Mode 调用
- 使用 `stream: true` 实现流式输出
- 实时反馈，提升用户体验
- 适合长文本生成场景

#### 4. JSON + Stream Mode 调用
- 结合 JSON mode 和 Stream mode
- 既保证格式确定性，又提供实时反馈
- 适合需要结构化数据且需要快速响应的场景

### 第二部分：提示词格式

#### 5. Markdown 格式提示词

**优势：**
- **结构清晰**: 使用标题、列表等元素，让提示词层次分明
- **易于阅读**: 人类和 AI 都能更好地理解结构化的内容
- **格式丰富**: 支持粗体、斜体、代码块、列表等多种格式
- **兼容性好**: 大多数 LLM 都理解 Markdown 语法
- **便于维护**: 可以像写文档一样编写提示词

**适用场景：**
- 文档类任务
- 需要人类可读的提示词
- 复杂的多步骤任务说明

#### 6. XML 标签格式提示词

**优势：**
- **边界清晰**: 标签明确标识内容的开始和结束
- **结构化强**: 嵌套结构可以表达复杂的层次关系
- **易于解析**: 输出结果可以直接用 XML 解析器处理
- **语义明确**: 标签名称本身就传达了语义信息
- **格式稳定**: XML 是标准格式，解析更可靠
- **适合结构化输出**: 特别适合需要严格结构化的场景

**适用场景：**
- 数据提取任务
- 需要严格结构化的输出
- 需要机器解析的场景

**Markdown vs XML 对比：**
- **Markdown**: 更适合人类阅读，格式灵活，适合文档类提示词
- **XML**: 更适合机器解析，结构严格，适合结构化数据提取

### 第三部分：输出控制

#### 7. 控制 JSON 输出内容

**关键技巧：**

1. **使用 JSON Schema**: 明确描述期望的数据结构
2. **提供示例**: 让 AI 理解期望的输出格式
3. **使用 XML 标签**: 清晰分隔不同的指令部分
4. **降低 temperature**: 提高输出的确定性和一致性（推荐 0.2-0.3）
5. **启用 JSON mode**: 使用 `response_format: { type: "json_object" }`
6. **明确约束**: 在提示词中明确数据类型、取值范围等约束
7. **验证输出**: 在代码中验证输出是否符合预期格式

## 环境设置

1. 安装依赖：
```bash
npm install
```

2. 设置环境变量：
```bash
export DEEPSEEK_API_KEY="your-api-key"
```

3. 构建 common 模块（如果需要）：
```bash
cd ../common
npm install
npm run build
```

## 运行示例

### 运行单个示例

```bash
# 普通模式
npm run example:normal

# JSON mode
npm run example:json

# Stream mode
npm run example:stream

# JSON + Stream mode
npm run example:json-stream

# Markdown 提示词
npm run example:markdown

# XML 提示词
npm run example:xml

# JSON 输出控制
npm run example:json-control
npm run example:json-comparison  # JSON Mode 参数 vs 提示词要求 JSON 的对比
npm run example:json-requirement  # response_format 与提示词的关系
```

### 使用 ts-node 直接运行

```bash
ts-node src/examples/01-normal-mode.ts
ts-node src/examples/02-json-mode.ts
ts-node src/examples/03-stream-mode.ts
ts-node src/examples/04-json-stream-mode.ts
ts-node src/examples/05-markdown-prompt.ts
ts-node src/examples/06-xml-prompt.ts
ts-node src/examples/07-json-output-control.ts
ts-node src/examples/08-json-mode-comparison.ts
ts-node src/examples/09-json-format-requirement.ts
```

## 项目结构

```
03-L03 Prompt Engineering：结构化与确定性/
├── src/
│   ├── examples/
│   │   ├── 01-normal-mode.ts          # 普通模式调用
│   │   ├── 02-json-mode.ts             # JSON mode 调用
│   │   ├── 03-stream-mode.ts           # Stream mode 调用
│   │   ├── 04-json-stream-mode.ts      # JSON + Stream mode 调用
│   │   ├── 05-markdown-prompt.ts       # Markdown 格式提示词
│   │   ├── 06-xml-prompt.ts            # XML 标签格式提示词
│   │   ├── 07-json-output-control.ts   # 控制 JSON 输出内容
│   │   ├── 08-json-mode-comparison.ts  # JSON Mode 参数 vs 提示词要求 JSON 的对比
│   │   └── 09-json-format-requirement.ts  # response_format 与提示词的关系
│   └── index.ts                        # 主入口文件
├── package.json
├── tsconfig.json
└── README.md
```

## 关键概念

### JSON Mode 参数 vs 提示词要求 JSON

**重要区别**：

#### 1. 仅使用提示词要求 JSON
```typescript
// 不使用 response_format 参数
const response = await client.call({
  messages: [
    { role: 'user', content: '请返回 JSON 格式：{ "name": "xxx" }' }
  ]
})
```

**特点**：
- ✅ 灵活，LLM 可以添加解释性文字
- ✅ 可以返回 Markdown 代码块格式的 JSON
- ❌ **不保证输出是有效的 JSON**
- ❌ 可能包含额外的文字说明（如 "这是 JSON 结果："）
- ❌ 需要手动解析和验证
- ❌ 输出格式可能不一致

**示例输出可能**：
```
这是分析结果：
```json
{
  "sentiment": "positive",
  "rating": 4
}
```
```

#### 2. 使用 `response_format: { type: "json_object" }`
```typescript
// 使用 JSON mode 参数
const response = await client.callJSON({
  messages: [
    { role: 'user', content: '请返回 JSON 格式：{ "name": "xxx" }' }
  ]
})
```

**特点**：
- ✅ **强制输出有效的 JSON 格式**
- ✅ **保证输出可以直接解析**
- ✅ 格式一致，可靠性高
- ✅ 适合需要结构化数据的生产环境
- ❌ 输出必须是纯 JSON，不能有额外文字
- ❌ 某些模型可能对 JSON Schema 的支持有限

**示例输出**：
```json
{
  "sentiment": "positive",
  "rating": 4
}
```

#### 3. 最佳实践

- **生产环境**：使用 `response_format` + 提示词中的 JSON Schema
- **开发调试**：可以先用提示词测试，再用 `response_format` 确保格式
- **复杂场景**：结合使用，在提示词中明确 JSON Schema，用参数强制格式

**运行对比示例**：
```bash
npm run example:json-comparison
```

### JSON Mode
- **作用**: 强制 LLM 输出有效的 JSON 格式
- **使用**: `response_format: { type: "json_object" }`
- **注意**: 需要在 system message 或 prompt 中明确说明输出 JSON

### ⚠️ 重要：response_format 与提示词的关系

**关键问题**：如果设置了 `response_format: { type: "json_object" }` 但提示词中不说明 JSON，结果会怎样？

#### 1. 仅设置 response_format，提示词不提 JSON

**可能的结果**：
- ❌ **API 直接报错**（最常见）：大多数 API（如 OpenAI、DeepSeek）会要求提示词中必须包含 "json" 字样
  - 错误信息：`'messages' must contain the word 'json' in some form, to use 'response_format' of type 'json_object'.`
- ❌ **模型陷入死循环或乱码**（如果 API 没有预校验）
  - 模型"意识"不知道要输出 JSON，但"约束"强制要求 JSON
  - 这种冲突导致模型行为异常

**原因**：
- 这是为了防止模型在"不知道要输出 JSON"的情况下，被底层的强制约束逻辑搞得"逻辑混乱"或陷入死循环

#### 2. 仅提示词要求 JSON，不设置 response_format

**可能的结果**：
- ⚠️ 输出可能是有效的 JSON，但可能包含额外文字
- ⚠️ 输出可能是 Markdown 代码块格式的 JSON
- ⚠️ 格式不一致，需要手动清理

**原因**：
- 模型"知道"要输出 JSON，但没有"强制约束"
- 模型可能会添加解释性文字或使用其他格式

#### 3. 最佳实践：提示词 + response_format 双重设置 ✅

**推荐做法**：
```typescript
const response = await client.callJSON({
  messages: [
    {
      role: 'system',
      content: '你是一个数据提取助手。请始终以 JSON 格式返回结果。', // 👈 提示词明确要求
    },
    {
      role: 'user',
      content: '请提取信息，并以 JSON 格式返回：...', // 👈 再次明确
    },
  ],
  // callJSON() 内部会自动设置 response_format: { type: "json_object" } // 👈 API 参数强制
})
```

**为什么两者都需要？**

这是 **"软件约束"** 与 **"大脑意识"** 的同步：

| 组件 | 角色 | 作用 |
| --- | --- | --- |
| **提示词 (Prompt)** | **大脑（意识）** | 让模型明白：它的目标是生成数据，而不是聊天。它会按 JSON 的逻辑去组织思路。 |
| **Response Format** | **过滤器（护栏）** | 确保即使模型偶尔"分心"，输出的内容也绝对符合 JSON 语法规范。 |

**类比**：
- 提示词 = 告诉司机"去北京"（明确目标）
- response_format = GPS 导航系统（确保路线正确）

#### 4. 特例：OpenAI 的 `json_schema` (Structured Outputs)

只有在 OpenAI 的最新模型中使用 **`type: "json_schema"`** 时，你才可以在提示词里**完全不提** JSON。

- 因为在这种模式下，Schema 已经成为了指令的一部分，系统会自动告诉模型："你现在就是一个填表机器，不需要知道什么是 JSON，照着这个格式填就行。"

**运行示例查看实际效果**：
```bash
npm run example:json-requirement
```

### Stream Mode
- **作用**: 实时流式返回生成的内容
- **使用**: `stream: true`
- **优势**: 提升用户体验，不需要等待完整生成

### Temperature
- **作用**: 控制输出的随机性和创造性
- **范围**: 0.0 - 2.0
- **建议**: 
  - 需要确定性输出时使用 0.2-0.3
  - 需要创造性输出时使用 0.7-0.9

## 最佳实践

1. **结构化提示词**: 使用 Markdown 或 XML 让提示词更清晰
2. **明确输出格式**: 使用 Schema 和示例明确期望的输出
3. **合理使用模式**: 根据场景选择合适的调用模式
4. **验证输出**: 始终验证 LLM 的输出是否符合预期
5. **错误处理**: 处理 JSON 解析失败等异常情况

## 示例总结表

📊 **快速查看所有示例的对比表格**，请查看 [EXAMPLES_SUMMARY.md](./EXAMPLES_SUMMARY.md)

该文档包含：
- 完整的示例对比表（参数、输入、输出、意义）
- 详细参数对比
- 提示词格式对比
- 输出格式对比
- 使用场景推荐
- 关键知识点总结

## 扩展阅读

- [OpenAI API 文档 - JSON Mode](https://platform.openai.com/docs/guides/text-generation/json-mode)
- [OpenAI API 文档 - Streaming](https://platform.openai.com/docs/api-reference/streaming)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
