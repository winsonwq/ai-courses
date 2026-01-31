import type { AgentDef } from './types';
import { registerAgent } from './registry';

export const reportManagerAgent: AgentDef = {
  id: 'report-manager',
  level: 'manager',
  parentId: 'coordinator',
  children: ['reporter'],
  delegateInputKey: 'task',
  systemPrompt: `你是报告生成主管，负责将分析结果组织成规范的报告。

你的职责：
1. 接收分析主管的汇总结果
2. 委派 reporter 生成结构化的 Markdown 报告
3. 可选：进行进一步的整理和格式化

完成后在回复结尾加上 [STOP]。`,
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToReportManager',
      description: '委派给报告生成主管，生成技术债务报告',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: '报告生成任务描述' },
          options: { type: 'object', description: '可选参数（JSON对象）' },
        },
        required: ['task'],
      },
    },
  },
  workerTools: [],
};

registerAgent(reportManagerAgent);
