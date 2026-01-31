import dotenv from 'dotenv';
import path from 'path';
import type { ToolCall } from './tools/types';
import { createToolHandler, primitiveExecutorMap } from './tools/executor';
import { getAgentById, getAllSubAgentSchemas, createSubAgentToolHandler, getRootCoordinator } from './agents/registry';
import type { Message } from './llm/types';
import { runStep } from './llm/client';
import './agents/coordinator';
import './agents/analysis-manager';
import './agents/report-manager';
import './subagents';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

type ToolCallHandler = (toolCalls: ToolCall[]) => Promise<Message[]>;

const TAB = '\t';

async function runSubAgent(
  agentId: string,
  task: string,
  options?: Record<string, any>
): Promise<string> {
  const agent = getAgentById(agentId as any);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  const handleWorkerToolCalls = createToolHandler(primitiveExecutorMap);

  let fullTask = task;
  if (options && Object.keys(options).length > 0) {
    const optionsStr = JSON.stringify(options, null, 2);
    fullTask = `${task}\n\nOptions:\n${optionsStr}`;
  }

  const messages: Message[] = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: fullTask },
  ];

  const levelPrefix = agent.level === 'coordinator' ? '' :
                      agent.level === 'manager' ? TAB :
                      TAB.repeat(2);
  console.log(`\n${levelPrefix}[${agent.level.toUpperCase()}] ${agent.id}`);

  const tools = agent.level === 'worker' ? agent.workerTools : getAllSubAgentSchemas();
  await runAgentLoop(messages, tools, handleWorkerToolCalls, agent.level === 'worker' ? 2 : 1);

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

async function runHierarchicalWorkflow(messages: Message[]): Promise<void> {
  const handleSubAgentCalls = createSubAgentToolHandler(runSubAgent);
  const coordinator = getRootCoordinator();
  const tools = coordinator ? [coordinator.delegateSchema, ...getAllSubAgentSchemas()] : getAllSubAgentSchemas();
  await runAgentLoop(messages, tools, handleSubAgentCalls);
}

async function main() {
  const coordinator = getRootCoordinator();
  if (!coordinator) {
    console.error('Coordinator not found!');
    process.exit(1);
  }

  const messages: Message[] = [{ role: 'system', content: coordinator.systemPrompt }];

  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('--- 分层 Subagent 架构（Hierarchical Subagents）---');
  console.log('层级：Coordinator → Manager → Worker');
  console.log('输入 exit 退出\n');

  while (true) {
    const userInput = await new Promise<string>((resolve) => rl.question('User: ', resolve));
    if (userInput.toLowerCase() === 'exit') break;

    messages.push({ role: 'user', content: userInput });
    await runHierarchicalWorkflow(messages);
  }
  rl.close();
}

main();
