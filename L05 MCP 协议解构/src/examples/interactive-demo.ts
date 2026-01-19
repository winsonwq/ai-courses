/**
 * 交互式演示
 * 允许用户输入城市名称查询天气
 */

import * as readline from 'readline'
import { StdioClient } from '../client/stdio-client.js'

/**
 * 创建 readline 接口
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

/**
 * 询问用户输入
 */
function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('='.repeat(60))
  console.log('🌤️  MCP 交互式天气查询演示')
  console.log('='.repeat(60))
  console.log()

  const client = new StdioClient()
  const rl = createReadlineInterface()

  try {
    // 连接 Server
    console.log('📡 正在连接 Server...')
    await client.connect('tsx', ['src/server/index.ts'])

    // 握手
    console.log('🤝 正在握手...')
    const initResult = await client.initialize('InteractiveDemo', '1.0.0')
    await client.sendInitialized()
    console.log(`✅ 已连接到 ${initResult.serverInfo.name}\n`)

    // 获取工具列表
    const toolsResult = await client.listTools()
    console.log(`📋 可用工具: ${toolsResult.tools.map((t) => t.name).join(', ')}\n`)

    // 交互循环
    console.log('💡 提示：输入城市名称查询天气，输入 "exit" 退出\n')

    while (true) {
      const city = await question(rl, '请输入城市名称: ')

      if (city.toLowerCase() === 'exit' || city.toLowerCase() === 'quit') {
        break
      }

      if (!city.trim()) {
        console.log('⚠️  请输入有效的城市名称\n')
        continue
      }

      try {
        console.log(`\n🔍 正在查询 ${city} 的天气...`)
        const result = await client.callTool('get_temperature', { city: city.trim() })

        if (result && typeof result === 'object' && 'content' in result) {
          const callResult = result as { content: Array<{ type: string; text: string }>; isError?: boolean }
          if (callResult.isError) {
            console.log(`❌ ${callResult.content[0].text}\n`)
          } else {
            console.log(`✅ ${callResult.content[0].text}\n`)
          }
        }
      } catch (error) {
        console.error(`❌ 错误: ${error instanceof Error ? error.message : String(error)}\n`)
      }
    }

    console.log('\n👋 再见！')
  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    client.disconnect()
    rl.close()
  }
}

main().catch((error) => {
  console.error('❌ 未处理的错误:', error)
  process.exit(1)
})
