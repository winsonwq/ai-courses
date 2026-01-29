import type { ToolSchema } from '../tools/types';

export type AgentId = 'file' | 'translate';

export interface AgentDef {
  id: AgentId;
  delegateSchema: ToolSchema;
  delegateInputKey: string;
  systemPrompt: string;
  workerTools: ToolSchema[];
}

export type RunWorkerAgentFn = (workerType: AgentId, userQuery: string) => Promise<string>;
