/**
 * 示例 2b: JSON Mode 调用（手动设置 response_format）
 * 直接展示如何在请求中手动设置 response_format 参数
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

  console.log('=== 示例 2b: JSON Mode 调用（手动设置 response_format）===\n')
  console.log('特点:')
  console.log('- 使用 client.call() 方法')
  console.log('- 手动设置 response_format: { type: "json_object" }')
  console.log('- 不使用 Stream mode')
  console.log('- 强制输出 JSON 格式\n')

  // 方法 1: 使用 callJSON() 方法（推荐，更简洁）
  console.log('【方法 1】使用 callJSON() 方法（推荐）')
  console.log('-'.repeat(80))
  console.log('代码:')
  console.log('  const response = await client.callJSON({ messages: [...] })')
  console.log('  // callJSON() 内部会自动设置 response_format: { type: "json_object" }')
  console.log('')

  const response1 = await client.callJSON({
    messages: [
      {
        role: 'system',
        content: '你是一个数据提取助手。',
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

  console.log('AI 回复:')
  const content1 = response1.choices[0].message.content
  console.log(content1)

  try {
    const json1 = JSON.parse(content1)
    console.log('\n✅ JSON 解析成功:')
    console.log(JSON.stringify(json1, null, 2))
  } catch (e) {
    console.log('\n❌ JSON 解析失败')
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 方法 2: 使用 call() 方法并手动设置 response_format 参数
  console.log('【方法 2】使用 call() 方法并手动设置 response_format 参数')
  console.log('-'.repeat(80))
  console.log('代码:')
  console.log('  const response = await client.call({')
  console.log('    messages: [...],')
  console.log('    response_format: { type: "json_object" }  // 👈 关键：手动设置此参数')
  console.log('  })')
  console.log('')

  // call() 方法支持 response_format 参数（LLMRequest 接口中包含此字段）
  const response2 = await client.call({
    messages: [
      {
        role: 'system',
        content: '你是一个数据提取助手。请将用户提供的信息提取为 JSON 格式。',
      },
      {
        role: 'user',
        content: `请提取以下文本中的关键信息，并以 JSON 格式返回：
        
文本：李四，30岁，产品经理，在上海工作，喜欢旅游和摄影。他的邮箱是 lisi@example.com。

请提取姓名、年龄、职业、城市、爱好和邮箱信息。`,
      },
    ],
    temperature: 0.3,
    response_format: {
      type: 'json_object', // 👈 关键参数：强制输出 JSON 格式
    },
  })

  const content2 = response2.choices[0].message.content

  console.log('AI 回复:')
  console.log(content2)

  try {
    const json2 = JSON.parse(content2)
    console.log('\n✅ JSON 解析成功:')
    console.log(JSON.stringify(json2, null, 2))
  } catch (e) {
    console.log('\n❌ JSON 解析失败')
  }

  console.log('\n' + '='.repeat(80) + '\n')
  console.log('📝 总结:')
  console.log('1. callJSON() 方法：封装好的方法，内部自动设置 response_format')
  console.log('2. 手动设置：直接构造请求，在 body 中添加 response_format 参数')
  console.log('3. 两种方法效果相同，都会强制 LLM 输出有效的 JSON 格式')
  console.log('4. 推荐使用 callJSON() 方法，代码更简洁')
}

main().catch(console.error)
