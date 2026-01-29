import type { ToolSchema } from './types';

export const workerTranslateTool: ToolSchema = {
  type: 'function',
  function: {
    name: 'translate',
    description: '将文本翻译成目标语言。支持中英互译等。',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待翻译的原文' },
        targetLang: { type: 'string', description: '目标语言，如 zh/en' },
      },
      required: ['text', 'targetLang'],
    },
  },
};

export const workerPolishTool: ToolSchema = {
  type: 'function',
  function: {
    name: 'polish',
    description: '润色文本，使表达更通顺、专业。',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string', description: '待润色的文本' } },
      required: ['text'],
    },
  },
};

export const workerSummarizeTool: ToolSchema = {
  type: 'function',
  function: {
    name: 'summarize',
    description: '对文本做摘要，可指定最大长度。',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待摘要的文本' },
        maxLength: { type: 'string', description: '摘要最大字数（可选）' },
      },
      required: ['text'],
    },
  },
};

export interface TranslateArgs {
  text: string;
  targetLang: string;
}

export interface PolishArgs {
  text: string;
}

export interface SummarizeArgs {
  text: string;
  maxLength?: string;
}

/** 演示用：无外部 API 时返回占位结果，可后续接入翻译 API */
export function executeTranslate(args: TranslateArgs): string {
  const { text, targetLang } = args;
  const toZh = /^zh/i.test(targetLang);
  if (toZh) return `[译文-中文] ${text}`;
  return `[Translation] ${text}`;
}

export function executePolish(args: PolishArgs): string {
  return `[润色结果] ${args.text}`;
}

export function executeSummarize(args: SummarizeArgs): string {
  const { text, maxLength } = args;
  const limit = maxLength ? parseInt(maxLength, 10) : 200;
  if (text.length <= limit) return text;
  return text.slice(0, limit) + '…';
}
