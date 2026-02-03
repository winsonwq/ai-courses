import type { MessageRecord, Memory } from './types';

const messages: MessageRecord[] = [];
const memories: Memory[] = [];

export function addMessage(msg: MessageRecord): void {
  messages.push(msg);
}

export function getMessages(): MessageRecord[] {
  return [...messages];
}

export function getMessageById(id: string): MessageRecord | undefined {
  return messages.find((m) => m.id === id);
}

export function addMemory(memory: Memory): void {
  memories.push(memory);
}

export function getActiveMemories(): Memory[] {
  return memories.filter((m) => m.status === 'active');
}

export function getAllMemories(): Memory[] {
  return [...memories];
}

export function getMemoryById(id: string): Memory | undefined {
  return memories.find((m) => m.id === id);
}

export function deactivateMemories(ids: string[]): void {
  for (const m of memories) {
    if (ids.includes(m.id)) m.status = 'inactive';
  }
}

export function updateMemoryMergedInto(memoryId: string, mergedIntoId: string): void {
  const m = memories.find((x) => x.id === memoryId);
  if (m) {
    m.status = 'inactive';
    m.mergedIntoId = mergedIntoId;
  }
}

export function clearStore(): void {
  messages.length = 0;
  memories.length = 0;
}
