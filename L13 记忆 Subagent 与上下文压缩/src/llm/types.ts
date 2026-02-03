import type { ToolCall } from '../tools/types';

export interface Message {
  role: string;
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface LLMRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  tools?: unknown[];
}

export interface LLMResponse {
  choices: Array<{
    message: Message;
    finish_reason: string;
  }>;
}
