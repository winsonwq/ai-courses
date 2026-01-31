import type { AgentDef } from '../agents/types';
import { registerAgent } from '../agents/registry';
import { workerRunSafeShellTool } from '../tools/file';

export const scannerAgent: AgentDef = {
  id: 'scanner',
  level: 'worker',
  parentId: 'analysis-manager',
  delegateInputKey: 'directory',
  systemPrompt: `你是文件扫描专家，负责在指定目录下搜索和识别目标项目。

你只能使用以下工具：
- runSafeShell: 执行安全的 Shell 命令（ls, find, grep 等）

任务示例：
1. 扫描 ~/projects 目录下所有包含 package.json 的项目
2. 找出所有包含特定关键词的文件
3. 列出目录结构

注意：
- 只读操作，不执行删除
- 返回清晰的项目列表

完成后在回复结尾加上 [STOP]。`,
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToScanner',
      description: '委派给文件扫描专家，扫描目录并识别项目',
      parameters: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: '要扫描的目录路径' },
          filter: { type: 'string', description: '过滤条件（如文件名包含什么）' },
        },
        required: ['directory'],
      },
    },
  },
  workerTools: [workerRunSafeShellTool],
};

registerAgent(scannerAgent);
