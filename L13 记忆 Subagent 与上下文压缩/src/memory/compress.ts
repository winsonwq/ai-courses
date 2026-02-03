import { getMessages, getActiveMemories, addMemory, updateMemoryMergedInto } from './store';
import type { Memory } from './types';
import { compressToMemory, mergeMemorySummaries } from '../subagents/memory';

/**
 * 取尚未被任何 active memory 覆盖的、最早的一段 messages（按顺序最多 takeCount 条）
 */
function getUncompressedMessages(takeCount: number): import('./types').MessageRecord[] {
  const messages = getMessages();
  const active = getActiveMemories();
  const covered = new Set<string>();
  for (const m of active) {
    for (const id of m.messageIds) covered.add(id);
  }
  const uncompressed: import('./types').MessageRecord[] = [];
  for (const msg of messages) {
    if (covered.has(msg.id)) continue;
    uncompressed.push(msg);
    if (uncompressed.length >= takeCount) break;
  }
  return uncompressed;
}

/** 未被任何 active memory 覆盖的消息数量（用于决定是否触发压缩） */
export function getUncompressedCount(): number {
  return getUncompressedMessages(Number.MAX_SAFE_INTEGER).length;
}

/**
 * 生成一条新记忆的 id
 */
function nextMemoryId(): string {
  return `mem_${Date.now()}`;
}

/**
 * 触发压缩：取一段未压缩的 messages，调用 memory subagent，写入 store
 */
export async function runCompress(options?: { takeCount?: number }): Promise<Memory | null> {
  const takeCount = options?.takeCount ?? 6;
  const toCompress = getUncompressedMessages(takeCount);
  if (toCompress.length === 0) return null;

  const { summary, messageIds } = await compressToMemory(toCompress);
  const memory: Memory = {
    id: nextMemoryId(),
    content: summary,
    messageIds,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  addMemory(memory);
  return memory;
}

/**
 * 合并多条 active 记忆为一条（如按时间相邻的若干条）
 */
export async function runMerge(memoryIds: string[]): Promise<Memory | null> {
  const all = getActiveMemories();
  const toMerge = memoryIds.map((id) => all.find((m) => m.id === id)).filter(Boolean) as Memory[];
  if (toMerge.length < 2) return null;

  const mergedContent = await mergeMemorySummaries(toMerge.map((m) => m.content));
  const mergedMessageIds = Array.from(
    new Set(toMerge.flatMap((m) => m.messageIds))
  );

  const newMemory: Memory = {
    id: nextMemoryId(),
    content: mergedContent,
    messageIds: mergedMessageIds,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  addMemory(newMemory);

  for (const m of toMerge) {
    updateMemoryMergedInto(m.id, newMemory.id);
  }
  return newMemory;
}
