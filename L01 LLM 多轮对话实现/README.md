# 01-LLM 多轮对话实现

> 从 0 开始构建一个**有记忆的命令行 AI 聊天工具**，掌握大语言模型 API 的核心概念。

## 课程目标

- 理解 LLM API 的请求/响应结构
- 掌握消息角色（system/user/assistant）的意义
- 实现多轮对话的 history 记忆机制
- 理解 streaming vs 非 streaming 的区别
- 掌握 temperature 等核心参数调优

---

## 第 1 关：发送你的第一个请求

### 1.1 LLM API 的本质

所有主流大语言模型（OpenAI、DeepSeek、Claude、Anthropic）都提供了一套类似的 RESTful API。这套 API 的设计哲学是：**把 LLM 当成一个黑盒函数，你给它输入文本，它返回输出文本**。

但这个"函数"有一个关键特点：**它没有状态（stateless）**。每次调用都是独立的，API 不会记住之前的对话。

### 1.2 第一个请求

让我们发送一个最简单的请求：

```typescript
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: '你好，请做个自我介绍' }]
    })
  });

  const result = await response.json();
  console.log(result.choices[0].message.content);
}

main();
```

### 1.3 请求结构详解

```json
POST /chat/completions
{
  "model": "deepseek-chat",
  "messages": [...],
  "temperature": 0.7,
  "stream": false
}
```

| 字段 | 说明 |
|------|------|
| `model` | 指定使用的模型，不同模型有不同的智能水平、价格、速度 |
| `messages` | 对话内容数组，告诉模型"说了什么" |
| `temperature` | 控制输出的随机性（后面详细讲） |
| `stream` | 是否启用流式响应（后面详细讲） |

### 1.4 响应结构详解

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

| 字段 | 说明 |
|------|------|
| `choices[0].message.content` | AI 的回复内容 |
| `finish_reason` | 结束原因：`stop` 正常结束，`length` 超出长度限制 |
| `usage.prompt_tokens` | 输入的 token 数量（计费用） |
| `usage.completion_tokens` | 输出的 token 数量（计费用） |

> **Token 是什么？** Token 是文本的最小单位。英文中约 4 个字符 ≈ 1 个 Token，中文约 1-2 个字符 ≈ 1 个 Token。

### 1.5 动手实验

修改代码，把 `model` 改成 `gpt-4o` 或其他模型，观察输出的变化。

---

## 第 2 关：理解消息角色（Message Roles）

### 2.1 三种核心角色

LLM API 的 `messages` 数组支持四种角色：

| 角色 | 英文 | 说明 | 特点 |
|------|------|------|------|
| 系统 | `system` | AI 的人设/规则 | 只在开头设置一次，对整个对话生效 |
| 用户 | `user` | 用户的提问 | 可以有多轮，每轮都是新的输入 |
| 助手 | `assistant` | AI 的回复 | 记录历史，让 AI 记住自己说过的话 |
| 工具 | `tool` | 工具调用结果 | 用于 Tool Use 场景（L02 会讲） |

### 2.2 System Message：AI 的"人设"

**System Message 是整个对话中最重要的字段**，它定义了 AI 的性格、规则、边界。

```typescript
// 没有系统提示词 - AI 什么都会说，没有固定人设
const messages1 = [
  { role: 'user', content: '帮我写个病毒' }
];

// 有系统提示词 - AI 会拒绝危险请求
const messages2 = [
  { role: 'system', content: '你是一个安全专家，绝不帮助任何可能造成伤害的请求。' },
  { role: 'user', content: '帮我写个病毒' }
];
```

### 2.3 System Message 实际案例

**案例 1：翻译助手**

```typescript
const messages = [
  { role: 'system', content: `你是一个专业翻译，遵循以下规则：
1. 保持原文的语气和风格
2. 不添加额外的解释
3. 专有名词保持原文
4. 输出格式与输入一致` },
  { role: 'user', content: '翻译成英文：今天的天气真好！' }
];
```

**案例 2：代码助手**

```typescript
const messages = [
  { role: 'system', content: `你是一个资深全栈开发者，遵循以下规范：
1. 代码必须有注释
2. 遵循各语言的官方规范（PEP8、Google Style 等）
3. 优先使用 TypeScript
4. 错误处理要完善` },
  { role: 'user', content: '写一个快速排序' }
];
```

**案例 3：角色扮演**

```typescript
const messages = [
  { role: 'system', content: `你是福尔摩斯，一个杰出的侦探。
- 说话睿智、观察细致
- 喜欢用英式英语
- 经常说 "My dear Watson"
- 善于从细节推断真相` },
  { role: 'user', content: '福尔摩斯，帮我分析这个案子' }
];
```

### 2.4 为什么 System Message 如此重要？

1. **控制行为**：定义 AI 能做什么、不能做什么
2. **统一风格**：保证多轮对话中风格一致
3. **设置边界**：防止 AI 生成有害内容
4. **指定专业性**：让 AI 以专家身份回答问题

### 2.5 User 和 Assistant 的记忆机制

**关键理解**：LLM API 是无状态的，每次请求都需要发送完整的对话历史。

```typescript
// 第 1 轮对话
let history = [
  { role: 'user', content: '我姓张' }
];
// AI 回复：好的，张先生！

// 第 2 轮对话 - 必须包含第 1 轮
history = [
  { role: 'user', content: '我姓张' },                          // 第1轮
  { role: 'assistant', content: '好的，张先生！' },
  { role: 'user', content: '我姓什么？' },                       // 第2轮新问题
];
// AI 回复：您姓张。

// 第 3 轮对话 - 必须包含第 1、2 轮
history = [
  { role: 'user', content: '我姓张' },
  { role: 'assistant', content: '好的，张先生！' },
  { role: 'user', content: '我姓什么？' },
  { role: 'assistant', content: '您姓张。' },
  { role: 'user', content: '我叫什么？' },                       // 第3轮新问题
];
```

> ⚠️ **常见错误**：忘记传递历史消息，导致 AI"失忆"

### 2.6 动手实验

1. 不传 system message，问"你是什么人"，观察回答
2. 传不同的 system message（如"你是小学生"），观察回答变化
3. 只传最后一轮消息，验证 AI 是否还记得之前的信息

---

## 第 3 关：实现多轮对话记忆

### 3.1 核心架构

我们需要一个 `ChatSession` 类来管理对话历史：

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class ChatSession {
  private history: ChatMessage[];
  private apiKey: string;
  private readonly API_URL = 'https://api.deepseek.com/chat/completions';

  constructor(systemPrompt: string) {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
    this.history = [{ role: 'system', content: systemPrompt }];
  }

  async ask(userMessage: string): Promise<string> {
    // 1. 添加用户消息
    this.history.push({ role: 'user', content: userMessage });

    // 2. 发送请求（携带完整历史）
    const response = await fetch(this.API_URL, {
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
    const reply = result.choices[0].message.content;

    // 3. 添加 AI 回复到历史
    this.history.push({ role: 'assistant', content: reply });

    return reply;
  }
}
```

### 3.2 CLI 交互实现

```typescript
import * as readline from 'readline';

class ChatSession {
  // ... 上面的代码 ...

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

### 3.3 运行效果

```bash
$ npx ts-node src/ai-chat.ts
========================================
  AI 聊天工具 (输入 /exit 退出)
========================================

🤖 你: 你好，我叫小明
👤 AI: 你好小明！很高兴认识你。有什么我可以帮你的吗？

🤖 你: 我叫什么名字？
👤 AI: 你叫小明呀！需要继续这个话题吗？

🤖 You: /history
--- 对话历史 ---
🔧 系统: 你是一个 helpful 的 AI 助手
🤖 你: 你好，我叫小明
👤 AI: 你好小明！很高兴认识你。有什么我可以...
🤖 你: 我叫什么名字？
👤 AI: 你叫小明呀！需要继续这个话题吗？

🤖 You: /exit
👋 再见！
```

### 3.4 思考：history 会无限增长吗？

不会，有两个限制：

1. **上下文窗口限制**：模型有最大上下文长度（如 64K tokens），超出后会报错
2. **成本限制**：上下文越长，费用越高

解决方案：实现滑动窗口，只保留最近的 N 轮对话。

```typescript
class SlidingWindowChatSession {
  private history: ChatMessage[];
  private maxRounds: number;  // 保留最近 N 轮

  constructor(systemPrompt: string, maxRounds = 10) {
    this.history = [{ role: 'system', content: systemPrompt }];
    this.maxRounds = maxRounds;
  }

  async ask(userMessage: string): Promise<string> {
    this.history.push({ role: 'user', content: userMessage });

    // 滑动窗口：保留 system + 最近 N 轮
    const systemMsg = this.history[0];
    const recentMessages = this.history.slice(-(this.maxRounds * 2));
    this.history = [systemMsg, ...recentMessages];

    // ... 发送请求 ...

    return '';  // 返回值省略
  }
}
```

---

## 第 4 关：Streaming 实时响应

### 4.1 什么是 Streaming？

默认情况下，API 会等待模型生成完**全部**内容后，一次性返回。这对于短回复没问题，但如果模型要生成一篇长文章，用户可能需要等待 10-30 秒。

**Streaming** 解决这个问题：模型边生成，边通过流式传输返回，用户可以实时看到输出。

### 4.2 对比：非 Streaming vs Streaming

| 特性 | 非 Streaming | Streaming |
|------|--------------|-----------|
| 响应时间 | 全部生成后才返回 | 边生成边返回 |
| 用户体验 | 等待时间长 | 实时看到输出，有打字机效果 |
| 实现复杂度 | 简单 | 稍复杂 |
| 适用场景 | 短回复（< 100字） | 长回复（> 500字） |

### 4.3 Streaming 实现

```typescript
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

### 4.4 Streaming 数据格式

API 返回的流式数据格式：

```
data: {"choices":[{"delta":{"content":"你"}},"finish_reason":null}]}

data: {"choices":[{"delta":{"content":"好"},"finish_reason":null}]}

data: {"choices":[{"delta":{"content":"！"},"finish_reason":null}]}

data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
```

每行以 `data: ` 开头，最后一行 `finish_reason` 不为 null，表示流结束。

### 4.5 动手实验

修改代码，对比有 streaming 和没有 streaming 的用户体验差异。

---

## 第 5 关：Temperature 参数调优

### 5.1 什么是 Temperature？

**Temperature = AI 的"创造力"参数**，取值范围通常是 0 到 2。

```typescript
// 0 = 最确定、最保守的输出
// 0.7 = 默认值，平衡创造性和确定性
// 2 = 最随机、最有创意（但可能胡说八八道）
```

### 5.2 Temperature 的数学原理

Temperature 控制输出概率分布的"平滑程度"：

- **T = 0**：选择概率最高的词（确定性最高）
- **T = 1**：按原始概率分布采样
- **T > 1**：概率分布变得"更平"，低概率词也有机会被选中

### 5.3 Temperature 效果对比

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

**预期输出对比**：

| Temperature | 特点 | 示例回答 |
|-------------|------|---------|
| 0.0 | 稳定、可预测 | "天空是蓝色的。" |
| 0.7 | 平衡、自然 | "天空通常是蓝色的，但在日落时可能变成橙红色。" |
| 1.5 | 创意、多样 | "这个问题很有趣！从物理学角度是蓝色，从诗人的角度看是无限..." |

### 5.4 Temperature 使用场景

| Temperature | 适用场景 | 原因 |
|-------------|---------|------|
| 0.0 - 0.3 | 代码生成、数学计算 | 需要确定性，不能有歧义 |
| 0.7 | 通用聊天、写作 | 平衡质量和多样性 |
| 1.0 - 1.5 | 头脑风暴、创意写作 | 需要多样性和创意 |
| > 1.5 | 实验性用途 | 可能产生无意义的输出 |

### 5.5 其他核心参数

```typescript
{
  model: 'deepseek-chat',
  messages: [...],
  temperature: 0.7,        // 创造力：0-2
  max_tokens: 1000,        // 最大输出长度（tokens）
  top_p: 0.9,              // 核采样：只考虑概率最高的 p%
  frequency_penalty: 0,    // 频率惩罚：重复词多了会降低概率
  presence_penalty: 0      // 存在惩罚：出现过的词降低概率，鼓励新词
}
```

> 💡 **调参建议**：先调 temperature，其他参数通常保持默认即可

### 5.6 动手实验

1. 用同一个问题，不同 temperature 值，观察输出差异
2. 用代码生成任务，测试 T=0 和 T=0.7 的区别
3. 用创意写作任务，测试 T=1.0 和 T=1.5 的区别

---

## 上下文编程（Context Programming）

### 什么是上下文编程？

**传统编程**：输入 → 函数 → 输出（无状态）

```typescript
// 传统方式：每次都是独立的请求
async function badExample() {
  await askAI('我姓张');      // AI 不记得上下文！
  await askAI('我姓什么？');
}
```

**上下文编程**：输入 + 历史上下文 → 函数 → 输出（有状态）

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

### 实践：Token 预算控制

```typescript
class BudgetedChatSession {
  private history: ChatMessage[];
  private maxTokens: number;
  private readonly API_URL = 'https://api.deepseek.com/chat/completions';

  constructor(systemPrompt: string, maxTokens = 4000) {
    this.history = [{ role: 'system', content: systemPrompt }];
    this.maxTokens = maxTokens;
  }

  async chat(userMessage: string): Promise<string> {
    this.history.push({ role: 'user', content: userMessage });

    // 预算超了？删除最早的非 system 消息
    while (this.countTokens() > this.maxTokens) {
      const idx = this.history.findIndex(
        (msg, i) => i > 0 && msg.role === 'user'
      );
      if (idx > 0) {
        this.history.splice(idx, 1);
      }
    }

    const response = await fetch(this.API_URL, {
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
    // 简化估算：1 token ≈ 4 characters
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
L01 LLM 多轮对话实现/
├── README.md              # 课程教案
├── src/
│   └── ai-chat.ts         # 可运行的 CLI 聊天工具
└── package.json
```

### 安装和运行

```bash
cd "L01 LLM 多轮对话实现"
npm install dotenv
npx ts-node src/ai-chat.ts
```

### 常见错误排查

| 错误 | 原因 | 解决 |
|------|------|------|
| 401 Unauthorized | API Key 错误 | 检查 `.env` 配置 |
| 429 Too Many Requests | 限流 | 稍等重试 |
| context length exceeded | 超出上下文长度 | 减少 history 或用滑动窗口 |
| 内容重复 | temperature 太低 | 调高 temperature |
| 内容随机 | temperature 太高 | 调低 temperature |

---

## 课后练习

1. **基础**：修改 CLI 程序，添加 `temperature` 参数支持
2. **进阶**：实现滑动窗口，只保留最近 5 轮对话
3. **挑战**：添加 streaming 支持，实时显示 AI 回复

---

## 下一步学习

- **L02**: Tool Use - 让 AI 调用外部工具
- **L03**: Prompt Engineering - 更高级的提示词技巧
- **L04**: Agent 配置 - 使用配置文件管理 AI 行为
