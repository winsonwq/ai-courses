/**
 * MCP Stdio Client 实现
 * 通过子进程的 stdin/stdout 与 Server 通信
 */

import { spawn, type ChildProcess } from 'child_process'
import type {
  InitializeParams,
  InitializeResult,
  JsonRpcRequest,
  JsonRpcResponse,
  ToolsCallParams,
  ToolsListResult,
} from '../types/mcp.js'
import { MCP_PROTOCOL_VERSION, createRequest, createNotification } from '../types/mcp.js'

/**
 * MCP Stdio Client 类
 */
export class StdioClient {
  private serverProcess: ChildProcess | null = null
  private requestId = 0
  private pendingRequests = new Map<number | string, {
    resolve: (value: JsonRpcResponse) => void
    reject: (error: Error) => void
  }>()

  /**
   * 启动 Server 进程并建立连接
   */
  public async connect(serverCommand: string, serverArgs: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      // 启动 Server 子进程
      this.serverProcess = spawn(serverCommand, serverArgs, {
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
      })

      // 监听 stdout（Server 的响应）
      this.serverProcess.stdout?.on('data', (data: Buffer) => {
        this.handleServerMessage(data.toString())
      })

      // 监听 stderr（Server 的日志）
      this.serverProcess.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(data)
      })

      // 监听进程退出
      this.serverProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`[Client] ❌ Server 进程异常退出，代码: ${code}`)
        }
      })

      // 监听错误
      this.serverProcess.on('error', (error) => {
        reject(new Error(`启动 Server 失败: ${error.message}`))
      })

      // 等待一下确保进程启动
      setTimeout(() => {
        resolve()
      }, 100)
    })
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
    }
    this.pendingRequests.clear()
  }

  /**
   * 发送 initialize 请求
   */
  public async initialize(clientName: string, clientVersion: string): Promise<InitializeResult> {
    const params: InitializeParams = {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        roots: {
          listChanged: true,
        },
      },
      clientInfo: {
        name: clientName,
        version: clientVersion,
      },
    }

    const response = await this.sendRequest('initialize', params)
    return response.result as InitializeResult
  }

  /**
   * 发送 initialized 通知
   */
  public async sendInitialized(): Promise<void> {
    await this.sendNotification('notifications/initialized')
  }

  /**
   * 获取工具列表
   */
  public async listTools(): Promise<ToolsListResult> {
    const response = await this.sendRequest('tools/list', undefined)
    return response.result as ToolsListResult
  }

  /**
   * 调用工具
   */
  public async callTool(name: string, args?: Record<string, unknown>): Promise<unknown> {
    const params: ToolsCallParams = {
      name,
      arguments: args,
    }

    const response = await this.sendRequest('tools/call', params)
    return response.result
  }

  /**
   * 发送 JSON-RPC 请求
   */
  private async sendRequest(method: string, params: unknown): Promise<JsonRpcResponse> {
    if (!this.serverProcess || !this.serverProcess.stdin) {
      throw new Error('Server 未连接')
    }

    const id = ++this.requestId
    const request = createRequest(method, params, id)

    // 记录请求日志
    this.logRequest(request)

    // 发送请求
    return new Promise((resolve, reject) => {
      // 保存 resolve/reject 以便后续处理响应
      this.pendingRequests.set(id, { resolve, reject })

      // 发送 JSON 到 Server 的 stdin
      const json = JSON.stringify(request) + '\n'
      this.serverProcess!.stdin!.write(json, (error) => {
        if (error) {
          this.pendingRequests.delete(id)
          reject(error)
        }
      })

      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error(`请求超时: ${method}`))
        }
      }, 10000) // 10 秒超时
    })
  }

  /**
   * 发送 JSON-RPC 通知（无响应）
   */
  private async sendNotification(method: string, params?: unknown): Promise<void> {
    if (!this.serverProcess || !this.serverProcess.stdin) {
      throw new Error('Server 未连接')
    }

    const notification = createNotification(method, params)
    this.logNotification(notification)

    const json = JSON.stringify(notification) + '\n'
    this.serverProcess.stdin.write(json)
  }

  /**
   * 处理来自 Server 的消息
   * Server 的 stdout 应该只包含 JSON-RPC 响应
   */
  private handleServerMessage(data: string): void {
    const lines = data.split('\n').filter((line) => line.trim())

    for (const line of lines) {
      // 跳过空行
      if (!line.trim()) {
        continue
      }

      // 尝试解析 JSON
      try {
        const response = JSON.parse(line) as JsonRpcResponse

        // 验证是否是有效的 JSON-RPC 响应
        if (response.jsonrpc !== '2.0') {
          console.error('[Client] ⚠️  收到非 JSON-RPC 2.0 消息:', line.substring(0, 100))
          continue
        }

        // 记录响应日志
        this.logResponse(response)

        // 查找对应的请求并 resolve
        if (response.id !== null && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id)!

          if (response.error) {
            reject(new Error(`Server 错误: ${response.error.message}`))
          } else {
            resolve(response)
          }

          this.pendingRequests.delete(response.id)
        } else if (response.id !== null) {
          // 收到未预期的响应（可能是之前的请求超时了）
          console.error(`[Client] ⚠️  收到未预期的响应 ID: ${response.id}`)
        }
      } catch (error) {
        // 如果不是有效的 JSON，可能是 Server 的日志混入了 stdout
        // 这种情况不应该发生，但我们可以优雅地处理
        if (line.length < 200) {
          // 只对短消息显示警告（可能是日志）
          console.error('[Client] ⚠️  无法解析 Server 消息（可能是日志）:', line)
        }
      }
    }
  }

  /**
   * 记录请求日志
   */
  private logRequest(request: JsonRpcRequest): void {
    const method = request.method
    const id = request.id !== null ? `#${request.id}` : ''
    console.log(`[Client] 📤 发送请求: ${method} ${id}`)
  }

  /**
   * 记录通知日志
   */
  private logNotification(notification: { method: string }): void {
    console.log(`[Client] 📤 发送通知: ${notification.method}`)
  }

  /**
   * 记录响应日志
   */
  private logResponse(response: JsonRpcResponse): void {
    const id = response.id !== null ? `#${response.id}` : ''
    if (response.error) {
      console.log(`[Client] 📥 收到错误响应 ${id}: ${response.error.message}`)
    } else {
      console.log(`[Client] 📥 收到响应 ${id}`)
    }
  }
}
