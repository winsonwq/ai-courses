/**
 * 示例 1: 普通模式调用
 * 这是最基本的 LLM 调用方式，不使用 JSON mode 和 Stream mode
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

  console.log('=== 示例 1: 普通模式调用 ===\n')
  console.log('特点:')
  console.log('- 不使用 JSON mode')
  console.log('- 不使用 Stream mode')
  console.log('- 返回完整的响应内容\n')

  const response = await client.call({
    messages: [
      {
        role: 'user',
        content: '请介绍一下人工智能的发展历史，用简洁的语言概括。',
      },
    ],
    temperature: 0.7,
  })

  console.log('AI 回复:')
  console.log(response.choices[0].message.content)
  console.log('\n---')
  console.log('Token 使用情况:')
  if (response.usage) {
    console.log(`- Prompt tokens: ${response.usage.prompt_tokens}`)
    console.log(`- Completion tokens: ${response.usage.completion_tokens}`)
    console.log(`- Total tokens: ${response.usage.total_tokens}`)
  }
}

main().catch(console.error)
