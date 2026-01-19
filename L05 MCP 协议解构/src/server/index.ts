/**
 * MCP Server 入口
 * 通过 Stdio 与 Client 通信
 */

import { WeatherServer } from './weather-server.js'
import type { JsonRpcNotification, JsonRpcRequest } from '../types/mcp.js'

const server = new WeatherServer()

/**
 * 从 stdin 读取 JSON-RPC 消息
 * 使用行缓冲方式读取，每行应该是一个完整的 JSON 对象
 */
async function readMessage(): Promise<JsonRpcRequest | JsonRpcNotification | null> {
  return new Promise((resolve) => {
    let buffer = ''

    const stdin = process.stdin
    stdin.setEncoding('utf8')

    const onData = (chunk: string): void => {
      buffer += chunk

      // 按行分割
      const lines = buffer.split('\n')
      // 保留最后一行（可能不完整）
      buffer = lines.pop() || ''

      // 处理完整的行
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        try {
          const message = JSON.parse(trimmed) as JsonRpcRequest | JsonRpcNotification
          // 找到完整的消息，立即解析并返回
          resolve(message)
          return
        } catch (error) {
          // 忽略解析错误，继续读取下一行
          console.error(`[Server] ⚠️  无法解析 JSON: ${trimmed}`)
        }
      }
    }

    const onEnd = (): void => {
      // stdin 关闭，返回 null 表示结束
      resolve(null)
    }

    stdin.on('data', onData)
    stdin.on('end', onEnd)
  })
}

/**
 * 主循环：读取请求并发送响应
 */
async function main(): Promise<void> {
  console.error('[Server] 🚀 Weather Server 启动')
  console.error('[Server] 等待 Client 连接...\n')

  // 持续读取消息
  while (true) {
    const message = await readMessage()

    // 如果读取到 null，表示 stdin 关闭，退出循环
    if (!message) {
      break
    }

    // 检查是否是通知（无 id 或 id 为 null/undefined）
    if (!('id' in message) || message.id === null || message.id === undefined) {
      // 这是通知
      server.handleNotification(message)
      continue
    }

    // 这是请求，需要响应
    const request = message as JsonRpcRequest
    const response = server.handleRequest(request)

    if (response) {
      // 发送响应到 stdout（必须是纯 JSON，不能有其他输出）
      // 注意：这里必须使用 console.log，因为 stdout 用于 JSON-RPC 通信
      console.log(JSON.stringify(response))
      // 确保立即刷新输出
      if (process.stdout.isTTY) {
        process.stdout.write('')
      }
    }
  }

  console.error('[Server] 👋 Server 关闭')
}

// 启动 Server
main().catch((error) => {
  console.error('[Server] ❌ 错误:', error)
  process.exit(1)
})
