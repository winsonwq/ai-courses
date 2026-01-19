/**
 * 协议分析器示例
 * 演示如何解析和理解 MCP 协议消息
 */

/**
 * 模拟的通信日志（来自课程作业）
 */
const PROTOCOL_LOG = [
  {
    line: 1,
    direction: 'Client → Server',
    message: {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { roots: { listChanged: true } },
        clientInfo: { name: 'MyMCPClient', version: '1.0' },
      },
      id: 0,
    },
  },
  {
    line: 2,
    direction: 'Server → Client',
    message: {
      jsonrpc: '2.0',
      id: 0,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: true } },
        serverInfo: { name: 'WeatherServer', version: '0.1' },
      },
    },
  },
  {
    line: 3,
    direction: 'Client → Server',
    message: {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    },
  },
  {
    line: 4,
    direction: 'Client → Server',
    message: {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1,
    },
  },
  {
    line: 5,
    direction: 'Server → Client',
    message: {
      jsonrpc: '2.0',
      id: 1,
      result: {
        tools: [
          {
            name: 'get_temperature',
            description: 'Get current temperature',
            inputSchema: {
              type: 'object',
              properties: { city: { type: 'string' } },
            },
          },
        ],
      },
    },
  },
]

/**
 * 分析协议日志
 */
function analyzeProtocol(): void {
  console.log('='.repeat(60))
  console.log('📋 MCP 协议分析器')
  console.log('='.repeat(60))
  console.log()

  // 打印所有消息
  console.log('📨 原始通信日志：\n')
  for (const entry of PROTOCOL_LOG) {
    console.log(`[Line ${entry.line}] ${entry.direction}`)
    console.log(JSON.stringify(entry.message, null, 2))
    console.log()
  }

  // 回答问题 1：握手分析
  console.log('='.repeat(60))
  console.log('❓ 问题 1：握手分析')
  console.log('='.repeat(60))
  console.log('哪几行代码构成了完整的握手过程？\n')
  console.log('✅ 答案：')
  console.log('   握手过程由 Line 1, 2, 3 构成：')
  console.log('   - Line 1: Client 发送 initialize 请求')
  console.log('   - Line 2: Server 响应 initialize 结果')
  console.log('   - Line 3: Client 发送 initialized 通知（确认握手完成）')
  console.log()

  // 回答问题 2：能力识别
  console.log('='.repeat(60))
  console.log('❓ 问题 2：能力识别')
  console.log('='.repeat(60))
  console.log('根据 Line 2，这个 Server 支持哪些核心原语（Primitives）？')
  console.log('它支持 Resources 吗？\n')
  console.log('✅ 答案：')
  const line2Result = PROTOCOL_LOG[1].message.result as {
    capabilities: { tools?: unknown; resources?: unknown; prompts?: unknown }
  }
  const capabilities = Object.keys(line2Result.capabilities)
  console.log(`   Server 支持的核心原语：${capabilities.join(', ')}`)
  console.log(`   是否支持 Resources：${line2Result.capabilities.resources ? '是' : '否'}`)
  console.log('   （因为 capabilities 中只包含 tools，没有 resources 或 prompts）')
  console.log()

  // 回答问题 3：流程理解
  console.log('='.repeat(60))
  console.log('❓ 问题 3：流程理解')
  console.log('='.repeat(60))
  console.log('在 Line 5 之后，如果 LLM 想要查询北京的天气，')
  console.log('Client 接下来应该发送什么样的 JSON 包？\n')
  console.log('✅ 答案：')
  const nextRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'get_temperature',
      arguments: { city: 'Beijing' },
    },
    id: 2,
  }
  console.log('   Client 应该发送 tools/call 请求：')
  console.log(JSON.stringify(nextRequest, null, 2))
  console.log()

  // 总结
  console.log('='.repeat(60))
  console.log('📊 协议流程总结')
  console.log('='.repeat(60))
  console.log('1. 握手阶段（Handshake）:')
  console.log('   - Client → Server: initialize')
  console.log('   - Server → Client: initialize result')
  console.log('   - Client → Server: notifications/initialized')
  console.log()
  console.log('2. 发现阶段（Discovery）:')
  console.log('   - Client → Server: tools/list')
  console.log('   - Server → Client: tools list result')
  console.log()
  console.log('3. 执行阶段（Execution）:')
  console.log('   - Client → Server: tools/call')
  console.log('   - Server → Client: tool call result')
  console.log()
}

/**
 * 主函数
 */
function main(): void {
  analyzeProtocol()
}

main()
