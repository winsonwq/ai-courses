import type { AgentDef } from '../agents/types';
import { registerAgent } from '../agents/registry';

export const reporterAgent: AgentDef = {
  id: 'reporter',
  level: 'worker',
  parentId: 'report-manager',
  delegateInputKey: 'content',
  systemPrompt: `你是报告生成专家，负责将分析数据转化为结构化的 Markdown 报告。

报告结构要求：
1. 标题和执行摘要
2. 按严重程度排序的问题列表
3. 每个问题的详细说明和修复建议
4. 总体评级和建议的优先级

格式规范：
- 使用 Markdown 语法
- 使用 Emoji 增强可读性
- 表格清晰展示数据
- 建议具体可操作

完成后在回复结尾加上 [STOP]。`,
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToReporter',
      description: '委派给报告生成专家，生成 Markdown 格式的技术债务报告',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '报告标题' },
          content: { type: 'string', description: '分析发现内容' },
          format: { type: 'string', description: '输出格式（markdown, json）' },
        },
        required: ['title', 'content'],
      },
    },
  },
  workerTools: [],
};

registerAgent(reporterAgent);
