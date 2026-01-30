---
name: tech_article_deep_dive
description: 针对特定技术话题进行深度调研、解读并撰写高质量技术文章的技能
---

# Tech Article Deep Dive Skill

此技能用于指导 Agent 对用户指定的 **技术话题** 进行深度调研和解读，并最终输出一篇高质量的技术文章。

## 1. 环境准备
- 检查当前目录下是否存在 `articles` 文件夹。如果不存在，请使用 `run_command` 创建：`mkdir -p articles`。

## 2. 深度调研 (Research Phase)
不要仅依赖模型训练数据，必须使用 `search_web` 工具即时获取最新、最权威的信息。
- **目标源**：重点关注 GitHub, Google, Medium, Rabbit, TechCrunch, DeepLearning.ai, OpenAI Blog, arXiv 等权威技术平台。
- **调研维度**：
  - **核心定义与原理**：该技术到底是什么？底层机制是如何运转的？
  - **最佳实践**：工业界是如何使用的？有哪些 Pattern 或 Anti-pattern？
  - **深度推理**：不仅回答 "What"，更要回答 "Why" 和 "How"。例如，为什么设计成这样？有什么 Trade-off？
  - **最新进展**：最近有什么突破或新的研究成果？

## 3. 内容编排 (Structuring)
在正式写作前，构建逻辑严密的文章结构。
- **原则**：循序渐进，深入浅出。拒绝简单的列表堆叠。
- **推荐结构**：
  1. **引言**：背景、痛点、为何重要。
  2. **核心概念解构**：通过比喻或底层逻辑拆解概念。
  3. **技术深度解析**：(干货部分) 结合调研内容，展示推理过程和深度见解。
  4. **实战/应用**：代码示例、架构图描述或真实案例。
  5. **总结与展望**。
  6. **参考资料 (References)**：必须附上调研时获取的真实 URL 链接。

## 4. 元数据要求 (Metadata Requirements)
在文章的最顶部添加 YAML Frontmatter，包含以下字段：
- `title`: 文章标题。
- `summary`: 文章核心摘要（100-200字）。
- `createdAt`: 创建日期（格式：YYYY-MM-DD）。
- `updatedAt`: 更新日期（格式：YYYY-MM-DD）。

## 5. 写作执行 (Writing Guidelines)
- **拒绝 "AI 味"**：
  - 避免机械的 "首先、其次、最后" 排比。
  - 避免空洞的套话。
  - 使用更像资深工程师或技术专家的自然口吻。
- **排版要求**：
  - 合理使用 Markdown 标题（H1, H2, H3）。
  - 关键代码块需注明语言。
  - 重点内容适当加粗，但不要滥用。
- **保存文件**：
  - 根据话题生成英文连字符文件名，例如 `articles/deep-dive-system-messages.md`。

## 6. 执行步骤
1.  **询问/确认话题**：明确用户想要解读的具体技术点（如：Prompt Engineering, RAG, System Messages 等）。
2.  **执行联网搜索**：使用 `search_web` 收集素材。
3.  **撰写并保存**：根据上述 Guidelines 撰写并写入文件。
4.  **最终回顾**：检查是否包含引用，语言是否自然。