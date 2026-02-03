import type { InjectOptions } from './types';
import { getMessages } from './store';
import { getActiveMemories } from './store';
import type { Message } from '../llm/types';

const CHARS_PER_TOKEN = 4;

function sliceByOptions(
  messages: Array<{ id: string; timestamp: string; content: string }>,
  options?: InjectOptions
): Array<{ id: string; timestamp: string; content: string; role: string }> {
  if (!options || (!options.maxMessages && !options.maxTokens && !options.timeWindowMs)) {
    return messages as Array<{ id: string; timestamp: string; content: string; role: string }>;
  }
  let start = 0;
  if (options.maxMessages != null && options.maxMessages > 0) {
    start = Math.max(0, messages.length - options.maxMessages);
  }
  if (options.timeWindowMs != null && options.timeWindowMs > 0 && messages.length > 0) {
    const lastTs = new Date(messages[messages.length - 1].timestamp).getTime();
    const cutoff = lastTs - options.timeWindowMs;
    const fromTime = messages.findIndex((m) => new Date(m.timestamp).getTime() >= cutoff);
    if (fromTime >= 0) start = Math.max(start, fromTime);
  }
  let out = messages.slice(start) as Array<{ id: string; timestamp: string; content: string; role: string }>;
  if (options.maxTokens != null && options.maxTokens > 0) {
    let tokens = 0;
    let i = out.length - 1;
    while (i >= 0 && tokens < options.maxTokens) {
      tokens += Math.ceil((out[i].content?.length ?? 0) / CHARS_PER_TOKEN);
      i--;
    }
    out = out.slice(Math.max(0, i + 1));
  }
  return out;
}

/**
 * 动态注入：能用记忆替代的区间用记忆摘要，否则用原始 message。
 * 返回供 runStep 使用的 Message[]（仅 role + content，tool 消息由调用方按需保留）。
 */
export function buildInjectedMessages(options?: InjectOptions): Message[] {
  const allMessages = getMessages();
  const activeMemories = getActiveMemories();
  const toInject = sliceByOptions(allMessages, options);

  const messageIdSetByMemory = new Map<string, Set<string>>();
  for (const m of activeMemories) {
    messageIdSetByMemory.set(m.id, new Set(m.messageIds));
  }

  const injected: Message[] = [];
  const usedMemoryIds = new Set<string>();

  for (let i = 0; i < toInject.length; i++) {
    const msg = toInject[i];
    const mid = msg.id;

    let coveredBy: { memoryId: string; content: string } | null = null;
    for (const mem of activeMemories) {
      if (usedMemoryIds.has(mem.id)) continue;
      const set = messageIdSetByMemory.get(mem.id);
      if (set?.has(mid)) {
        coveredBy = { memoryId: mem.id, content: mem.content };
        break;
      }
    }

    if (coveredBy) {
      usedMemoryIds.add(coveredBy.memoryId);
      injected.push({
        role: 'user',
        content: `[记忆摘要]\n${coveredBy.content}`,
      });
      const mem = activeMemories.find((m) => m.id === coveredBy!.memoryId);
      if (mem) {
        const skipSet = messageIdSetByMemory.get(mem.id);
        while (i + 1 < toInject.length && skipSet?.has(toInject[i + 1].id)) {
          i++;
        }
      }
    } else {
      injected.push({
        role: msg.role,
        content: msg.content,
        tool_calls: (msg as any).tool_calls,
        tool_call_id: (msg as any).tool_call_id,
      });
    }
  }

  return injected;
}
