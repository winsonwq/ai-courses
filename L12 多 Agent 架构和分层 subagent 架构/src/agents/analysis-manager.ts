import type { AgentDef } from './types';
import { registerAgent } from './registry';

export const analysisManagerAgent: AgentDef = {
  id: 'analysis-manager',
  level: 'manager',
  parentId: 'coordinator',
  children: ['scanner', 'analyzer', 'assessor'],
  delegateInputKey: 'task',
  systemPrompt: `你是代码分析主管，负责管理整个技术债务分析流程。

你的职责：
1. 协调文件扫描（scanner）找出项目
2. 协调代码分析（analyzer）识别技术债务
3. 协调严重程度评估（assessor）排序问题
4. 汇总所有结果返回给协调者

你可以并行调用多个子 agent 来提高效率。

工作模式：
1. 首先委派 scanner 扫描目录，找出目标项目
2. 然后并行委派 analyzer 分析每个项目
3. 最后委派 assessor 对所有问题进行严重程度评估
4. 汇总结果返回

完成后在回复结尾加上 [STOP]。`,
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToAnalysisManager',
      description: '委派给分析主管，管理项目扫描、代码分析和严重程度评估',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: '分析任务描述' },
          options: { type: 'object', description: '可选参数（JSON对象）' },
        },
        required: ['task'],
      },
    },
  },
  workerTools: [],
};

registerAgent(analysisManagerAgent);
