/**
 * 主入口文件
 * 展示所有示例的菜单
 */

import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('=== Prompt Engineering: 结构化与确定性 ===\n')
  console.log('本课程包含以下示例:\n')
  console.log('1. 普通模式调用 (01-normal-mode.ts)')
  console.log('   - 基本的 LLM 调用方式')
  console.log('   - 不使用 JSON mode 和 Stream mode\n')

  console.log('2. JSON Mode 调用 (02-json-mode.ts)')
  console.log('   - 强制输出 JSON 格式')
  console.log('   - 适合需要结构化数据的场景\n')

  console.log('3. Stream Mode 调用 (03-stream-mode.ts)')
  console.log('   - 流式输出，实时反馈')
  console.log('   - 提升用户体验\n')

  console.log('4. JSON + Stream Mode 调用 (04-json-stream-mode.ts)')
  console.log('   - 结合 JSON mode 和 Stream mode')
  console.log('   - 流式输出结构化数据\n')

  console.log('5. Markdown 格式提示词 (05-markdown-prompt.ts)')
  console.log('   - 展示 Markdown 在提示词中的优势')
  console.log('   - 结构清晰，易于阅读\n')

  console.log('6. XML 标签格式提示词 (06-xml-prompt.ts)')
  console.log('   - 展示 XML 在提示词中的优势')
  console.log('   - 边界清晰，易于解析\n')

  console.log('7. 控制 JSON 输出内容 (07-json-output-control.ts)')
  console.log('   - 通过提示词精确控制 JSON 格式')
  console.log('   - 使用 Schema、示例、约束等方法\n')

  console.log('---')
  console.log('运行示例:')
  console.log('npm run example:normal      - 运行示例 1')
  console.log('npm run example:json       - 运行示例 2')
  console.log('npm run example:stream     - 运行示例 3')
  console.log('npm run example:json-stream - 运行示例 4')
  console.log('npm run example:markdown   - 运行示例 5')
  console.log('npm run example:xml        - 运行示例 6')
  console.log('npm run example:json-control - 运行示例 7')
  console.log('\n或者直接使用 ts-node:')
  console.log('ts-node src/examples/01-normal-mode.ts')
}

main().catch(console.error)
