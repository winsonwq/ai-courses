import type { ToolCall, ToolMessage, ToolExecutorMap } from './types';

export function createToolHandler(executorMap: ToolExecutorMap) {
  return async (toolCalls: ToolCall[]): Promise<ToolMessage[]> => {
    const results: ToolMessage[] = [];
    for (const tc of toolCalls) {
      const name = tc.function.name;
      const args = (JSON.parse(tc.function.arguments || '{}') || {}) as Record<string, string>;
      const fn = executorMap[name];
      const result = fn
        ? await Promise.resolve(fn(args))
        : `未知工具: ${name}`;
      results.push({ role: 'tool', content: result, tool_call_id: tc.id });
    }
    return results;
  };
}
