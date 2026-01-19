/**
 * 示例 10: XML 标签隔离与 Few-shot (少样本) 演示
 * 展示如何使用 XML 标签隔离不同部分，以及 Few-shot 学习的效果
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

  console.log('='.repeat(80))
  console.log('示例 10: XML 标签隔离与 Few-shot (少样本) 演示')
  console.log('='.repeat(80))
  console.log('\n本示例展示：')
  console.log('1. XML 标签如何隔离不同的指令部分')
  console.log('2. Few-shot 学习如何通过示例提升输出质量')
  console.log('3. 标签隔离 + Few-shot 的组合优势\n')
  console.log('='.repeat(80) + '\n')

  // 测试 1: 不使用 XML 标签隔离，不使用 Few-shot
  console.log('【测试 1】不使用 XML 标签隔离，不使用 Few-shot')
  console.log('-'.repeat(80))
  console.log('提示词特点：')
  console.log('- 所有指令混在一起')
  console.log('- 没有示例')
  console.log('- 依赖模型的理解能力\n')

  const prompt1 = `你是一个情感分析助手。请分析以下评论的情感倾向，返回 positive、negative 或 neutral。

评论：这个产品质量很好，价格也合理，推荐购买。`

  console.log('提示词:')
  console.log(prompt1)
  console.log('\n')

  try {
    const response1 = await client.call({
      messages: [
        {
          role: 'user',
          content: prompt1,
        },
      ],
      temperature: 0.3,
    })

    console.log('AI 回复:')
    console.log(response1.choices[0].message.content)
    console.log('\n⚠️  问题：')
    console.log('- 输出格式可能不一致')
    console.log('- 可能包含额外解释')
    console.log('- 需要手动解析')
  } catch (error: any) {
    console.error('错误:', error.message)
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 测试 2: 使用 XML 标签隔离，但不使用 Few-shot
  console.log('【测试 2】使用 XML 标签隔离，但不使用 Few-shot')
  console.log('-'.repeat(80))
  console.log('提示词特点：')
  console.log('- 使用 XML 标签隔离不同部分')
  console.log('- 结构清晰，易于理解')
  console.log('- 但没有示例\n')

  const prompt2 = `<task>
你是一个情感分析助手。
</task>

<instructions>
请分析以下评论的情感倾向，返回 positive、negative 或 neutral。
只返回情感倾向，不要添加任何其他文字。
</instructions>

<output_format>
返回格式：仅返回一个单词，必须是 positive、negative 或 neutral 之一。
</output_format>

<user_input>
评论：这个产品质量很好，价格也合理，推荐购买。
</user_input>`

  console.log('提示词:')
  console.log(prompt2)
  console.log('\n')

  try {
    const response2 = await client.call({
      messages: [
        {
          role: 'user',
          content: prompt2,
        },
      ],
      temperature: 0.3,
    })

    console.log('AI 回复:')
    console.log(response2.choices[0].message.content)
    console.log('\n✅ 改进：')
    console.log('- 结构更清晰')
    console.log('- 输出格式更一致')
    console.log('- 但仍可能包含额外文字')
  } catch (error: any) {
    console.error('错误:', error.message)
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 测试 3: 使用 XML 标签隔离 + Few-shot 学习
  console.log('【测试 3】使用 XML 标签隔离 + Few-shot 学习（推荐）')
  console.log('-'.repeat(80))
  console.log('提示词特点：')
  console.log('- 使用 XML 标签隔离不同部分')
  console.log('- 提供多个示例（Few-shot）')
  console.log('- 结构清晰 + 示例引导\n')

  const prompt3 = `<task>
你是一个情感分析助手。
</task>

<instructions>
请分析以下评论的情感倾向，返回 positive、negative 或 neutral。
只返回情感倾向，不要添加任何其他文字。
</instructions>

<output_format>
返回格式：仅返回一个单词，必须是 positive、negative 或 neutral 之一。
</output_format>

<examples>
<example>
<input>这个产品质量很好，价格也合理，推荐购买。</input>
<output>positive</output>
</example>

<example>
<input>服务态度很差，等了很久也没人理我。</input>
<output>negative</output>
</example>

<example>
<input>产品还可以，没什么特别的感觉。</input>
<output>neutral</output>
</example>
</examples>

<user_input>
评论：这个手机拍照效果很棒，但是电池续航一般，而且价格有点贵。
</user_input>`

  console.log('提示词:')
  console.log(prompt3)
  console.log('\n')

  try {
    const response3 = await client.call({
      messages: [
        {
          role: 'user',
          content: prompt3,
        },
      ],
      temperature: 0.3,
    })

    console.log('AI 回复:')
    console.log(response3.choices[0].message.content)
    console.log('\n✅ 优势：')
    console.log('- XML 标签清晰隔离各部分')
    console.log('- Few-shot 示例让模型理解期望格式')
    console.log('- 输出格式高度一致')
    console.log('- 准确率更高')
  } catch (error: any) {
    console.error('错误:', error.message)
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 测试 4: 复杂场景 - XML 标签隔离 + 多个 Few-shot 示例
  console.log('【测试 4】复杂场景：XML 标签隔离 + 多个 Few-shot 示例')
  console.log('-'.repeat(80))
  console.log('场景：产品评论的多维度分析\n')

  const prompt4 = `<task>
你是一个产品评论分析助手。
</task>

<instructions>
请分析产品评论，提取以下信息：
1. 情感倾向（positive/negative/neutral）
2. 评分（1-5）
3. 提到的方面（质量、价格、服务等）
4. 一句话摘要
</instructions>

<output_format>
请使用以下 XML 格式输出：
<analysis>
  <sentiment>情感倾向</sentiment>
  <rating>评分</rating>
  <aspects>
    <aspect>方面1</aspect>
    <aspect>方面2</aspect>
  </aspects>
  <summary>摘要</summary>
</analysis>
</output_format>

<examples>
<example>
<input>这个产品质量很好，价格也合理，推荐购买。</input>
<output>
<analysis>
  <sentiment>positive</sentiment>
  <rating>5</rating>
  <aspects>
    <aspect>质量</aspect>
    <aspect>价格</aspect>
  </aspects>
  <summary>产品质量好，价格合理，值得推荐</summary>
</analysis>
</output>
</example>

<example>
<input>服务态度很差，等了很久也没人理我，非常失望。</input>
<output>
<analysis>
  <sentiment>negative</sentiment>
  <rating>1</rating>
  <aspects>
    <aspect>服务</aspect>
  </aspects>
  <summary>服务态度差，等待时间长，体验不佳</summary>
</analysis>
</output>
</example>

<example>
<input>产品还可以，没什么特别的感觉，中规中矩吧。</input>
<output>
<analysis>
  <sentiment>neutral</sentiment>
  <rating>3</rating>
  <aspects>
    <aspect>整体</aspect>
  </aspects>
  <summary>产品表现一般，没有明显优缺点</summary>
</analysis>
</output>
</example>
</examples>

<user_input>
评论：这个手机拍照效果很棒，但是电池续航一般，而且价格有点贵。
</user_input>`

  console.log('提示词（部分）:')
  console.log(prompt4.substring(0, 500) + '...')
  console.log('\n')

  try {
    const response4 = await client.call({
      messages: [
        {
          role: 'user',
          content: prompt4,
        },
      ],
      temperature: 0.2, // 降低温度以获得更确定性的输出
    })

    console.log('AI 回复:')
    console.log(response4.choices[0].message.content)
    console.log('\n✅ 复杂场景的优势：')
    console.log('- XML 标签清晰隔离任务、指令、格式、示例、输入')
    console.log('- 多个 Few-shot 示例覆盖不同情况')
    console.log('- 输出格式高度一致，易于解析')
    console.log('- 准确率和可靠性显著提升')
  } catch (error: any) {
    console.error('错误:', error.message)
  }

  console.log('\n' + '='.repeat(80) + '\n')
  console.log('📊 总结对比：')
  console.log('\n1. 【不使用标签隔离，不使用 Few-shot】')
  console.log('   ❌ 输出格式不一致')
  console.log('   ❌ 可能包含额外解释')
  console.log('   ❌ 需要手动解析和清理')

  console.log('\n2. 【使用 XML 标签隔离，但不使用 Few-shot】')
  console.log('   ✅ 结构清晰，易于理解')
  console.log('   ✅ 输出格式更一致')
  console.log('   ⚠️  但仍可能包含额外文字')
  console.log('   ⚠️  准确率依赖模型理解能力')

  console.log('\n3. 【XML 标签隔离 + Few-shot 学习】（推荐）')
  console.log('   ✅ 结构清晰，易于维护')
  console.log('   ✅ 示例引导，格式高度一致')
  console.log('   ✅ 准确率和可靠性显著提升')
  console.log('   ✅ 易于解析和处理')

  console.log('\n💡 XML 标签隔离的优势：')
  console.log('1. **清晰的结构**：每个部分都有明确的标签，易于理解和维护')
  console.log('2. **易于解析**：可以用 XML 解析器自动提取各部分内容')
  console.log('3. **防止混淆**：标签明确分隔指令、示例、输入，避免模型混淆')
  console.log('4. **可扩展性**：可以轻松添加新的部分（如 <constraints>、<notes> 等）')

  console.log('\n💡 Few-shot 学习的优势：')
  console.log('1. **格式一致性**：通过示例明确展示期望的输出格式')
  console.log('2. **提高准确率**：模型通过示例学习如何处理类似情况')
  console.log('3. **覆盖边界情况**：可以展示不同情况的处理方式')
  console.log('4. **减少错误**：示例越多，模型理解越准确')

  console.log('\n💡 最佳实践：')
  console.log('- 使用 XML 标签隔离不同的指令部分')
  console.log('- 提供 2-5 个 Few-shot 示例，覆盖主要情况')
  console.log('- 示例应该清晰、准确、多样化')
  console.log('- 结合使用 response_format（如 JSON mode）获得更好的格式保证')
  console.log('- 降低 temperature（0.2-0.3）以获得更确定性的输出')

  console.log('\n' + '='.repeat(80))
}

main().catch(console.error)
