import type { AgentDef } from './types';
import { registerAgent } from './registry';

export const coordinatorAgent: AgentDef = {
  id: 'coordinator',
  level: 'coordinator',
  children: ['analysis-manager', 'report-manager'],
  delegateInputKey: 'task',
  systemPrompt: `你是技术债务分析系统的顶层协调者。

你的职责：
1. 理解用户的分析需求
2. 将任务委派给分析主管（analysis-manager）
3. 汇总分析结果，生成最终报告
4. 必要时协调报告生成

工作流程：
1. 用户提出分析需求
2. 调用 analysis-manager 执行分析
3. 获取分析结果后，调用 report-manager 生成报告
4. 返回最终报告给用户

完成后在回复结尾加上 [STOP]。`,
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToCoordinator',
      description: '顶层协调者的内部委派工具',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: '委派的任务描述' },
          options: { type: 'object', description: '可选参数' },
        },
        required: ['task'],
      },
    },
  },
  workerTools: [],
};

registerAgent(coordinatorAgent);
