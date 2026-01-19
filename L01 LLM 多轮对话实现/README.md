# 01-LLM 多轮对话实现

从 0 开始构建一个**有记忆的命令行 AI 聊天工具**，掌握大语言模型 API 的核心概念。

## 课程内容

### 第 1 关：发送你的第一个请求

```typescript
import dotenv from 'dotenv';
dotenv.config();

const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: '你好' }]
  })
});

const result = await response.json();
console.log(result.choices[0].message.content);
```

### 第 2 关：理解消息角色

| 角色 | 说明 | 特点 |
|------|------|------|
| `system` | AI 的人设/规则 | 只在开头设置一次 |
| `user` | 用户的提问 | 可以有多轮 |
| `assistant` | AI 的回复 | 记录到历史中 |

**System Message = 性格 + 规则 + 边界**：

```typescript
// 好的实践：明确的系统提示词
const messages = [
  { role: 'system', content: '你是一个专业翻译，保持原文语气。' },
  { role: 'user', content: '翻译：Hello World' }
];
```

### 第 3 关：实现多轮对话记忆

**关键**：每次请求发送完整的历史对话，AI 靠上下文记住信息。

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class ChatSession {
  private history: ChatMessage[];

  constructor(systemPrompt: string) {
    this.history = [{ role: 'system', content: systemPrompt }];
  }

  async ask(userMessage: string): Promise<string> {
    this.history.push({ role: 'user', content: userMessage });

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: this.history
      })
    });

    const result = await response.json();
    const reply = result.choices[0].message.content;
    this.history.push({ role: 'assistant', content: reply });

    return reply;
  }
}
```

### 第 4 关：Streaming 实时响应

| 特性 | 非 Streaming | Streaming |
|------|--------------|-----------|
| 响应时间 | 全部生成后返回 | 边生成边返回 |
| 用户体验 | 等待时间长 | 实时看到输出 |

```typescript
const response = await fetch(url, {
  body: JSON.stringify({ ...data, stream: true }),
});

for await (const chunk of response.body!) {
  const line = chunk.toString();
  if (line.startsWith('data: ')) {
    const content = JSON.parse(line.slice(6)).choices[0].delta.content;
    process.stdout.write(content);
  }
}
```

### 第 5 关：Temperature 参数

| Temperature | 特点 | 适用场景 |
|-------------|------|---------|
| 0.0 - 0.3 | 稳定、可预测 | 代码、数学 |
| 0.7 | 平衡 | 通用聊天 |
| 1.0 - 1.5 | 创意、多样 | 头脑风暴 |

## 上下文编程

**传统方式**：每次独立请求，AI 不记得上下文

```typescript
await askAI('我姓张');
await askAI('我姓什么？'); // AI 不记得！
```

**上下文编程**：携带历史记录

```typescript
let history: ChatMessage[] = [];
history.push({ role: 'user', content: '我姓张' });
await askAI(history);
history.push({ role: 'user', content: '我姓什么？' });
await askAI(history); // AI 记得！
```

核心思想：
1. 状态外置：历史由程序管理
2. 完整传递：每次发送完整上下文
3. 成本意识：上下文越长，费用越高

## 实战项目

运行命令行聊天工具：

```bash
npm install dotenv
npx ts-node src/ai-chat.ts
```

```bash
$ npx ts-node src/ai-chat.ts
========================================
  AI 聊天工具 (输入 /exit 退出)
========================================

🤖 你: 你好，我叫小明
👤 AI: 你好小明！很高兴认识你。

🤖 你: 我叫什么名字？
👤 AI: 你叫小明呀！

🤖 You: /exit
👋 再见！
```

## 核心概念清单

- [ ] 理解 `messages` 数组结构
- [ ] 区分 `system/user/assistant` 三种角色
- [ ] 实现历史对话的记忆
- [ ] 理解 streaming vs 非 streaming
- [ ] 掌握 `temperature` 参数调节
- [ ] 理解"上下文编程"的概念

## 下一步

- L02: Tool Use - 让 AI 调用外部工具
- L03: Prompt Engineering - 高级提示词技巧
- L04: Agent 配置 - 使用配置文件管理 AI
