/**
 * 示例 8: JSON Mode 参数 vs 提示词要求 JSON 的对比
 * 展示 response_format: { type: "json_object" } 和提示词要求 JSON 的区别
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

  const testPrompt = `请分析以下产品评论，返回 JSON 格式的分析结果：

评论内容：这个手机拍照效果很棒，但是电池续航一般，而且价格有点贵。

请返回包含以下字段的 JSON：
- sentiment: 情感倾向（positive/negative/neutral）
- rating: 评分（1-5）
- keywords: 关键词数组
- summary: 摘要`

  console.log('='.repeat(80))
  console.log('对比测试：JSON Mode 参数 vs 提示词要求 JSON')
  console.log('='.repeat(80))
  console.log('\n测试提示词：')
  console.log(testPrompt)
  console.log('\n' + '='.repeat(80) + '\n')

  // 方法 1: 仅使用提示词要求 JSON（不使用 response_format 参数）
  console.log('【方法 1】仅使用提示词要求 JSON（不使用 response_format 参数）')
  console.log('-'.repeat(80))
  
  try {
    const response1 = await client.call({
      messages: [
        {
          role: 'system',
          content: '你是一个数据分析助手，请严格按照 JSON 格式返回结果。',
        },
        {
          role: 'user',
          content: testPrompt,
        },
      ],
      temperature: 0.3,
    })

    const content1 = response1.choices[0].message.content
    console.log('AI 回复:')
    console.log(content1)
    console.log('\n尝试解析 JSON:')
    try {
      const json1 = JSON.parse(content1)
      console.log('✅ JSON 解析成功:')
      console.log(JSON.stringify(json1, null, 2))
    } catch (e) {
      console.log('❌ JSON 解析失败:', (e as Error).message)
      console.log('⚠️  注意：虽然提示词要求 JSON，但输出可能不是有效的 JSON 格式')
    }
  } catch (error) {
    console.error('错误:', error)
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 方法 2: 使用 response_format: { type: "json_object" }
  console.log('【方法 2】使用 response_format: { type: "json_object" }')
  console.log('-'.repeat(80))
  
  try {
    const response2 = await client.callJSON({
      messages: [
        {
          role: 'system',
          content: '你是一个数据分析助手，请严格按照 JSON 格式返回结果。',
        },
        {
          role: 'user',
          content: testPrompt,
        },
      ],
      temperature: 0.3,
    })

    const content2 = response2.choices[0].message.content
    console.log('AI 回复:')
    console.log(content2)
    console.log('\n尝试解析 JSON:')
    try {
      const json2 = JSON.parse(content2)
      console.log('✅ JSON 解析成功:')
      console.log(JSON.stringify(json2, null, 2))
    } catch (e) {
      console.log('❌ JSON 解析失败:', (e as Error).message)
    }
  } catch (error) {
    console.error('错误:', error)
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 方法 3: 仅使用提示词，但提示词中没有明确要求 JSON
  console.log('【方法 3】仅使用提示词，但提示词中没有明确要求 JSON')
  console.log('-'.repeat(80))
  
  try {
    const response3 = await client.call({
      messages: [
        {
          role: 'user',
          content: `请分析以下产品评论：

评论内容：这个手机拍照效果很棒，但是电池续航一般，而且价格有点贵。

请告诉我情感倾向、评分、关键词和摘要。`,
        },
      ],
      temperature: 0.3,
    })

    const content3 = response3.choices[0].message.content
    console.log('AI 回复:')
    console.log(content3)
    console.log('\n尝试解析 JSON:')
    try {
      const json3 = JSON.parse(content3)
      console.log('✅ JSON 解析成功:')
      console.log(JSON.stringify(json3, null, 2))
    } catch (e) {
      console.log('❌ JSON 解析失败（这是预期的，因为提示词没有要求 JSON）')
    }
  } catch (error) {
    console.error('错误:', error)
  }

  console.log('\n' + '='.repeat(80) + '\n')
  console.log('📊 总结对比：')
  console.log('\n1. 【仅提示词要求 JSON】')
  console.log('   ✅ 优点：')
  console.log('      - 灵活，LLM 可以添加解释性文字')
  console.log('      - 可以返回 Markdown 代码块格式的 JSON')
  console.log('   ❌ 缺点：')
  console.log('      - 不保证输出是有效的 JSON')
  console.log('      - 可能包含额外的文字说明')
  console.log('      - 需要手动解析和验证')
  console.log('      - 输出格式可能不一致')

  console.log('\n2. 【response_format: { type: "json_object" }】')
  console.log('   ✅ 优点：')
  console.log('      - 强制输出有效的 JSON 格式')
  console.log('      - 保证输出可以直接解析')
  console.log('      - 格式一致，可靠性高')
  console.log('      - 适合需要结构化数据的生产环境')
  console.log('   ❌ 缺点：')
  console.log('      - 输出必须是纯 JSON，不能有额外文字')
  console.log('      - 某些模型可能对 JSON Schema 的支持有限')

  console.log('\n3. 【最佳实践】')
  console.log('   - 生产环境：使用 response_format + 提示词中的 JSON Schema')
  console.log('   - 开发调试：可以先用提示词测试，再用 response_format 确保格式')
  console.log('   - 复杂场景：结合使用，在提示词中明确 JSON Schema，用参数强制格式')

  console.log('\n' + '='.repeat(80))
}

main().catch(console.error)
