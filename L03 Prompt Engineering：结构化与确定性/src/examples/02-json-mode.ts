/**
 * 示例 2: JSON Mode 调用
 * 使用 JSON mode 强制 LLM 输出 JSON 格式的内容
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

  console.log('=== 示例 2: JSON Mode 调用 ===\n')
  console.log('特点:')
  console.log('- 使用 JSON mode (response_format: { type: "json_object" })')
  console.log('- 不使用 Stream mode')
  console.log('- 强制输出 JSON 格式\n')
  console.log('💡 说明:')
  console.log('   client.callJSON() 方法内部会自动设置 response_format: { type: "json_object" }')
  console.log('   这等价于手动调用 client.call() 并设置 response_format 参数\n')
  console.log('   等价代码:')
  console.log('   const response = await client.call({')
  console.log('     messages: [...],')
  console.log('     response_format: { type: "json_object" }  // 👈 关键参数')
  console.log('   })\n')

  // callJSON() 方法内部会设置 response_format: { type: "json_object" }
  // 查看 common/src/llm-client.ts 中的 callJSON() 方法实现
  const response = await client.callJSON({
    messages: [
      {
        role: 'system',
        content:
          '你是一个数据提取助手。请将用户提供的信息提取为 JSON 格式。',
      },
      {
        role: 'user',
        content: `请提取以下文本中的关键信息，并以 JSON 格式返回：
        
文本：张三，25岁，软件工程师，在北京工作，喜欢编程和阅读。他的邮箱是 zhangsan@example.com。

请提取姓名、年龄、职业、城市、爱好和邮箱信息。`,
      },
    ],
    temperature: 0.3,
  })

  console.log('AI 回复 (JSON 格式):')
  const content = response.choices[0].message.content
  console.log(content)

  // 尝试解析 JSON
  try {
    const jsonData = JSON.parse(content)
    console.log('\n解析后的 JSON 对象:')
    console.log(JSON.stringify(jsonData, null, 2))
  } catch (e) {
    console.log('\n⚠️ 注意: 虽然使用了 JSON mode，但输出可能不是有效的 JSON')
  }

  console.log('\n---')
  console.log('Token 使用情况:')
  if (response.usage) {
    console.log(`- Prompt tokens: ${response.usage.prompt_tokens}`)
    console.log(`- Completion tokens: ${response.usage.completion_tokens}`)
    console.log(`- Total tokens: ${response.usage.total_tokens}`)
  }
}

main().catch(console.error)
