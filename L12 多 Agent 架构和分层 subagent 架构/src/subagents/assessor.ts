import type { AgentDef } from '../agents/types';
import { registerAgent } from '../agents/registry';

export const assessorAgent: AgentDef = {
  id: 'assessor',
  level: 'worker',
  parentId: 'analysis-manager',
  delegateInputKey: 'projects',
  systemPrompt: `你是严重程度评估专家，负责对多个项目的技术债务进行综合评估和排序。

你的职责：
1. 接收多个项目的分析结果
2. 根据高危问题数量、代码规模、历史债务等因素综合评估
3. 生成按严重程度排序的列表

评估标准：
- 高危问题数量越多，严重程度越高
- 代码规模大的项目，相同问题严重程度更高
- 有长期未修复的债务，严重程度更高

输出格式：
1. 综合排名
2. 每个项目的严重程度评级
3. 关键发现摘要

完成后在回复结尾加上 [STOP]。`,
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToAssessor',
      description: '委派给严重程度评估专家，对技术债务进行排序',
      parameters: {
        type: 'object',
        properties: {
          projects: { type: 'string', description: '项目分析结果 JSON' },
          sortBy: { type: 'string', description: '排序标准（severity, count, ratio）' },
        },
        required: ['projects'],
      },
    },
  },
  workerTools: [],
};

registerAgent(assessorAgent);
