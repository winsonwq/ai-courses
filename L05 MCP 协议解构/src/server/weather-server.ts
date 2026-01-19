/**
 * MCP Weather Server 示例
 * 演示一个简单的天气服务 Server 实现
 */

import type {
  InitializeParams,
  InitializeResult,
  JsonRpcRequest,
  JsonRpcResponse,
  ToolsCallParams,
  ToolsCallResult,
  ToolsListResult,
} from '../types/mcp.js'
import { MCP_PROTOCOL_VERSION, createResponse } from '../types/mcp.js'

/**
 * 模拟天气数据
 */
const WEATHER_DATA: Record<string, { temperature: number; condition: string }> = {
  Beijing: { temperature: 15, condition: '晴' },
  Shanghai: { temperature: 18, condition: '多云' },
  Guangzhou: { temperature: 25, condition: '小雨' },
  Shenzhen: { temperature: 26, condition: '晴' },
  Hangzhou: { temperature: 16, condition: '阴' },
}

/**
 * Weather Server 类
 */
export class WeatherServer {
  private initialized = false

  /**
   * 处理 JSON-RPC 请求
   */
  public handleRequest(request: JsonRpcRequest): JsonRpcResponse | null {
    // 记录请求日志
    this.logRequest(request)

    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request)
        case 'tools/list':
          return this.handleToolsList(request)
        case 'tools/call':
          return this.handleToolsCall(request)
        default:
          return createResponse(
            request.id,
            undefined,
            {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          )
      }
    } catch (error) {
      return createResponse(
        request.id,
        undefined,
        {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error),
        },
      )
    }
  }

  /**
   * 处理通知（无响应）
   */
  public handleNotification(request: { method: string; params?: unknown }): void {
    if (request.method === 'notifications/initialized') {
      this.initialized = true
      console.error('[Server] ✅ 握手完成，Server 已初始化')
    }
  }

  /**
   * 处理 initialize 请求
   */
  private handleInitialize(request: JsonRpcRequest): JsonRpcResponse {
    const params = request.params as InitializeParams

    const result: InitializeResult = {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        tools: {
          listChanged: true,
        },
      },
      serverInfo: {
        name: 'WeatherServer',
        version: '0.1.0',
      },
    }

    console.error('[Server] 📨 收到 initialize 请求')
    console.error(`[Server]   Client: ${params.clientInfo.name} v${params.clientInfo.version}`)
    console.error(`[Server]   协议版本: ${params.protocolVersion}`)

    return createResponse(request.id, result)
  }

  /**
   * 处理 tools/list 请求
   */
  private handleToolsList(request: JsonRpcRequest): JsonRpcResponse {
    if (!this.initialized) {
      return createResponse(
        request.id,
        undefined,
        {
          code: -32002,
          message: 'Server not initialized',
        },
      )
    }

    const result: ToolsListResult = {
      tools: [
        {
          name: 'get_temperature',
          description: '获取指定城市的当前温度',
          inputSchema: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: '城市名称（如：Beijing, Shanghai）',
              },
            },
            required: ['city'],
          },
        },
      ],
    }

    console.error('[Server] 📋 返回工具列表')
    return createResponse(request.id, result)
  }

  /**
   * 处理 tools/call 请求
   */
  private handleToolsCall(request: JsonRpcRequest): JsonRpcResponse {
    if (!this.initialized) {
      return createResponse(
        request.id,
        undefined,
        {
          code: -32002,
          message: 'Server not initialized',
        },
      )
    }

    const params = request.params as ToolsCallParams
    const city = params.arguments?.city as string

    if (!city) {
      return createResponse(
        request.id,
        {
          content: [
            {
              type: 'text',
              text: '错误：缺少 city 参数',
            },
          ],
          isError: true,
        } as ToolsCallResult,
      )
    }

    const weather = WEATHER_DATA[city]
    if (!weather) {
      return createResponse(
        request.id,
        {
          content: [
            {
              type: 'text',
              text: `错误：未找到城市 "${city}" 的天气数据`,
            },
          ],
          isError: true,
        } as ToolsCallResult,
      )
    }

    const result: ToolsCallResult = {
      content: [
        {
          type: 'text',
          text: `${city} 当前温度：${weather.temperature}°C，天气：${weather.condition}`,
        },
      ],
      isError: false,
    }

    console.error(`[Server] 🌡️  执行工具调用: get_temperature(${city})`)
    console.error(`[Server]   结果: ${result.content[0].text}`)

    return createResponse(request.id, result)
  }

  /**
   * 记录请求日志
   */
  private logRequest(request: JsonRpcRequest): void {
    const method = request.method
    const id = request.id !== null ? `#${request.id}` : '[通知]'
    console.error(`[Server] 📥 收到请求: ${method} ${id}`)
  }
}
