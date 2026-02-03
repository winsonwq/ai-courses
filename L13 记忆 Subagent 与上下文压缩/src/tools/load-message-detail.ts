import { getMessageById } from '../memory/store';
import type { ToolSchema } from './types';

export const loadMessageDetailSchema: ToolSchema = {
  type: 'function',
  function: {
    name: 'loadMessageDetail',
    description: '根据 messageId 加载该条消息的原文，用于追究具体细节',
    parameters: {
      type: 'object',
      properties: {
        messageId: { type: 'string', description: '消息 id（如时间戳格式）' },
      },
      required: ['messageId'],
    },
  },
};

export async function executeLoadMessageDetail(args: {
  messageId: string;
}): Promise<string> {
  const msg = getMessageById(args.messageId);
  if (!msg) return `未找到 id 为 "${args.messageId}" 的消息。`;
  return `[${msg.role}] ${msg.content}`;
}
