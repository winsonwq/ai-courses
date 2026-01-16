/**
 * 示例 9: response_format 与提示词的关系
 * 演示：如果设置了 response_format: { type: "json_object" } 但提示词中不说明 JSON，会发生什么？
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
  console.log('示例 9: response_format 与提示词的关系')
  console.log('='.repeat(80))
  console.log('\n问题：如果设置了 response_format: { type: "json_object" }')
  console.log('      但提示词中不说明 JSON，结果会怎样？\n')
  console.log('='.repeat(80) + '\n')

  // 测试 1: 设置了 response_format，但提示词中完全不提 JSON
  console.log('【测试 1】设置了 response_format，但提示词中完全不提 JSON')
  console.log('-'.repeat(80))
  console.log('提示词内容：')
  console.log('  "请提取以下文本中的关键信息：张三，25岁，软件工程师"')
  console.log('  （注意：提示词中没有提到 JSON）\n')

  try {
    const response1 = await client.call({
      messages: [
        {
          role: 'system',
          content: '你是一个数据提取助手。',
        },
        {
          role: 'user',
          content: '请提取以下文本中的关键信息：张三，25岁，软件工程师。',
        },
      ],
      temperature: 0.3,
      response_format: {
        type: 'json_object', // 👈 设置了 JSON mode
      },
    })

    const content1 = response1.choices[0].message.content
    console.log('AI 回复:')
    console.log(content1)
    console.log('\n尝试解析 JSON:')
    try {
      const json1 = JSON.parse(content1)
      console.log('✅ JSON 解析成功:')
      console.log(JSON.stringify(json1, null, 2))
      console.log('\n⚠️  注意：虽然解析成功，但可能不是预期的格式')
    } catch (e) {
      console.log('❌ JSON 解析失败:', (e as Error).message)
      console.log('⚠️  这就是问题所在：模型可能输出非 JSON 格式的内容')
    }
  } catch (error: any) {
    console.log('❌ API 请求失败:')
    if (error.message?.includes('json')) {
      console.log('   错误信息:', error.message)
      console.log('\n💡 这是预期的行为！')
      console.log('   大多数 API（如 OpenAI、DeepSeek）会要求提示词中必须包含 "json" 字样')
      console.log('   这是为了防止模型在"不知道要输出 JSON"的情况下陷入混乱')
    } else {
      console.log('   错误:', error.message)
    }
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 测试 2: 提示词中明确要求 JSON，但不设置 response_format
  console.log('【测试 2】提示词中明确要求 JSON，但不设置 response_format')
  console.log('-'.repeat(80))
  console.log('提示词内容：')
  console.log('  "请提取以下文本中的关键信息，并以 JSON 格式返回：张三，25岁，软件工程师"')
  console.log('  （注意：提示词中明确提到 JSON，但没有设置 response_format）\n')

  try {
    const response2 = await client.call({
      messages: [
        {
          role: 'system',
          content: '你是一个数据提取助手。请将结果以 JSON 格式返回。',
        },
        {
          role: 'user',
          content: '请提取以下文本中的关键信息，并以 JSON 格式返回：张三，25岁，软件工程师。',
        },
      ],
      temperature: 0.3,
      // 注意：这里没有设置 response_format
    })

    const content2 = response2.choices[0].message.content
    console.log('AI 回复:')
    console.log(content2)
    console.log('\n尝试解析 JSON:')
    try {
      const json2 = JSON.parse(content2)
      console.log('✅ JSON 解析成功:')
      console.log(JSON.stringify(json2, null, 2))
      console.log('\n⚠️  注意：虽然解析成功，但输出可能包含额外的文字说明')
      console.log('   例如："这是 JSON 结果：{...}" 或 Markdown 代码块格式')
    } catch (e) {
      console.log('❌ JSON 解析失败:', (e as Error).message)
      console.log('⚠️  输出可能包含非 JSON 格式的内容')
    }
  } catch (error: any) {
    console.log('❌ API 请求失败:', error.message)
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // 测试 3: 最佳实践 - 提示词 + response_format 双重设置
  console.log('【测试 3】最佳实践：提示词 + response_format 双重设置')
  console.log('-'.repeat(80))
  console.log('提示词内容：')
  console.log('  System: "你是一个数据提取助手。请始终以 JSON 格式返回结果。"')
  console.log('  User: "请提取以下文本中的关键信息，并以 JSON 格式返回：..."')
  console.log('  API: response_format: { type: "json_object" }')
  console.log('  （提示词明确要求 JSON + API 参数强制 JSON）\n')

  try {
    const response3 = await client.callJSON({
      messages: [
        {
          role: 'system',
          content: '你是一个数据提取助手。请始终以 JSON 格式返回结果。',
        },
        {
          role: 'user',
          content: '请提取以下文本中的关键信息，并以 JSON 格式返回：张三，25岁，软件工程师，在北京工作。',
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
      console.log('\n✅ 这是最佳实践：')
      console.log('   - 提示词让模型"知道"要输出 JSON（大脑意识）')
      console.log('   - response_format 确保输出"必须是" JSON（物理护栏）')
      console.log('   - 两者结合，100% 可靠')
    } catch (e) {
      console.log('❌ JSON 解析失败:', (e as Error).message)
    }
  } catch (error: any) {
    console.log('❌ API 请求失败:', error.message)
  }

  console.log('\n' + '='.repeat(80) + '\n')
  console.log('📊 总结对比：')
  console.log('\n1. 【仅设置 response_format，提示词不提 JSON】')
  console.log('   ❌ 可能的结果：')
  console.log('      - API 直接报错（最常见）：要求提示词中必须包含 "json" 字样')
  console.log('      - 模型陷入死循环或乱码（如果 API 没有预校验）')
  console.log('      - 输出格式混乱，难以解析')
  console.log('   💡 原因：')
  console.log('      - 模型"意识"不知道要输出 JSON，但"约束"强制要求 JSON')
  console.log('      - 这种冲突导致模型行为异常')

  console.log('\n2. 【仅提示词要求 JSON，不设置 response_format】')
  console.log('   ⚠️  可能的结果：')
  console.log('      - 输出可能是有效的 JSON，但可能包含额外文字')
  console.log('      - 输出可能是 Markdown 代码块格式的 JSON')
  console.log('      - 格式不一致，需要手动清理')
  console.log('   💡 原因：')
  console.log('      - 模型"知道"要输出 JSON，但没有"强制约束"')
  console.log('      - 模型可能会添加解释性文字或使用其他格式')

  console.log('\n3. 【提示词 + response_format 双重设置】（推荐）')
  console.log('   ✅ 最佳实践：')
  console.log('      - 提示词让模型"知道"要输出 JSON（大脑意识）')
  console.log('      - response_format 确保输出"必须是" JSON（物理护栏）')
  console.log('      - 两者结合，100% 可靠，格式一致')
  console.log('   💡 类比：')
  console.log('      - 提示词 = 告诉司机"去北京"（明确目标）')
  console.log('      - response_format = GPS 导航系统（确保路线正确）')

  console.log('\n4. 【为什么必须在提示词里也写 JSON？】')
  console.log('   这是"软件约束"与"大脑意识"的同步：')
  console.log('   - 提示词（大脑）：让模型明白目标是生成数据，而不是聊天')
  console.log('   - Response Format（护栏）：确保即使模型偶尔"分心"，输出也符合 JSON 规范')
  console.log('   - 两者缺一不可，才能保证稳定可靠的输出')

  console.log('\n5. 【特例：OpenAI 的 json_schema】')
  console.log('   只有在 OpenAI 的最新模型中使用 type: "json_schema" 时，')
  console.log('   才可以在提示词里完全不提 JSON。')
  console.log('   因为 Schema 已经成为了指令的一部分，系统会自动告诉模型格式要求。')

  console.log('\n' + '='.repeat(80))
}

main().catch(console.error)
