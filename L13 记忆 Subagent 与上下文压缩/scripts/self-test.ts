/**
 * 自测：注入逻辑、store、loadMessageDetail
 * 不调用真实 LLM，仅测内存存储与注入算法
 */
import {
  clearStore,
  addMessage,
  addMemory,
  getMessageById,
  getMessages,
  getActiveMemories,
} from '../src/memory/store';
import { buildInjectedMessages } from '../src/memory/inject';
import { executeLoadMessageDetail } from '../src/tools/load-message-detail';

function messageId(seq: number): string {
  return `2025010111000${seq}`;
}

async function main() {
  clearStore();

  // 1. 写入 6 条 message
  for (let i = 1; i <= 6; i++) {
    addMessage({
      id: messageId(i),
      timestamp: new Date().toISOString(),
      role: i % 2 === 1 ? 'user' : 'assistant',
      content: `消息内容 ${i}`,
    });
  }

  const all = getMessages();
  if (all.length !== 6) {
    console.error('FAIL: 期望 6 条 message，实际', all.length);
    process.exit(1);
  }

  // 2. 添加一条记忆，覆盖前 3 条 message
  addMemory({
    id: 'mem_1',
    content: '摘要：用户与助手进行了前三轮对话。',
    messageIds: [messageId(1), messageId(2), messageId(3)],
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  // 3. 注入后应得到：1 条记忆摘要 + 3 条原始 message（id 4,5,6）
  const injected = buildInjectedMessages({ maxMessages: 10 });
  const hasMemorySummary = injected.some((m) => String(m.content).startsWith('[记忆摘要]'));
  const memorySummaryCount = injected.filter((m) => String(m.content).startsWith('[记忆摘要]')).length;

  if (!hasMemorySummary) {
    console.error('FAIL: 注入结果中应包含至少一条记忆摘要');
    process.exit(1);
  }
  if (memorySummaryCount !== 1) {
    console.error('FAIL: 应只有 1 条记忆摘要，实际', memorySummaryCount);
    process.exit(1);
  }

  // 注入后条数应少于全量（一段被记忆替代）
  if (injected.length >= all.length) {
    console.error('FAIL: 注入后条数应少于全量 message，实际', injected.length, '>=', all.length);
    process.exit(1);
  }

  // 4. loadMessageDetail 能按 id 取回原文
  const detail = await executeLoadMessageDetail({ messageId: messageId(1) });
  if (!detail.includes('消息内容 1')) {
    console.error('FAIL: loadMessageDetail 应返回原文，得到', detail);
    process.exit(1);
  }

  const notFound = await executeLoadMessageDetail({ messageId: 'nonexistent' });
  if (!notFound.includes('未找到')) {
    console.error('FAIL: 不存在的 id 应返回未找到提示，得到', notFound);
    process.exit(1);
  }

  console.log('Self-test passed: store, inject, loadMessageDetail.');
}

main();
