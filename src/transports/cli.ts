import { loadConfig, type ServerConfig } from '../security/config.js';
import { logger } from '../shared/logger.js';
import { MCP_NAME, MCP_VERSION, LANGUAGE_VERSION } from '../shared/version.js';
import { runHttp } from './http.js';
import { runStdio } from './stdio.js';

type ParsedArgs = { mode: 'stdio' | 'http' | 'auto'; help: boolean; version: boolean };

function parseArgs(argv: readonly string[]): ParsedArgs {
  const args = [...argv];
  if (args.includes('--help') || args.includes('-h')) return { mode: 'stdio', help: true, version: false };
  if (args.includes('--version') || args.includes('-V')) return { mode: 'stdio', help: false, version: true };
  if (args.includes('--http')) return { mode: 'http', help: false, version: false };
  if (args.includes('--stdio')) return { mode: 'stdio', help: false, version: false };
  return { mode: 'auto', help: false, version: false };
}

const HELP = `${MCP_NAME} ${MCP_VERSION}
YaazhiCode language ${LANGUAGE_VERSION}

Usage:
  yaazhicode-mcp --stdio        Run the MCP server over stdio (default)
  yaazhicode-mcp --http         Run the MCP server over Streamable HTTP

HTTP options are configured with environment variables:
  HOST, PORT, YAAZHICODE_MCP_ALLOWED_ORIGINS, YAAZHICODE_MCP_ALLOWED_HOSTS,
  YAAZHICODE_MCP_STATEFUL, YAAZHICODE_MCP_MAX_SESSIONS,
  YAAZHICODE_MCP_RATE_LIMIT_PER_MIN, YAAZHICODE_MCP_MAX_BODY_BYTES

The server never executes YaazhiCode programs. It only provides verified
knowledge, examples, validation, static analysis, and diagnostics.
`;

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    process.stdout.write(HELP);
    return;
  }
  if (parsed.version) {
    process.stdout.write(`${MCP_VERSION}\n`);
    return;
  }

  const overrides: Partial<ServerConfig> = parsed.mode === 'auto' ? {} : { transport: parsed.mode };
  const config: ServerConfig = loadConfig(overrides);

  let close: (() => Promise<void>) | undefined;
  const shutdown = async () => {
    await close?.();
    process.exit(0);
  };
  process.once('SIGINT', () => { void shutdown(); });
  process.once('SIGTERM', () => { void shutdown(); });

  if (config.transport === 'http') {
    const handle = await runHttp(config);
    close = handle.close;
  } else {
    close = await runStdio(config);
  }
  logger.info('server ready', { transport: config.transport });
}

void main().catch((error) => {
  logger.error('fatal startup error', { message: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
});
