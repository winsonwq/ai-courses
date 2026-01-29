import type { AgentDef } from './types';
import { workerRunSafeShellTool } from '../tools/file';

export const fileAgent: AgentDef = {
  id: 'file',
  workerTools: [workerRunSafeShellTool],
  delegateInputKey: 'query',
  systemPrompt:
    '你是本地 Shell 助手，支持读和写。读：ls、cat、head、tail、grep、find 等；写：echo "内容" > 文件（覆盖）、echo "内容" >> 文件（追加）。\n' +
    '严禁执行任何删除文件/目录的操作（如 rm、del）；若用户要求删除，必须拒绝并说明本 Agent 不支持删除。完成后在回复结尾加上 [STOP]。',
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToFileAgent',
      description: '将读/写文件、列目录、执行 shell 等请求交给文件 Agent 处理（通过 shell 完成，支持 > / >> 写文件）。不支持删除操作。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '用户关于读文件、列目录或执行 shell 的请求' },
        },
        required: ['query'],
      },
    },
  },
};
