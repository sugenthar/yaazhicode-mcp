import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPrompts } from '../prompts/index.js';
import { registerResources } from '../resources/index.js';
import { ALL_TOOLS } from '../tools/index.js';
import { safeErrorMessage } from '../shared/errors.js';
import { logger } from '../shared/logger.js';
import { fail } from '../shared/result.js';
import { SERVER_INFO } from '../shared/version.js';
import type { ServerConfig } from '../security/config.js';
import { SERVER_CAPABILITIES, SERVER_INSTRUCTIONS } from './metadata.js';

export interface CreatedServer {
  readonly server: McpServer;
  readonly close: () => Promise<void>;
}

export function createServer(config: ServerConfig): CreatedServer {
  const server = new McpServer(SERVER_INFO, {
    capabilities: SERVER_CAPABILITIES,
    instructions: SERVER_INSTRUCTIONS,
  });

  for (const tool of ALL_TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        ...(tool.annotations ? { annotations: tool.annotations } : {}),
      },
      async (args) => {
        try {
          return await tool.handler((args ?? {}) as Record<string, unknown>, config);
        } catch (error) {
          logger.warn('tool failed', { tool: tool.name });
          return fail(safeErrorMessage(error));
        }
      },
    );
  }

  registerResources(server);
  registerPrompts(server);

  return {
    server,
    close: async () => {
      await server.close();
    },
  };
}
