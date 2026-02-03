import type { CoordinatorDef } from './types';
import { loadMessageDetailSchema } from '../tools/load-message-detail';

export const coordinatorDef: CoordinatorDef = {
  id: 'coordinator',
  systemPrompt: `你是带记忆的对话助手。你可以看到当前上下文中已有的「记忆摘要」和最近的对话。

当需要追究某段对话的具体细节时，使用 loadMessageDetail 工具，传入对应的 messageId，即可加载该条消息的原文。
回复时无需在结尾加 [STOP]。`,
  tools: [loadMessageDetailSchema],
};
