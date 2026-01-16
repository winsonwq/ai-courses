/**
 * 示例 3: Stream Mode 调用
 * 使用 Stream mode 实现流式输出，可以实时看到 AI 的回复
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

  console.log('=== 示例 3: Stream Mode 调用 ===\n')
  console.log('特点:')
  console.log('- 不使用 JSON mode')
  console.log('- 使用 Stream mode (stream: true)')
  console.log('- 实时流式输出内容\n')

  console.log('AI 回复 (流式输出):\n')

  let fullContent = ''
  let totalTokens = 0

  for await (const chunk of client.callStream({
    messages: [
      {
        role: 'user',
        content: '请写一首关于春天的短诗，大约 4 行。',
      },
    ],
    temperature: 0.8,
  })) {
    const delta = chunk.choices[0]?.delta
    if (delta?.content) {
      process.stdout.write(delta.content)
      fullContent += delta.content
    }

    if (chunk.usage) {
      totalTokens = chunk.usage.total_tokens
    }
  }

  console.log('\n\n---')
  console.log('完整内容长度:', fullContent.length, '字符')
  if (totalTokens > 0) {
    console.log('Total tokens:', totalTokens)
  }
  console.log('\n💡 流式输出的优势:')
  console.log('- 用户可以实时看到回复，提升体验')
  console.log('- 对于长文本，不需要等待完整生成')
  console.log('- 可以提前中断，节省 token')
}

main().catch(console.error)
