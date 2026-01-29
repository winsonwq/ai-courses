import type { AgentDef } from './types';
import {
  workerTranslateTool,
  workerPolishTool,
  workerSummarizeTool,
} from '../tools/translate';

export const translateAgent: AgentDef = {
  id: 'translate',
  workerTools: [workerTranslateTool, workerPolishTool, workerSummarizeTool],
  delegateInputKey: 'content',
  systemPrompt:
    '你是翻译与文本助手。根据用户需求进行翻译、润色或摘要，使用对应工具完成任务。完成后在回复结尾加上 [STOP]。',
  delegateSchema: {
    type: 'function',
    function: {
      name: 'delegateToTranslateAgent',
      description: '将翻译、润色、摘要等文本处理请求交给翻译 Agent 处理。',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '用户关于翻译/润色/摘要的请求或待处理文本' },
        },
        required: ['content'],
      },
    },
  },
};
