# 示例总结表

本文档包含所有示例的详细对比表格，方便快速查看和选择适合的示例。

## 完整示例对比表

| 序号 | 示例名称 | 文件 | API 参数 | 输入示例 | 输出特点 | 核心意义 | 适用场景 |
|------|---------|------|----------|----------|----------|----------|----------|
| **1** | **普通模式调用** | `01-normal-mode.ts` | `stream: false`<br>`response_format: 无`<br>`temperature: 0.7` | "请介绍一下人工智能的发展历史，用简洁的语言概括。" | 完整文本回复<br>一次性返回<br>格式自由 | 最基本的调用方式，适合简单对话 | 简单问答、对话场景 |
| **2** | **JSON Mode 调用** | `02-json-mode.ts` | `stream: false`<br>`response_format: { type: "json_object" }`<br>`temperature: 0.3` | "请提取以下文本中的关键信息，并以 JSON 格式返回：<br>文本：张三，25岁，软件工程师..." | 强制 JSON 格式<br>可直接解析<br>格式确定 | 强制输出结构化数据，提高格式确定性 | 数据提取、结构化输出 |
| **2b** | **JSON Mode 手动设置** | `02b-json-mode-manual.ts` | `stream: false`<br>`response_format: { type: "json_object" }`<br>`temperature: 0.3` | 同上 | 同上 | 展示如何手动设置 response_format 参数 | 理解参数设置方式 |
| **3** | **Stream Mode 调用** | `03-stream-mode.ts` | `stream: true`<br>`response_format: 无`<br>`temperature: 0.8` | "请写一首关于春天的短诗，大约 4 行。" | 流式输出<br>实时显示<br>逐字符返回 | 实时反馈，提升用户体验 | 长文本生成、需要实时反馈的场景 |
| **4** | **JSON + Stream Mode** | `04-json-stream-mode.ts` | `stream: true`<br>`response_format: { type: "json_object" }`<br>`temperature: 0.3` | "请分析以下销售数据，返回 JSON 格式的分析结果：<br>月份: 1月, 2月, 3月..." | 流式输出 JSON<br>实时结构化数据<br>格式确定 | 结合流式和结构化，既实时又确定 | 需要快速响应的结构化数据场景 |
| **5** | **Markdown 格式提示词** | `05-markdown-prompt.ts` | `stream: false`<br>`response_format: 无`<br>`temperature: 0.7` | Markdown 格式的提示词：<br>`# 任务说明`<br>`## 输入要求`<br>`### 输出格式` | 结构化输出<br>遵循 Markdown 格式<br>层次清晰 | 使用 Markdown 让提示词更清晰易读 | 复杂任务说明、文档类提示词 |
| **6** | **XML 标签格式提示词** | `06-xml-prompt.ts` | `stream: false`<br>`response_format: 无`<br>`temperature: 0.3` | XML 标签格式的提示词：<br>`<task>...</task>`<br>`<instructions>...</instructions>`<br>`<output_format>...</output_format>` | XML 格式输出<br>边界清晰<br>易于解析 | 使用 XML 标签明确边界，便于机器解析 | 数据提取、需要严格结构化的场景 |
| **7** | **控制 JSON 输出内容** | `07-json-output-control.ts` | `stream: false`<br>`response_format: { type: "json_object" }`<br>`temperature: 0.2-0.3` | 包含 JSON Schema、示例、约束的提示词 | 精确符合 Schema 的 JSON<br>格式完全可控 | 通过 Schema、示例、约束精确控制输出 | 需要严格数据结构的生产环境 |
| **8** | **JSON Mode 对比** | `08-json-mode-comparison.ts` | 对比三种方式：<br>1. 仅提示词要求 JSON<br>2. 仅设置 response_format<br>3. 两者结合 | 产品评论分析任务 | 对比三种方式的输出差异 | 理解提示词要求与 API 参数的区别 | 理解 JSON mode 的工作原理 |
| **9** | **response_format 与提示词关系** | `09-json-format-requirement.ts` | 测试三种情况：<br>1. 仅 response_format<br>2. 仅提示词要求<br>3. 两者结合 | 数据提取任务 | 展示错误情况和正确做法 | 理解为什么必须同时使用提示词和参数 | 避免常见错误，掌握最佳实践 |
| **10** | **XML 标签隔离与 Few-shot** | `10-xml-isolation-fewshot.ts` | `stream: false`<br>`response_format: 无`<br>`temperature: 0.2-0.3` | XML 标签格式提示词 + Few-shot 示例 | 结构化 XML 输出<br>格式高度一致<br>准确率高 | 展示 XML 标签隔离和 Few-shot 学习的优势 | 复杂数据提取、需要高准确率的场景 |

## 详细参数对比

### API 参数设置

| 示例 | stream | response_format | temperature | 其他参数 |
|------|--------|-----------------|-------------|----------|
| 01-普通模式 | `false` | 无 | `0.7` | - |
| 02-JSON Mode | `false` | `{ type: "json_object" }` | `0.3` | - |
| 02b-JSON 手动 | `false` | `{ type: "json_object" }` | `0.3` | - |
| 03-Stream Mode | `true` | 无 | `0.8` | - |
| 04-JSON+Stream | `true` | `{ type: "json_object" }` | `0.3` | - |
| 05-Markdown | `false` | 无 | `0.7` | - |
| 06-XML | `false` | 无 | `0.3` | - |
| 07-JSON 控制 | `false` | `{ type: "json_object" }` | `0.2-0.3` | JSON Schema |
| 08-对比 | `false` | 三种情况 | `0.3` | - |
| 09-关系 | `false` | 三种情况 | `0.3` | - |
| 10-XML+Few-shot | `false` | 无 | `0.2-0.3` | XML 标签 + Few-shot |

### 提示词格式对比

| 示例 | 提示词格式 | 特点 | 优势 |
|------|-----------|------|------|
| 01-普通模式 | 纯文本 | 简单直接 | 易于理解 |
| 02-JSON Mode | 纯文本 + 要求 JSON | 明确要求格式 | 格式确定 |
| 05-Markdown | Markdown 格式 | 使用标题、列表 | 结构清晰，易于阅读 |
| 06-XML | XML 标签 | 使用标签分隔 | 边界清晰，易于解析 |
| 07-JSON 控制 | Markdown + JSON Schema + 示例 | 包含 Schema 和示例 | 精确控制输出结构 |
| 10-XML+Few-shot | XML 标签 + Few-shot 示例 | XML 标签隔离 + 多个示例 | 结构清晰，准确率高 |

## 输出格式对比

| 示例 | 输出格式 | 可解析性 | 格式确定性 | 实时性 |
|------|---------|----------|------------|--------|
| 01-普通模式 | 自由文本 | ❌ 不可直接解析 | ⚠️ 不确定 | ✅ 一次性返回 |
| 02-JSON Mode | 纯 JSON | ✅ 可直接解析 | ✅ 确定 | ✅ 一次性返回 |
| 03-Stream Mode | 自由文本 | ❌ 不可直接解析 | ⚠️ 不确定 | ✅ 实时流式 |
| 04-JSON+Stream | 流式 JSON | ✅ 可解析 | ✅ 确定 | ✅ 实时流式 |
| 05-Markdown | Markdown 格式 | ⚠️ 需要解析 | ⚠️ 相对确定 | ✅ 一次性返回 |
| 06-XML | XML 格式 | ✅ 可解析 | ✅ 确定 | ✅ 一次性返回 |
| 07-JSON 控制 | 精确 JSON | ✅ 可直接解析 | ✅ 完全确定 | ✅ 一次性返回 |

## 使用场景推荐

### 按需求选择示例

| 需求 | 推荐示例 | 原因 |
|------|---------|------|
| 简单对话 | 01-普通模式 | 最简单，无需特殊配置 |
| 需要结构化数据 | 02-JSON Mode | 强制 JSON 格式，易于解析 |
| 需要实时反馈 | 03-Stream Mode | 流式输出，用户体验好 |
| 结构化 + 实时 | 04-JSON+Stream | 两者结合 |
| 复杂任务说明 | 05-Markdown | 结构清晰，易于维护 |
| 数据提取 | 06-XML | 边界清晰，易于解析 |
| 生产环境 | 07-JSON 控制 | 格式完全可控，可靠性高 |
| 理解原理 | 08-对比、09-关系 | 展示不同方式的区别 |

### 按输出类型选择

| 输出类型 | 推荐示例 | 关键参数 |
|---------|---------|----------|
| 自由文本 | 01, 03, 05 | `response_format: 无` |
| JSON 数据 | 02, 04, 07 | `response_format: { type: "json_object" }` |
| XML 数据 | 06 | 使用 XML 标签格式提示词 |
| 实时输出 | 03, 04 | `stream: true` |
| 一次性输出 | 01, 02, 05, 06, 07 | `stream: false` |

## 关键知识点总结

### 1. JSON Mode 的使用

- **必须同时设置**：`response_format: { type: "json_object" }` + 提示词中明确要求 JSON
- **仅设置参数**：API 可能报错，要求提示词中包含 "json" 字样
- **仅提示词要求**：输出可能包含额外文字，格式不一致
- **最佳实践**：两者结合，100% 可靠

### 2. Stream Mode 的使用

- **优势**：实时反馈，提升用户体验
- **适用场景**：长文本生成、需要快速响应的场景
- **注意**：需要处理流式数据，代码稍复杂

### 3. 提示词格式选择

- **Markdown**：适合人类阅读，结构清晰，适合复杂任务说明
- **XML**：适合机器解析，边界清晰，适合数据提取
- **纯文本**：最简单，适合简单任务

### 4. Temperature 设置

- **需要确定性**：`0.2-0.3`（JSON 输出、数据提取）
- **需要创造性**：`0.7-0.9`（文本生成、创意写作）
- **平衡**：`0.5-0.7`（一般对话）

## 快速运行命令

```bash
# 进入项目目录
cd "03-L03 Prompt Engineering：结构化与确定性"

# 运行各个示例
npm run example:normal          # 示例 1
npm run example:json            # 示例 2
npm run example:json-manual     # 示例 2b
npm run example:stream          # 示例 3
npm run example:json-stream    # 示例 4
npm run example:markdown        # 示例 5
npm run example:xml             # 示例 6
npm run example:json-control    # 示例 7
npm run example:json-comparison # 示例 8
npm run example:json-requirement # 示例 9
```

## 示例文件索引

| 文件 | 示例编号 | 主要演示内容 |
|------|---------|-------------|
| `01-normal-mode.ts` | 1 | 基本调用方式 |
| `02-json-mode.ts` | 2 | JSON mode 使用 |
| `02b-json-mode-manual.ts` | 2b | 手动设置 response_format |
| `03-stream-mode.ts` | 3 | Stream mode 使用 |
| `04-json-stream-mode.ts` | 4 | JSON + Stream 结合 |
| `05-markdown-prompt.ts` | 5 | Markdown 格式提示词 |
| `06-xml-prompt.ts` | 6 | XML 标签格式提示词 |
| `07-json-output-control.ts` | 7 | 精确控制 JSON 输出 |
| `08-json-mode-comparison.ts` | 8 | JSON mode 对比 |
| `09-json-format-requirement.ts` | 9 | response_format 与提示词关系 |
| `10-xml-isolation-fewshot.ts` | 10 | XML 标签隔离与 Few-shot 学习 |

---

**最后更新**：2024-01-16
