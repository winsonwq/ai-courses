/**
 * 示例 7: 控制 JSON 输出内容
 * 展示如何通过提示词精确控制 LLM 输出 JSON 的格式和内容
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

  console.log('=== 示例 7: 控制 JSON 输出内容 ===\n')

  // 方法 1: 使用 JSON Schema 描述期望的输出格式
  const promptWithSchema = `请分析以下产品评论，并返回 JSON 格式的分析结果。

## 输出 JSON Schema
\`\`\`json
{
  "sentiment": "positive" | "negative" | "neutral",
  "rating": 1-5 的整数,
  "keywords": ["关键词1", "关键词2", ...],
  "summary": "评论摘要",
  "aspects": {
    "quality": "评价",
    "price": "评价",
    "service": "评价"
  }
}
\`\`\`

## 评论内容
这个产品的质量非常好，价格也合理，但是客服响应速度有点慢。总体来说还是值得购买的。

请严格按照上述 Schema 返回 JSON 结果。`

  console.log('方法 1: 使用 JSON Schema 描述格式')
  console.log('---\n')

  const response1 = await client.callJSON({
    messages: [
      {
        role: 'system',
        content: '你是一个数据分析助手，严格按照用户提供的 JSON Schema 返回结果。',
      },
      {
        role: 'user',
        content: promptWithSchema,
      },
    ],
    temperature: 0.3,
  })

  console.log('AI 回复:')
  const content1 = response1.choices[0].message.content
  console.log(content1)

  try {
    const json1 = JSON.parse(content1)
    console.log('\n解析后的 JSON:')
    console.log(JSON.stringify(json1, null, 2))
  } catch (e) {
    console.log('\n⚠️ JSON 解析失败')
  }

  console.log('\n\n---\n')

  // 方法 2: 使用 XML 标签 + JSON Schema
  const promptWithXML = `<task>
分析产品评论并返回 JSON 格式结果
</task>

<output_schema>
{
  "sentiment": "positive" | "negative" | "neutral",
  "rating": 1-5,
  "topKeywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "一句话摘要"
}
</output_schema>

<requirements>
1. sentiment 必须是 "positive"、"negative" 或 "neutral" 之一
2. rating 必须是 1 到 5 之间的整数
3. topKeywords 必须包含 3 个最重要的关键词
4. summary 必须是一句话，不超过 50 字
</requirements>

<example>
输入：这个产品质量不错，价格合理，推荐购买。
输出：
{
  "sentiment": "positive",
  "rating": 4,
  "topKeywords": ["质量", "价格", "推荐"],
  "summary": "产品质量好，价格合理，值得推荐"
}
</example>

<user_input>
这个手机拍照效果很棒，但是电池续航一般，而且价格有点贵。
</user_input>`

  console.log('方法 2: 使用 XML 标签 + JSON Schema + 示例')
  console.log('---\n')

  const response2 = await client.callJSON({
    messages: [
      {
        role: 'system',
        content: '你是一个严格遵循格式要求的数据分析助手。',
      },
      {
        role: 'user',
        content: promptWithXML,
      },
    ],
    temperature: 0.2, // 降低温度以获得更确定性的输出
  })

  console.log('AI 回复:')
  const content2 = response2.choices[0].message.content
  console.log(content2)

  try {
    const json2 = JSON.parse(content2)
    console.log('\n解析后的 JSON:')
    console.log(JSON.stringify(json2, null, 2))

    // 验证输出是否符合要求
    console.log('\n✅ 输出验证:')
    console.log(`- sentiment 类型: ${typeof json2.sentiment}`)
    console.log(`- rating 类型: ${typeof json2.rating}, 值: ${json2.rating}`)
    console.log(`- topKeywords 数量: ${Array.isArray(json2.topKeywords) ? json2.topKeywords.length : 0}`)
    console.log(`- summary 长度: ${json2.summary?.length || 0} 字符`)
  } catch (e) {
    console.log('\n⚠️ JSON 解析失败:', e)
  }

  console.log('\n---')
  console.log('💡 控制 JSON 输出的关键技巧:')
  console.log('1. **使用 JSON Schema**: 明确描述期望的数据结构')
  console.log('2. **提供示例**: 让 AI 理解期望的输出格式')
  console.log('3. **使用 XML 标签**: 清晰分隔不同的指令部分')
  console.log('4. **降低 temperature**: 提高输出的确定性和一致性')
  console.log('5. **启用 JSON mode**: 使用 response_format: { type: "json_object" }')
  console.log('6. **明确约束**: 在提示词中明确数据类型、取值范围等约束')
  console.log('7. **验证输出**: 在代码中验证输出是否符合预期格式')
}

main().catch(console.error)
