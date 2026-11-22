import type { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ServerConfig } from '../security/config.js';

export type ToolArgs = Record<string, unknown>;
export type ToolSchemaShape = Record<string, z.ZodTypeAny>;

export interface ToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: ToolSchemaShape;
  readonly annotations?: {
    readonly readOnlyHint?: boolean;
    readonly destructiveHint?: boolean;
    readonly idempotentHint?: boolean;
    readonly openWorldHint?: boolean;
  };
  readonly handler: (args: ToolArgs, config: ServerConfig) => CallToolResult | Promise<CallToolResult>;
}
