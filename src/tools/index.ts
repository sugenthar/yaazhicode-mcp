import { assistanceTools } from './assistance.js';
import { exampleTools } from './examples.js';
import { knowledgeTools } from './knowledge.js';
import type { ToolDefinition } from './types.js';

export type { ToolDefinition, ToolArgs } from './types.js';

export const ALL_TOOLS: readonly ToolDefinition[] = [
  ...knowledgeTools,
  ...exampleTools,
  ...assistanceTools,
];

export const TOOL_NAMES: readonly string[] = ALL_TOOLS.map((tool) => tool.name);

export function findTool(name: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((tool) => tool.name === name);
}
