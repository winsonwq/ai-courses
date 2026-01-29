import type { ToolCall, ToolMessage, ToolExecutorMap } from './types';
import { executeRunSafeShell } from './file';
import {
  executeTranslate,
  executePolish,
  executeSummarize,
} from './translate';

export const primitiveExecutorMap: ToolExecutorMap = {
  runSafeShell: (args) => executeRunSafeShell(args as { command: string }),
  translate: (args) => executeTranslate(args as { text: string; targetLang: string }),
  polish: (args) => executePolish(args as { text: string }),
  summarize: (args) => executeSummarize(args as { text: string; maxLength?: string }),
};

export function executePrimitiveTool(name: string, args: Record<string, string>): string {
  const fn = primitiveExecutorMap[name];
  if (fn) return fn(args) as string;
  return `未知工具: ${name}`;
}

export function createToolHandler(executorMap: ToolExecutorMap) {
  return async (toolCalls: ToolCall[]): Promise<ToolMessage[]> => {
    const results: ToolMessage[] = [];
    for (const tc of toolCalls) {
      const name = tc.function.name;
      const args = (JSON.parse(tc.function.arguments) || {}) as Record<string, string>;
      const fn = executorMap[name];
      const result = fn
        ? await Promise.resolve(fn(args))
        : `未知工具或委派: ${name}`;
      results.push({ role: 'tool', content: result, tool_call_id: tc.id });
    }
    return results;
  };
}
