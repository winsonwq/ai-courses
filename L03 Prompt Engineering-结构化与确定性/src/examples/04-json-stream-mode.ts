/**
 * 示例 4: JSON Mode + Stream Mode 调用
 * 结合 JSON mode 和 Stream mode，实现流式输出 JSON 内容
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

  console.log('=== 示例 4: JSON Mode + Stream Mode 调用 ===\n')
  console.log('特点:')
  console.log('- 使用 JSON mode (response_format: { type: "json_object" })')
  console.log('- 使用 Stream mode (stream: true)')
  console.log('- 流式输出 JSON 格式内容\n')

  console.log('AI 回复 (流式 JSON 输出):\n')

  let fullContent = ''

  for await (const chunk of client.callJSONStream({
    messages: [
      {
        role: 'system',
        content: '你是一个数据分析助手，请以 JSON 格式返回结果。',
      },
      {
        role: 'user',
        content: `请分析以下销售数据，返回 JSON 格式的分析结果：
        
月份: 1月, 2月, 3月, 4月
销售额: 10000, 15000, 12000, 18000

请返回包含以下字段的 JSON:
- totalSales: 总销售额
- averageSales: 平均销售额
- bestMonth: 最佳月份
- growthRate: 增长率（百分比）`,
      },
    ],
    temperature: 0.3,
  })) {
    const delta = chunk.choices[0]?.delta
    if (delta?.content) {
      process.stdout.write(delta.content)
      fullContent += delta.content
    }
  }

  console.log('\n\n---')
  console.log('尝试解析完整的 JSON:')
  try {
    const jsonData = JSON.parse(fullContent)
    console.log(JSON.stringify(jsonData, null, 2))
  } catch (e) {
    console.log('⚠️ JSON 解析失败:', e)
    console.log('原始内容:', fullContent)
  }

  console.log('\n💡 JSON + Stream 的优势:')
  console.log('- 既保证了输出格式的确定性（JSON）')
  console.log('- 又提供了实时反馈（Stream）')
  console.log('- 适合需要结构化数据且需要快速响应的场景')
}

main().catch(console.error)
