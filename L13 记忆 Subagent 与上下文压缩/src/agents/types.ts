import type { ToolSchema } from '../tools/types';

export interface CoordinatorDef {
  id: string;
  systemPrompt: string;
  tools: ToolSchema[];
}
