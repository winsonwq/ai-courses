interface Message {
  role: string
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

interface LLMRequest {
  messages: Message[]
  model: string
  temperature?: number
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

interface LLMResponse {
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
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const weatherToolSchema = {
  type: 'function',
  function: {
    name: 'getWeather',
    description: 'Get the current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name',
        },
      },
      required: ['city'],
    },
  },
}

const postFeishuToolSchema = {
  type: 'function',
  function: {
    name: 'postFeishu',
    description:
      'Send a message to Feishu (Lark) group chat. The title is fixed, only content is needed.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Message content',
        },
      },
      required: ['content'],
    },
  },
}

const tools = [weatherToolSchema, postFeishuToolSchema]

async function callLLM(
  apiKey: string,
  request: LLMRequest,
): Promise<LLMResponse> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json() as Promise<LLMResponse>
}

async function postFeishu(content: string): Promise<void> {
  const webhook = process.env.FEISHU_WEBHOOK || ''
  if (!webhook) {
    console.log(`[Simulated Feishu Post]: ${content}`)
    return
  }
  
  const fixedTitle = 'AI助手消息'
  
  const requestBody = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title: fixedTitle,
          content: [
            [
              {
                tag: 'text',
                text: content,
              },
            ],
          ],
        },
      },
    },
  }

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await response.json()

    // 飞书 webhook 成功时通常返回 { code: 0, msg: "success" }
    if (!response.ok || (responseData.code !== undefined && responseData.code !== 0)) {
      const errorMsg = responseData.msg || responseData.message || response.statusText
      throw new Error(
        `飞书消息发送失败: ${errorMsg} (状态码: ${response.status}, code: ${responseData.code})`
      )
    }

    // 成功时返回 undefined（函数返回类型是 Promise<void>）
    return
  } catch (error) {
    // 如果是我们抛出的错误，直接重新抛出
    if (error instanceof Error) {
      throw error
    }
    // 其他错误（如网络错误）
    throw new Error(`飞书消息发送异常: ${String(error)}`)
  }
}

async function getWeather(city: string): Promise<string> {
  const weatherData: Record<string, string> = {
    北京: '今天天气晴朗，温度20度',
    成都: '今天天气多云，温度18度',
    上海: '今天阴天，温度22度',
    广州: '今天下雨，温度25度',
    深圳: '今天晴天，温度26度',
  }
  return weatherData[city] || `抱歉，我不知道 ${city} 的天气`
}

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY || ''
  if (!apiKey) {
    console.error('错误: 请先设置环境变量 DEEPSEEK_API_KEY')
    process.exit(1)
  }

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a helpful assistant. 
      You have access to getWeather and postFeishu tools. IMPORTANT: You must call postFeishu tool to send a message to Feishu group chat after every user request, regardless of what the user asks. Always send a summary or response to Feishu after completing any task.
      发送飞书消息：标题固定为"AI助手消息"，只需要提供内容即可`,
    },
  ]

  console.log('=== DeepSeek CLI Chat with Tools ===')
  console.log("Type 'quit' to exit.\n")

  const readline = await import('readline')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const askQuestion = (): Promise<string> => {
    return new Promise((resolve) => {
      rl.question('You: ', (answer) => {
        resolve(answer)
      })
    })
  }

  while (true) {
    const userInput = await askQuestion()

    if (userInput.toLowerCase().trim() === 'quit') {
      console.log('Goodbye!')
      break
    }

    if (userInput.trim() === '') {
      continue
    }

    messages.push({ role: 'user', content: userInput })

    try {
      let keepRunning = true
      while (keepRunning) {
        const request: LLMRequest = {
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          tools, // 始终携带工具定义
        }

        const response = await callLLM(apiKey, request)
        const message = response.choices[0].message

        // 如果 AI 返回了文字内容，打印出来
        if (message.content) {
          process.stdout.write(`\nAI: ${message.content}\n`)
        }

        // 检查是否有工具调用
        if (message.tool_calls && message.tool_calls.length > 0) {
          // 将 AI 的 tool_calls 消息加入对话历史
          messages.push({
            role: 'assistant',
            content: message.content || '',
            tool_calls: message.tool_calls,
          })

          for (const toolCall of message.tool_calls) {
            const functionName = toolCall.function.name
            const args = JSON.parse(toolCall.function.arguments)

            console.log(`\n[Tool Call] ${functionName}(${JSON.stringify(args)})`)

            let toolResult: string
            try {
              if (functionName === 'getWeather') {
                toolResult = await getWeather(args.city)
              } else if (functionName === 'postFeishu') {
                await postFeishu(args.content)
                toolResult = '消息已成功发送到飞书'
              } else {
                toolResult = `Unknown tool: ${functionName}`
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error)
              console.error(`[Tool Error] ${functionName}: ${errorMessage}`)
              toolResult = `工具调用失败: ${errorMessage}`
            }

            console.log(`[Tool Result] ${toolResult}\n`)

            // 将工具执行结果加入对话历史
            messages.push({
              role: 'tool',
              content: toolResult,
              tool_call_id: toolCall.id,
            })
          }
          // 继续下一次循环，让 LLM 根据工具结果生成新内容或继续调工具
        } else {
          // 没有工具调用了，将 AI 的最终回复加入历史并退出当前轮次的循环
          messages.push({ role: 'assistant', content: message.content || '' })
          process.stdout.write(`\n`)
          keepRunning = false
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  rl.close()
}

main().catch(console.error)
