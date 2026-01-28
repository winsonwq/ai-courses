import dotenv from 'dotenv';
import path from 'path';

// 加载项目根目录的 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
} as const;

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
} as const;

const tools = [weatherToolSchema, postFeishuToolSchema];

async function callLLM(
  request: LLMRequest,
): Promise<LLMResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

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

    const responseData: any = await response.json()

    if (!response.ok || (responseData.code !== undefined && responseData.code !== 0)) {
      const errorMsg = responseData.msg || responseData.message || response.statusText
      throw new Error(
        `飞书消息发送失败: ${errorMsg} (状态码: ${response.status}, code: ${responseData.code})`
      )
    }
  } catch (error) {
    if (error instanceof Error) throw error
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
async function runThought(messages: Message[]): Promise<string> {
  const thoughtRequest: LLMRequest = {
    model: 'deepseek-chat',
    messages: [
      ...messages,
      { role: 'system', content: 'Thought: ' }
    ],
    temperature: 0.7,
    tools: tools as any,
  }

  const thoughtResponse = await callLLM(thoughtRequest)
  return thoughtResponse.choices[0].message.content || ''
}

async function runAction(messages: Message[]): Promise<Message> {
  const actionRequest: LLMRequest = {
    model: 'deepseek-chat',
    messages: [
      ...messages,
      { role: 'system', content: 'Action: ' }
    ],
    temperature: 0,
    tools: tools as any,
  }

  const actionResponse = await callLLM(actionRequest)
  return actionResponse.choices[0].message
}

async function runTool(name: string, args: any): Promise<string> {
  console.log(`[Action] Calling ${name}(${JSON.stringify(args)})`)
  try {
    if (name === 'getWeather') {
      return await getWeather(args.city)
    } else if (name === 'postFeishu') {
      await postFeishu(args.content)
      return '消息已成功发送到飞书'
    }
    return `Unknown tool: ${name}`
  } catch (error) {
    return `工具调用失败: ${error instanceof Error ? error.message : String(error)}`
  }
}

async function runObservation(messages: Message[]): Promise<string> {
  const observationRequest: LLMRequest = {
    model: 'deepseek-chat',
    messages: [
      ...messages,
      { role: 'system', content: '现在请你根据工具执行的结果，给出你的 Observation。' }
    ],
    temperature: 0.7,
    tools: tools as any,
  }

  const observationResponse = await callLLM(observationRequest)
  return observationResponse.choices[0].message.content || ''
}

function parseThoughtContent(content: string): { visibleContent: string, shouldStop: boolean } {
  const [visibleContent, hiddenJson] = content.split('\u200B\u200B\u200B')
  let shouldStop = false

  if (hiddenJson) {
    try {
      const data = JSON.parse(hiddenJson.trim())
      if (data.continue === false) {
        shouldStop = true
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  return { visibleContent, shouldStop }
}

async function main() {
  const messages: Message[] = [
    {
      role: 'system',
      content: `## 运行规范
你将以 Thought -> Action -> Observation 的循环模式工作。

Thought 阶段:
1. 分析用户意图，判断是否需要调用工具或已可以回答。
2. 如果任务复杂，拆解步骤。
3. 如果已经获得足够信息，直接在 Thought 中给出完整回答，并在回答后追加三个零宽空格（\u200B\u200B\u200B）和隐藏 JSON {"continue": false}。

Action 阶段:
1. 决定调用哪些工具来辅助任务。

Observation 阶段:
1. 基于工具返回的结果，进行归纳和观察。

### 格式要求
- **Thought**: [你的思考过程...] 或 [你的思考过程... 最终回答 \u200B\u200B\u200B{"continue": false}]
- **Action**: 调用工具
- **Observation**: [对工具结果的观察和总结]

### 示例
**User:** 帮我查询北京的天气。

**Thought:** 用户想知道北京的天气，我需要调用获取天气的工具。
**Action:** getWeather(city="北京")
**Observation:** 北京今天天气晴朗，温度20度。

**Thought:** 我已经获取到了天气信息。可以直接回答用户了。北京今天天气晴朗，气温约20度。\u200B\u200B\u200B{"continue": false}
`,
    },
  ]

  console.log('=== ReAct Pattern CLI Chat (Answer in Thought) ===')
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

    if (userInput.trim() === '') continue

    messages.push({ role: 'user', content: userInput })

    let keepRunning = true
    let count = 1
    while (keepRunning) {
      console.log(`\n--- ReAct Loop Iteration ${count} ---`)

      // --- 1. Thought ---
      const thoughtContent = await runThought(messages)
      const { visibleContent, shouldStop } = parseThoughtContent(thoughtContent)
      console.log(`Thought: ${visibleContent}`)
      messages.push({ role: 'assistant', content: thoughtContent })

      if (shouldStop) {
        console.log(`\nAI: ${visibleContent.trim()}`)
        keepRunning = false
        break
      }

      // --- 2. Action ---
      const actionMessage = await runAction(messages)

      if (actionMessage.tool_calls && actionMessage.tool_calls.length > 0) {
        messages.push({
          role: 'assistant',
          content: actionMessage.content || '',
          tool_calls: actionMessage.tool_calls,
        })

        // --- Execute Tools (Inner process) ---
        for (const toolCall of actionMessage.tool_calls) {
          const result = await runTool(toolCall.function.name, JSON.parse(toolCall.function.arguments))
          messages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id,
          })
        }

        // --- 3. Observation ---
        const observationContent = await runObservation(messages)
        console.log(`Observation: ${observationContent}`)
        messages.push({ role: 'assistant', content: observationContent })

        count++
      } else {
        if (actionMessage.content) {
          console.log(`Assistant: ${actionMessage.content}`)
          messages.push({ role: 'assistant', content: actionMessage.content })
        }
        keepRunning = false
      }
    }
  }

  rl.close()
}

main().catch(console.error)
