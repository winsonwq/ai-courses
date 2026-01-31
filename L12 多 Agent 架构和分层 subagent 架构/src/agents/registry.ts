import type { AgentDef, AgentId } from './types';
import { createToolHandler } from '../tools/executor';
import type { ToolExecutorMap } from '../tools/types';

export const agents: Map<AgentId, AgentDef> = new Map();

export function registerAgent(agent: AgentDef) {
  agents.set(agent.id, agent);
}

export function getAgentById(id: AgentId): AgentDef | undefined {
  return agents.get(id);
}

export function getChildrenByParentId(parentId: AgentId): AgentDef[] {
  const parent = agents.get(parentId);
  if (!parent || !parent.children) return [];
  return parent.children
    .map((childId) => agents.get(childId))
    .filter((a): a is AgentDef => a !== undefined);
}

export function getRootCoordinator(): AgentDef | undefined {
  return agents.get('coordinator');
}

export function getAllSubAgentSchemas(): any[] {
  const schemas: any[] = [];
  for (const agent of agents.values()) {
    if (agent.level === 'manager' || agent.level === 'worker') {
      schemas.push(agent.delegateSchema);
    }
  }
  return schemas;
}

export function createSubAgentToolHandler(runSubAgent: (agentId: AgentId, task: string, options?: Record<string, any>) => Promise<string>) {
  const delegateMap: ToolExecutorMap = {};
  for (const [id, agent] of agents) {
    if (agent.level === 'manager' || agent.level === 'worker') {
      const name = agent.delegateSchema.function.name;
      delegateMap[name] = (args) => runSubAgent(id, args[agent.delegateInputKey] ?? '', (args as any).options);
    }
  }
  return createToolHandler(delegateMap);
}
