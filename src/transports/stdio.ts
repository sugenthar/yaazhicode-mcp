import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from '../server/create-server.js';
import { logger } from '../shared/logger.js';
import type { ServerConfig } from '../security/config.js';

export async function runStdio(config: ServerConfig): Promise<() => Promise<void>> {
  const { server, close } = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('stdio transport connected');
  return close;
}
