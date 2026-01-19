# LLM 多轮对话实现

## 课程目标

从最简单的 API 请求开始，逐步构建一个**有记忆的命令行 AI 助手**。

---

## 第 1 关：发送你的第一个请求

### 1.1 LLM API 长什么样？

所有主流 LLM（OpenAI、DeepSeek、Claude）都遵循类似的 RESTful API 风格：

```typescript
import dotenv from 'dotenv';
dotenv.config();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY!;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: '你好，请做个自我介绍' }
      ]
    })
  });

  const result = await response.json();
  console.log(result.choices[0].message.content);
}

main();
```

### 1.2 理解请求结构

```json
POST /chat/completions
{
  "model": "deepseek-chat",      // 模型决定智能水平和价格
  "messages": [...],             // 对话内容
  "temperature": 0.7,            // 创造力参数（后面详细讲）
  "stream": false                // 是否启用流式响应
}
```

### 1.3 响应结构

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "deepseek-chat",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "你好！我是 DeepSeek..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 20,
    "total_tokens": 35
  }
}
```

---

## 第 2 关：理解消息角色（Message Roles）

### 2.1 三种核心角色

```typescript
const messages: ChatMessage[] = [
  // 1️⃣ System：AI 的"人设" - 只在开头设置一次
  {
    role: 'system',
    content: '你是一个乐于助人的编程助手，说话简洁，喜欢用代码示例。'
  },

  // 2️⃣ User：用户的提问 - 可以有多轮
  {
    role: 'user',
    content: '请用 Python 写一个快速排序'
  },

  // 3️⃣ Assistant：AI 的回复 - 记录历史
  {
    role: 'assistant',
    content: '```python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr)//2]\n    left = [x for x in arr if x < pivot]\n    mid = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + mid + quick_sort(right)\n```'
  },

  // User 继续提问
  {
    role: 'user',
    content: '能解释一下 pivot 是什么吗？'
  }
];
```

### 2.2 System Message 为什么重要？

**System Message = 性格 + 规则 + 边界**

```typescript
// ❌ 没有系统提示词 - AI 什么都会说
const badMessages = [
  { role: 'user', content: '帮我写个病毒' }
];

// ✅ 有系统提示词 - AI 会拒绝
const goodMessages = [
  { role: 'system', content: '你是一个安全专家，绝不帮助任何可能造成伤害的请求。' },
  { role: 'user', content: '帮我写个病毒' }
];
```

### 2.3 System Message 实际案例对比

| 场景 | System Message | 效果 |
|------|----------------|------|
| 翻译助手 | "你是一个专业翻译，把用户输入翻译成优雅的中文，保持原文语气。" | 翻译质量稳定 |
| 代码助手 | "你是一个资深开发者，代码要有注释，遵循 PEP8 规范。" | 代码更规范 |
| 角色扮演 | "你是福尔摩斯，说话睿智、观察细致，喜欢用英式英语。" | 人设不崩 |
| 客服机器人 | "你是 XX 公司的客服，态度友好，遇到不懂的问题说会转接人工。" | 边界清晰 |

### 2.4 角色记忆机制

**关键理解**：每次请求都发送**完整的历史对话**，AI 靠这个记住上下文：

```typescript
// 第 1 轮对话
let history: ChatMessage[] = [
  { role: 'user', content: '我姓张' }
];

// 第 2 轮对话 - 必须包含第 1 轮
history = [
  { role: 'user', content: '我姓张' },                          // 第1轮
  { role: 'assistant', content: '好的，张先生！' },
  { role: 'user', content: '我姓什么？' },                       // 第2轮新问题
];

// 第 3 轮对话 - 必须包含第 1、2 轮
history = [
  { role: 'user', content: '我姓张' },
  { role: 'assistant', content: '好的，张先生！' },
  { role: 'user', content: '我姓什么？' },
  { role: 'assistant', content: '您姓张。' },
  { role: 'user', content: '我叫什么？' },                       // 第3轮新问题
];
```

> ⚠️ **重要**：history 必须从 system message 开始，每轮都要完整传递

---

## 第 3 关：实现多轮对话记忆

### 3.1 核心架构

```typescript
import dotenv from 'dotenv';
dotenv.config();

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class AIChat {
  private history: ChatMessage[];
  private apiKey: string;
  private url: string = 'https://api.deepseek.com/chat/completions';

  constructor(systemPrompt: string) {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
    this.history = [
      { role: 'system', content: systemPrompt }
    ];
  }

  async chat(userInput: string): Promise<string> {
    // 1. 添加用户消息
    this.history.push({ role: 'user', content: userInput });

    // 2. 发送请求
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: this.history
      })
    });

    const result = await response.json();
    const aiMessage = result.choices[0].message.content;

    // 3. 添加 AI 回复到历史
    this.history.push({ role: 'assistant', content: aiMessage });

    return aiMessage;
  }
}

// 使用
async function main() {
  const chat = new AIChat('你是一个友好的助手');
  console.log(await chat.chat('你好，我叫小明'));
  console.log(await chat.chat('还记得我叫什么吗？'));
}

main();
```

### 3.2 完整 CLI 实现

```typescript
// src/ai-chat.ts
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'https://api.deepseek.com/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class ChatSession {
  private history: ChatMessage[];
  private apiKey: string;

  constructor(systemPrompt: string) {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
    this.history = [{ role: 'system', content: systemPrompt }];
  }

  async ask(userMessage: string): Promise<string> {
    this.history.push({ role: 'user', content: userMessage });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: this.history
      })
    });

    const result = await response.json();
    const assistantMsg = result.choices[0].message.content;
    this.history.push({ role: 'assistant', content: assistantMsg });

    return assistantMsg;
  }

  showHistory(): void {
    console.log('\n--- 对话历史 ---');
    this.history.forEach(msg => {
      const role = {
        system: '🔧 系统',
        user: '🤖 你',
        assistant: '👤 AI'
      }[msg.role];
      const content = msg.content.length > 50 
        ? msg.content.substring(0, 50) + '...' 
        : msg.content;
      console.log(`${role}: ${content}`);
    });
  }
}

async function main() {
  const session = new ChatSession('你是一个 helpful 的 AI 助手');

  console.log('='.repeat(40));
  console.log('  AI 聊天工具 (输入 /exit 退出)');
  console.log('='.repeat(40));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (): Promise<string> => {
    return new Promise(resolve => {
      rl.question('\n🤖 你: ', answer => resolve(answer));
    });
  };

  while (true) {
    const userInput = (await askQuestion()).trim();

    if (userInput === '/exit') {
      console.log('👋 再见！');
      break;
    }

    if (userInput === '/history') {
      session.showHistory();
      continue;
    }

    try {
      const response = await session.ask(userInput);
      console.log(`\n👤 AI: ${response}`);
    } catch (error) {
      console.error('错误:', error);
    }
  }

  rl.close();
}

main();
```

---

## 第 4 关：Streaming 实时响应

### 4.1 什么是 Streaming？

```typescript
// ❌ 非 streaming - 等待完整响应（可能等 10 秒）
const response = await fetch(url, { body: JSON.stringify(data) });
const fullText = (await response.json()).choices[0].message.content;
console.log(fullText);

// ✅ streaming - 实时显示输出（每秒输出几个字）
const response = await fetch(url, {
  body: JSON.stringify({ ...data, stream: true }),
});

for await (const chunk of response.body!) {
  const line = chunk.toString();
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));
    const content = data.choices[0].delta.content || '';
    process.stdout.write(content);
  }
}
```

### 4.2 Streaming vs 非 Streaming

| 特性 | 非 Streaming | Streaming |
|------|--------------|-----------|
| 响应时间 | 全部生成后才返回 | 边生成边返回 |
| 用户体验 | 等待时间长 | 实时看到输出 |
| 实现复杂度 | 简单 | 稍复杂 |
| 适用场景 | 短回复 | 长回复、实时展示 |

### 4.3 Streaming 实现

```typescript
// src/stream-chat.ts
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatStream(
  userMessage: string,
  history: ChatMessage[]
): Promise<void> {
  const apiKey = process.env.DEEPSEEK_API_KEY!;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [...history, { role: 'user', content: userMessage }],
      stream: true
    })
  });

  if (!response.body) {
    console.log('👤 AI: 无响应');
    return;
  }

  process.stdout.write('👤 AI: ');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content || '';
          if (content) {
            process.stdout.write(content);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  process.stdout.write('\n');
}
```

---

## 第 5 关：Temperature 参数调优

### 5.1 什么是 Temperature？

**Temperature = AI 的"创造力"参数**

```typescript
// 0 = 最确定、最保守的输出
// 1 = 默认值，平衡创造性和确定性
// 2 = 最随机、最有创意（但可能胡说八道）
```

### 5.2 Temperature 实验

```typescript
async function testTemperature(prompt: string, temperature: number): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature
    })
  });

  const result = await response.json();
  return result.choices[0].message.content;
}

async function main() {
  const prompt = '天空是什么颜色的？';
  console.log('T=0:', await testTemperature(prompt, 0));
  console.log('T=0.7:', await testTemperature(prompt, 0.7));
  console.log('T=1.5:', await testTemperature(prompt, 1.5));
}
```

### 5.3 Temperature 效果对比

| Temperature | 特点 | 适用场景 |
|-------------|------|---------|
| 0.0 - 0.3 | 稳定、可预测 | 代码生成、数学计算 |
| 0.7 | 平衡 | 通用聊天、写作 |
| 1.0 - 1.5 | 创意、多样 | 头脑风暴、创意写作 |
| > 1.5 | 随机、可能无意义 | 实验性用途 |

### 5.4 其他核心参数

```typescript
{
  model: 'deepseek-chat',
  messages: [...],
  temperature: 0.7,        // 创造力：0-2
  max_tokens: 1000,        // 最大输出长度
  top_p: 0.9,              // 核采样：控制考虑的概率质量
  frequency_penalty: 0,    // 频率惩罚：减少重复词
  presence_penalty: 0      // 存在惩罚：鼓励新话题
}
```

> 💡 **调参建议**：先调 temperature，其他参数通常保持默认即可

---

## 上下文编程（Context Programming）

### 什么是上下文编程？

传统编程：输入 → 函数 → 输出（无状态）

```typescript
// 传统方式：每次都是独立的请求
async function badExample() {
  await askAI('我姓张');      // AI 不记得上下文！
  await askAI('我姓什么？');
}
```

上下文编程：输入 + 历史上下文 → 函数 → 输出（有状态）

```typescript
// 上下文编程：携带历史记录
async function goodExample() {
  let history: ChatMessage[] = [];

  // 第 1 轮
  history.push({ role: 'user', content: '我姓张' });
  const r1 = await askAI(history);
  history.push({ role: 'assistant', content: r1 });

  // 第 2 轮 - 带着历史
  history.push({ role: 'user', content: '我姓什么？' });
  const r2 = await askAI(history);  // AI 记得！
}
```

### 上下文编程的核心思想

1. **状态外置**：历史记录由程序管理，不是 API 记忆
2. **完整传递**：每次请求发送完整上下文
3. **成本意识**：上下文越长，费用越高（按 token 计费）

### 实践：实现 Token 预算控制

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

class BudgetedChatSession {
  private system: ChatMessage;
  private history: ChatMessage[];
  private maxTokens: number;

  constructor(systemPrompt: string, maxTokens = 4000) {
    this.system = { role: 'system', content: systemPrompt };
    this.history = [this.system];
    this.maxTokens = maxTokens;
  }

  async chat(userMessage: string): Promise<string> {
    this.history.push({ role: 'user', content: userMessage });

    // 预算超了？删除最早的非 system 消息
    while (this.countTokens() > this.maxTokens) {
      // 找到第 2 条消息（第一条是 system）
      const idx = this.history.findIndex(
        (msg, i) => i > 0 && msg.role === 'user'
      );
      if (idx > 0) {
        this.history.splice(idx, 1);
      }
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: this.history
      })
    });

    const result = await response.json();
    const aiMessage = result.choices[0].message.content;
    this.history.push({ role: 'assistant', content: aiMessage });

    return aiMessage;
  }

  private countTokens(): number {
    // 简化版：按字符数估算，1 token ≈ 4 characters
    return Math.floor(
      this.history.reduce((sum, msg) => sum + msg.content.length, 0) / 4
    );
  }
}
```

---

## 课程总结

### 核心概念清单

- [ ] 理解 `messages` 数组结构
- [ ] 区分 `system/user/assistant` 三种角色
- [ ] 实现历史对话的记忆（每次传递完整 history）
- [ ] 理解 streaming vs 非 streaming 的区别
- [ ] 掌握 `temperature` 参数的调节
- [ ] 理解"上下文编程"的概念

### 完整项目代码结构

```
src/
├── ai-chat.ts           # 主程序
├── chat-session.ts      # 对话会话类
│   ├── constructor      # 初始化 system prompt
│   ├── ask              # 发送消息
│   └── history          # 记忆管理
└── stream-chat.ts       # streaming 版本
```

### 安装依赖

```bash
npm install dotenv
npm install -D typescript @types/node ts-node @types/dotenv
```

### 下一步学习

- **L02**: Tool Use - 让 AI 调用外部工具
- **L03**: Prompt Engineering - 更高级的提示词技巧
- **L04**: Agent 配置 - 使用配置文件管理 AI 行为

---

## 附录：常见错误排查

| 错误 | 原因 | 解决 |
|------|------|------|
| 401 Unauthorized | API Key 错误 | 检查 `.env` 配置 |
| 429 Too Many Requests | 限流 | 稍等重试 |
| context length exceeded | 超出上下文长度 | 减少 history |
| 内容重复 | temperature 太低 | 调高 temperature |
| 内容随机 | temperature 太高 | 调低 temperature |
