/**
 * Message 扩展：增加 id、timestamp，用于与 Memory 建立索引
 */
export interface MessageRecord {
  id: string;
  timestamp: string;
  role: string;
  content: string;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
}

/**
 * 记忆状态：仅 active 参与注入；合并后被合并的为 inactive
 */
export type MemoryStatus = 'active' | 'inactive';

export interface Memory {
  id: string;
  content: string;
  messageIds: string[];
  status: MemoryStatus;
  createdAt: string;
  mergedIntoId?: string;
}

/**
 * 注入约束：条数、估算 token、或时间窗口（毫秒）
 */
export interface InjectOptions {
  maxMessages?: number;
  maxTokens?: number;
  timeWindowMs?: number;
}
