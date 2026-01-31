import type { ToolSchema } from '../tools/types';

export type AgentLevel = 'coordinator' | 'manager' | 'worker';
export type AgentId = 'coordinator' | 'analysis-manager' | 'report-manager' | 'scanner' | 'analyzer' | 'assessor' | 'reporter';

export interface AgentDef {
  id: AgentId;
  level: AgentLevel;
  parentId?: AgentId;
  children?: AgentId[];
  delegateSchema: ToolSchema;
  delegateInputKey: string;
  systemPrompt: string;
  workerTools: ToolSchema[];
}

export type RunWorkerAgentFn = (workerType: AgentId, userQuery: string) => Promise<string>;
export type RunSubAgentFn = (agentId: AgentId, task: string, options?: Record<string, any>) => Promise<string>;
