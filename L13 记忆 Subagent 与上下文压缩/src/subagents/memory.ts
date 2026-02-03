import { runStep } from '../llm/client';
import type { MessageRecord } from '../memory/types';

const MEMORY_SYSTEM_PROMPT = `你是记忆压缩专家。你的任务是将一段对话历史压缩成一条简洁的「记忆」摘要。

规则：
1. 摘要应保留：关键事实、用户偏好、已做决策、重要结论。省略寒暄与重复。
2. 用第三人称或客观陈述，例如「用户表示…」「双方确认…」。
3. 必须输出与原始消息的索引：即这段对话中每条消息的 id 列表，用于后续按需加载原文。
4. 输出格式为 JSON，且仅输出该 JSON，不要其他文字：
   {"summary": "你的摘要内容", "messageIds": ["id1", "id2", ...]}

其中 messageIds 必须与输入中每条消息的 id 一一对应、顺序一致。`;

/**
 * 将一段 messages 压缩成一条记忆：调用 LLM 生成 summary + messageIds
 */
export async function compressToMemory(messages: MessageRecord[]): Promise<{
  summary: string;
  messageIds: string[];
}> {
  const content = messages
    .map((m) => `[id=${m.id}] [${m.role}]\n${m.content}`)
    .join('\n\n');

  const msgs = [
    { role: 'system' as const, content: MEMORY_SYSTEM_PROMPT },
    { role: 'user' as const, content: `请将以下对话压缩为一条记忆（JSON 格式）：\n\n${content}` },
  ];

  const response = await runStep(msgs, []);
  let text = (response.content || '').trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];

  try {
    const parsed = JSON.parse(text) as { summary?: string; messageIds?: string[] };
    const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
    const messageIds = Array.isArray(parsed.messageIds)
      ? parsed.messageIds.filter((x): x is string => typeof x === 'string')
      : messages.map((m) => m.id);
    return { summary, messageIds };
  } catch {
    return {
      summary: text || '（压缩失败，保留原文索引）',
      messageIds: messages.map((m) => m.id),
    };
  }
}

/**
 * 合并多条记忆的摘要（用于 merge）：输入为多条 memory 的 content，输出合并后的摘要
 */
export async function mergeMemorySummaries(summaries: string[]): Promise<string> {
  const content = summaries.map((s, i) => `[${i + 1}]\n${s}`).join('\n\n');
  const msgs = [
    { role: 'system' as const, content: '将以下多条记忆摘要合并为一条更简洁的摘要，保留关键信息。只输出合并后的摘要文本，不要 JSON。' },
    { role: 'user' as const, content },
  ];
  const response = await runStep(msgs, []);
  return (response.content || '').trim() || summaries.join('\n');
}
