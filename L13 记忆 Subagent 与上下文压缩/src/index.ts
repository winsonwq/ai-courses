import dotenv from 'dotenv';
import path from 'path';
import type { ToolCall } from './tools/types';
import type { Message } from './llm/types';
import { addMessage, getMessages } from './memory/store';
import { buildInjectedMessages } from './memory/inject';
import { runCompress } from './memory/compress';
import { getCoordinator } from './agents/registry';
import { runStep } from './llm/client';
import { createToolHandler } from './tools/executor';
import { loadMessageDetailSchema, executeLoadMessageDetail } from './tools/load-message-detail';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const COMPRESS_EVERY_N_MESSAGES = 6;
const INJECT_MAX_MESSAGES = 30;

function messageId(): string {
  return String(Date.now());
}

function toRecord(role: string, content: string, extra?: Partial<import('./memory/types').MessageRecord>): import('./memory/types').MessageRecord {
  const id = messageId();
  return {
    id,
    timestamp: new Date().toISOString(),
    role,
    content,
    ...extra,
  };
}

type ToolCallHandler = (toolCalls: ToolCall[]) => Promise<Message[]>;

async function main() {
  const coordinator = getCoordinator();
  const toolExecutor = createToolHandler({
    loadMessageDetail: (args) => executeLoadMessageDetail({ messageId: args.messageId }),
  });

  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('--- L13 记忆 Subagent 与上下文压缩 ---');
  console.log('输入 exit 退出\n');

  while (true) {
    const userInput = await new Promise<string>((resolve) => rl.question('User: ', resolve));
    if (userInput.toLowerCase() === 'exit') break;

    addMessage(toRecord('user', userInput));

    let messages: Message[] = [
      { role: 'system', content: coordinator.systemPrompt },
      ...buildInjectedMessages({ maxMessages: INJECT_MAX_MESSAGES }),
    ];

    const tools = coordinator.tools;

    while (true) {
      const reply = await runStep(messages, tools);
      messages.push(reply);

      if (reply.content) {
        const preview = String(reply.content).slice(0, 80);
        console.log(`\nAI: ${preview}${reply.content.length > 80 ? '...' : ''}`);
      }

      if (!reply.tool_calls || reply.tool_calls.length === 0) {
        addMessage(toRecord('assistant', String(reply.content ?? '')));
        break;
      }

      for (const tc of reply.tool_calls) {
        console.log(`Tool: ${tc.function.name}(${tc.function.arguments?.slice(0, 60) ?? ''}...)`);
      }
      const toolResults = await toolExecutor(reply.tool_calls);
      messages.push(...toolResults);
    }

    const total = getMessages().length;
    if (total >= COMPRESS_EVERY_N_MESSAGES) {
      const compressed = await runCompress({ takeCount: 6 });
      if (compressed) console.log('\n[已压缩一段对话为记忆]');
    }
  }

  rl.close();
}

main();
