/**
 * 示例 6: 使用 XML 标签编写提示词
 * 展示 XML 格式在提示词中的优势
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

  console.log('=== 示例 6: XML 标签格式提示词 ===\n')

  // 使用 XML 标签格式的提示词
  const xmlPrompt = `<task>
你是一个专业的数据提取助手。
</task>

<instructions>
请从用户提供的文本中提取以下信息：
1. 人物姓名
2. 地点
3. 时间
4. 事件描述
</instructions>

<output_format>
请使用以下 XML 格式输出结果：
<extracted_data>
  <person>姓名</person>
  <location>地点</location>
  <time>时间</time>
  <event>事件描述</event>
</extracted_data>
</output_format>

<example>
输入：张三昨天在北京参加了技术大会。
输出：
<extracted_data>
  <person>张三</person>
  <location>北京</location>
  <time>昨天</time>
  <event>参加技术大会</event>
</extracted_data>
</example>

<user_input>
请提取以下文本中的信息：
李四上周五在上海的咖啡厅与客户会面，讨论了新项目的合作细节。
</user_input>`

  console.log('使用 XML 标签格式的提示词:')
  console.log('---')
  console.log(xmlPrompt)
  console.log('---\n')

  const response = await client.call({
    messages: [
      {
        role: 'user',
        content: xmlPrompt,
      },
    ],
    temperature: 0.3,
  })

  console.log('AI 回复:')
  console.log(response.choices[0].message.content)

  console.log('\n---')
  console.log('💡 XML 标签格式的优势:')
  console.log('1. **边界清晰**: 标签明确标识内容的开始和结束')
  console.log('2. **结构化强**: 嵌套结构可以表达复杂的层次关系')
  console.log('3. **易于解析**: 输出结果可以直接用 XML 解析器处理')
  console.log('4. **语义明确**: 标签名称本身就传达了语义信息')
  console.log('5. **格式稳定**: XML 是标准格式，解析更可靠')
  console.log('6. **适合结构化输出**: 特别适合需要严格结构化的场景')

  console.log('\n📊 Markdown vs XML 对比:')
  console.log('- Markdown: 更适合人类阅读，格式灵活，适合文档类提示词')
  console.log('- XML: 更适合机器解析，结构严格，适合结构化数据提取')
}

main().catch(console.error)
