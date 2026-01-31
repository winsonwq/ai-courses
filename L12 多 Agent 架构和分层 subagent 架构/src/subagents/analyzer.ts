import type { AgentDef } from '../agents/types';
import { registerAgent } from '../agents/registry';
import { workerRunSafeShellTool } from '../tools/file';

export const analyzerAgent: AgentDef = {
  id: 'analyzer',
  level: 'worker',
  parentId: 'analysis-manager',
  delegateInputKey: 'project',
  systemPrompt: `你是代码分析专家，负责对单个项目进行技术债务分析。

你只能使用以下工具：
- runSafeShell: 执行安全的 Shell 命令

分析维度：
1. 代码复杂度（行数、文件数）
2. 潜在问题（过时的依赖、硬编码值、缺少注释）
3. 代码结构（目录层级、模块划分）

工作流程：
1. 进入项目目录
2. 执行代码统计（cloc 或类似工具）
3. 检查关键文件（package.json, 配置文件等）
4. 识别潜在的技术债务
5. 按严重程度分类：高/中/低

完成后在回复结尾加上 [STOP]。`,
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToAnalyzer',
      description: '委派给代码分析专家，分析单个项目的技术债务',
      parameters: {
        type: 'object',
        properties: {
          project: { type: 'string', description: '项目路径' },
          focus: { type: 'string', description: '分析重点（如 tech-debt, security, quality）' },
        },
        required: ['project'],
      },
    },
  },
  workerTools: [workerRunSafeShellTool],
};

registerAgent(analyzerAgent);
