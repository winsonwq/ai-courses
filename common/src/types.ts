// 公共类型定义

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface LLMRequest {
  messages: Message[]
  model: string
  temperature?: number
  stream?: boolean
  response_format?: {
    type: 'text' | 'json_object'
  }
  tools?: Array<{
    type: string
    function: {
      name: string
      description: string
      parameters: {
        type: string
        properties: Record<
          string,
          {
            type: string
            description: string
            enum?: string[]
          }
        >
        required: string[]
      }
    }
  }>
}

export interface LLMResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: Message & {
      tool_calls?: ToolCall[]
    }
    finish_reason: string
    delta?: {
      role?: string
      content?: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
