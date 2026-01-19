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
