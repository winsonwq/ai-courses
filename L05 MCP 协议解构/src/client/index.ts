/**
 * MCP Client 入口
 * 演示如何连接 Server 并执行工具调用
 */

import { StdioClient } from './stdio-client.js'

async function main(): Promise<void> {
  console.log('[Client] 🚀 启动 MCP Client\n')

  const client = new StdioClient()

  try {
    // 1. 连接到 Server（启动子进程）
    console.log('[Client] 📡 连接到 Server...')
    await client.connect('tsx', ['src/server/index.ts'])

    // 2. 发送 initialize 请求
    console.log('\n[Client] 🤝 开始握手...')
    const initResult = await client.initialize('MyMCPClient', '1.0.0')
    console.log(`[Client] ✅ Server 信息: ${initResult.serverInfo.name} v${initResult.serverInfo.version}`)
    console.log(`[Client]    协议版本: ${initResult.protocolVersion}`)
    console.log(`[Client]    支持能力: ${Object.keys(initResult.capabilities).join(', ')}`)

    // 3. 发送 initialized 通知
    await client.sendInitialized()
    console.log('[Client] ✅ 握手完成\n')

    // 4. 获取工具列表
    console.log('[Client] 🔍 查询可用工具...')
    const toolsResult = await client.listTools()
    console.log(`[Client] ✅ 找到 ${toolsResult.tools.length} 个工具:`)
    for (const tool of toolsResult.tools) {
      console.log(`[Client]   - ${tool.name}: ${tool.description}`)
    }

    // 5. 调用工具
    console.log('\n[Client] 🛠️  调用工具: get_temperature')
    const callResult = await client.callTool('get_temperature', { city: 'Beijing' })
    console.log('[Client] ✅ 工具调用结果:')
    if (callResult && typeof callResult === 'object' && 'content' in callResult) {
      const result = callResult as { content: Array<{ type: string; text: string }> }
      for (const item of result.content) {
        console.log(`[Client]   ${item.text}`)
      }
    }

    // 6. 再次调用（不同城市）
    console.log('\n[Client] 🛠️  调用工具: get_temperature (Shanghai)')
    const callResult2 = await client.callTool('get_temperature', { city: 'Shanghai' })
    if (callResult2 && typeof callResult2 === 'object' && 'content' in callResult2) {
      const result = callResult2 as { content: Array<{ type: string; text: string }> }
      for (const item of result.content) {
        console.log(`[Client]   ${item.text}`)
      }
    }

    console.log('\n[Client] ✅ 演示完成')
  } catch (error) {
    console.error('[Client] ❌ 错误:', error)
  } finally {
    // 断开连接
    client.disconnect()
    console.log('[Client] 👋 Client 关闭')
  }
}

main().catch((error) => {
  console.error('❌ 未处理的错误:', error)
  process.exit(1)
})
