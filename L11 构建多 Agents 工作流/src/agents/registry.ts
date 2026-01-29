import type { AgentDef, AgentId, RunWorkerAgentFn } from './types';
import { fileAgent } from './file';
import { translateAgent } from './translate';
import { createToolHandler } from '../tools/executor';
import type { ToolExecutorMap } from '../tools/types';

const agents: AgentDef[] = [fileAgent, translateAgent];

export const coordinatorTools = agents.map((a) => a.delegateSchema);

export function getAgentById(id: AgentId): AgentDef | undefined {
  return agents.find((a) => a.id === id);
}

export function getAgentByDelegateToolName(toolName: string): AgentDef | undefined {
  return agents.find((a) => a.delegateSchema.function.name === toolName);
}

export function createCoordinatorToolHandler(runWorkerAgent: RunWorkerAgentFn) {
  const delegateMap: ToolExecutorMap = {};
  for (const agent of agents) {
    const name = agent.delegateSchema.function.name;
    const { id, delegateInputKey } = agent;
    delegateMap[name] = (args) => runWorkerAgent(id, args[delegateInputKey] ?? '');
  }
  return createToolHandler(delegateMap);
}
