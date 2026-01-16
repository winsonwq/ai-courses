/**
 * 示例 5: 使用 Markdown 编写提示词
 * 展示 Markdown 格式在提示词中的优势
 */

// 加载 .env 文件中的环境变量
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../.env') })

import { LLMClient } from '../../../common/src/llm-client'

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY || ''
  if (!apiKey) {
    console.error('错误: 请先设置环境变量 DEEPSEEK_API_KEY')
    process.exit(1)
  }

  const client = new LLMClient({ apiKey })

  console.log('=== 示例 5: Markdown 格式提示词 ===\n')

  // 使用 Markdown 格式的提示词
  const markdownPrompt = `# 任务说明

你是一个专业的文章摘要生成器。

## 输入要求
- 接收一篇长文章
- 提取关键信息
- 生成简洁的摘要

## 输出格式
请按照以下格式输出：

### 标题
[文章的标题]

### 核心观点
1. [观点1]
2. [观点2]
3. [观点3]

### 摘要
[一段简洁的摘要，不超过 100 字]

---

请处理以下文章：

**文章内容：**
人工智能（AI）是计算机科学的一个分支，旨在创建能够执行通常需要人类智能的任务的系统。
机器学习是 AI 的一个子集，它使计算机能够从数据中学习，而无需明确编程。
深度学习是机器学习的一个子集，使用神经网络来模拟人脑的工作方式。
这些技术正在改变我们生活的方方面面，从医疗诊断到自动驾驶汽车。`

  console.log('使用 Markdown 格式的提示词:')
  console.log('---')
  console.log(markdownPrompt)
  console.log('---\n')

  const response = await client.call({
    messages: [
      {
        role: 'user',
        content: markdownPrompt,
      },
    ],
    temperature: 0.7,
  })

  console.log('AI 回复:')
  console.log(response.choices[0].message.content)

  console.log('\n---')
  console.log('💡 Markdown 格式的优势:')
  console.log('1. **结构清晰**: 使用标题、列表等元素，让提示词层次分明')
  console.log('2. **易于阅读**: 人类和 AI 都能更好地理解结构化的内容')
  console.log('3. **格式丰富**: 支持粗体、斜体、代码块、列表等多种格式')
  console.log('4. **兼容性好**: 大多数 LLM 都理解 Markdown 语法')
  console.log('5. **便于维护**: 可以像写文档一样编写提示词')
}

main().catch(console.error)
