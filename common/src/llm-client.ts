// 公共 LLM 客户端代码

import { LLMRequest, LLMResponse } from './types'

export interface LLMClientOptions {
  apiKey: string
  baseUrl?: string
  model?: string
}

export class LLMClient {
  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(options: LLMClientOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl || 'https://api.deepseek.com/chat/completions'
    this.defaultModel = options.model || 'deepseek-chat'
  }

  /**
   * 普通请求（非流式，非 JSON mode）
   * 也可以手动设置 response_format 参数
   */
  async call(
    request: Omit<LLMRequest, 'model'> & { model?: string }
  ): Promise<LLMResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.defaultModel,
        // 如果请求中包含了 response_format，会使用它
        // 如果没有，则不会设置（普通模式）
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.statusText}\n${errorText}`)
    }

    return response.json() as Promise<LLMResponse>
  }

  /**
   * JSON mode 请求（强制输出 JSON 格式）
   */
  async callJSON(
    request: Omit<LLMRequest, 'model' | 'response_format'> & { model?: string }
  ): Promise<LLMResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.defaultModel,
        response_format: {
          type: 'json_object',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.statusText}\n${errorText}`)
    }

    return response.json() as Promise<LLMResponse>
  }

  /**
   * Stream mode 请求（流式输出）
   */
  async *callStream(
    request: Omit<LLMRequest, 'model' | 'stream'> & { model?: string }
  ): AsyncGenerator<LLMResponse, void, unknown> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.defaultModel,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.statusText}\n${errorText}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }
            try {
              const parsed = JSON.parse(data) as LLMResponse
              yield parsed
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * JSON mode + Stream mode 请求（流式输出 JSON）
   */
  async *callJSONStream(
    request: Omit<LLMRequest, 'model' | 'stream' | 'response_format'> & { model?: string }
  ): AsyncGenerator<LLMResponse, void, unknown> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        ...request,
        model: request.model || this.defaultModel,
        stream: true,
        response_format: {
          type: 'json_object',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.statusText}\n${errorText}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }
            try {
              const parsed = JSON.parse(data) as LLMResponse
              yield parsed
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}
