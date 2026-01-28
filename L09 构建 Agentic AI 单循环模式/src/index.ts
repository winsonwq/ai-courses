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
  tools?: any[]
}

interface LLMResponse {
  choices: Array<{
    message: Message
    finish_reason: string
  }>
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'getWeather',
      description: '获取指定城市的天气',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'postFeishu',
      description: '发送消息到飞书',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '消息内容' },
        },
        required: ['content'],
      },
    },
  }
];

async function callLLM(request: LLMRequest): Promise<LLMResponse> {
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
  });
  return response.json() as Promise<LLMResponse>;
}

async function runStep(messages: Message[]): Promise<Message> {
  const response = await callLLM({
    model: 'deepseek-chat',
    messages,
    tools,
  });
  return response.choices[0].message;
}

/**
 * 模拟工具执行
 */
async function handleToolCalls(toolCalls: ToolCall[]): Promise<Message[]> {
  const results: Message[] = [];
  for (const toolCall of toolCalls) {
    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    console.log(`[Action] Calling ${name} with ${JSON.stringify(args)}`);

    let result = '';
    if (name === 'getWeather') result = `${args.city}天气晴朗，25度`;
    else if (name === 'postFeishu') result = '消息已发送到飞书';

    console.log(`[Result] ${result}`);
    results.push({
      role: 'tool',
      content: result,
      tool_call_id: toolCall.id
    });
  }
  return results;
}

/**
 * Agent 核心循环：Single Loop Pattern
 */
async function runAgent(messages: Message[]) {
  while (true) {
    console.log('Thinking...');
    const message = await runStep(messages);
    messages.push(message);

    if (message.content) {
      console.log(`\nAI: ${message.content}`);
    }

    // 1. 判断是否不继续（通过文字判断）
    if (message.content && message.content.includes('[STOP]')) {
      break;
    }

    // 2. 如果有工具调用，则执行
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolResults = await handleToolCalls(message.tool_calls);
      messages.push(...toolResults);
    }
  }
}

async function main() {
  const messages: Message[] = [
    {
      role: 'system',
      content: '你是一个全能助手。你可以通过调用工具来完成任务。\n' +
        '如果你认为任务已经完成，或者不需要再执行工具，请在回复的结尾加上 [STOP]。\n' +
        '每一轮执行，你都会看到上一轮的工具执行结果，请根据结果自主判断下一步。'
    }
  ];

  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('--- Agentic AI 单循环模式 ---');

  while (true) {
    const userInput = await new Promise<string>((resolve) => rl.question('\nUser: ', resolve));
    if (userInput.toLowerCase() === 'exit') break;

    messages.push({ role: 'user', content: userInput });

    // 启动 Agent 循环
    await runAgent(messages);
  }
  rl.close();
}

main();
