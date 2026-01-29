import dotenv from 'dotenv';
import path from 'path';
import type { ToolCall } from './tools/types';
import { createToolHandler, primitiveExecutorMap } from './tools/executor';
import { coordinatorTools, getAgentById, createCoordinatorToolHandler } from './agents/registry';
import type { Message } from './llm/types';
import { runStep } from './llm/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

type ToolCallHandler = (toolCalls: ToolCall[]) => Promise<Message[]>;

const TAB = '\t';

async function runWorkerAgent(
  workerType: 'file' | 'translate',
  userQuery: string
): Promise<string> {
  const agent = getAgentById(workerType);
  if (!agent) throw new Error(`Unknown agent: ${workerType}`);

  const handleWorkerToolCalls = createToolHandler(primitiveExecutorMap);

  const messages: Message[] = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: userQuery },
  ];

  const prefix = TAB;
  console.log(`\n${prefix}[${workerType} Agent]`);
  await runAgentLoop(messages, agent.workerTools, handleWorkerToolCalls, 1);

  const last = messages[messages.length - 1];
  const content = last?.content ?? '';
  return content.replace(/\[STOP\]/g, '').trim();
}

async function runAgentLoop(
  messages: Message[],
  tools: any[],
  handleToolCalls: ToolCallHandler,
  depth = 0
): Promise<void> {
  const prefix = TAB.repeat(depth);

  while (true) {
    const message = await runStep(messages, tools);
    messages.push(message);

    if (message.content && message.role === 'assistant') {
      const raw = String(message.content);
      const maxLen = 80;
      const toShow = raw.length > maxLen ? raw.slice(0, maxLen) + '...' : raw;
      const lines = toShow.split('\n');
      const indented = lines.map((line, i) => (i === 0 ? line : prefix + line)).join('\n');
      console.log(`\n${prefix}AI: ${indented}`);
    }

    if (message.content && message.content.includes('[STOP]')) {
      break;
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const tc of message.tool_calls) {
        const args = tc.function.arguments?.trim() || '{}';
        const argsShort = args.length > 80 ? args.slice(0, 77) + '...' : args;
        console.log(`${prefix}Tool: ${tc.function.name}(${argsShort})`);
      }
      const toolResults = await handleToolCalls(message.tool_calls);
      if (depth >= 1) {
        for (const tr of toolResults) {
          const content = String(tr.content ?? '');
          const short = content.length > 100 ? content.slice(0, 97) + '...' : content;
          console.log(`${prefix}  → ${short.replace(/\n/g, ' ')}`);
        }
      }
      messages.push(...toolResults);
    }
  }
}

async function runMultiAgentWorkflow(messages: Message[]): Promise<void> {
  const handleCoordinatorToolCalls = createCoordinatorToolHandler(runWorkerAgent);
  await runAgentLoop(messages, coordinatorTools, handleCoordinatorToolCalls);
}

async function main() {
  const systemPrompt =
    '你是协调者助手。根据用户请求，决定委派给哪个专家 Agent（本地文件/只读 Shell、翻译/润色/摘要）。\n' +
    '委派后根据子 Agent 的返回结果整理回复用户。任务完成后在回复结尾加上 [STOP]。';

  const messages: Message[] = [{ role: 'system', content: systemPrompt }];

  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('--- 多 Agents 工作流（Coordinator + Worker）---');

  while (true) {
    const userInput = await new Promise<string>((resolve) => rl.question('\nUser: ', resolve));
    if (userInput.toLowerCase() === 'exit') break;

    messages.push({ role: 'user', content: userInput });
    await runMultiAgentWorkflow(messages);
  }
  rl.close();
}

main();
