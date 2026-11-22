export type TransportMode = 'stdio' | 'http' | 'auto';

export interface ServerConfig {
  readonly transport: TransportMode;
  readonly httpHost: string;
  readonly httpPort: number;
  /** Public origin(s) allowed to call the HTTP endpoint. Empty means same-origin only. */
  readonly allowedOrigins: readonly string[];
  /** Host header values accepted by the HTTP endpoint. Empty means any host is accepted (local dev only). */
  readonly allowedHosts: readonly string[];
  readonly trustProxy: boolean;
  readonly statefulSessions: boolean;
  readonly maxSessions: number;
  readonly sessionIdleMs: number;
  readonly maxBodyBytes: number;
  readonly maxToolCodeChars: number;
  readonly maxPromptChars: number;
  readonly maxResultChars: number;
  readonly rateLimitPerMinute: number;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function listEnv(name: string): readonly string[] {
  return (process.env[name] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return /^(1|true|yes|on)$/i.test(raw);
}

export function loadConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  const transport = (process.env.YAAZHICODE_MCP_TRANSPORT ?? 'stdio') as TransportMode;
  if (!['stdio', 'http', 'auto'].includes(transport)) {
    throw new Error('YAAZHICODE_MCP_TRANSPORT must be stdio, http, or auto');
  }
  const config: ServerConfig = {
    transport,
    httpHost: process.env.HOST ?? '127.0.0.1',
    httpPort: intEnv('PORT', 3000, 1, 65535),
    allowedOrigins: listEnv('YAAZHICODE_MCP_ALLOWED_ORIGINS'),
    allowedHosts: listEnv('YAAZHICODE_MCP_ALLOWED_HOSTS'),
    trustProxy: boolEnv('YAAZHICODE_MCP_TRUST_PROXY', false),
    statefulSessions: boolEnv('YAAZHICODE_MCP_STATEFUL', false),
    maxSessions: intEnv('YAAZHICODE_MCP_MAX_SESSIONS', 128, 1, 100000),
    sessionIdleMs: intEnv('YAAZHICODE_MCP_SESSION_IDLE_MS', 10 * 60 * 1000, 1000, 24 * 60 * 60 * 1000),
    maxBodyBytes: intEnv('YAAZHICODE_MCP_MAX_BODY_BYTES', 256 * 1024, 1024, 4 * 1024 * 1024),
    maxToolCodeChars: intEnv('YAAZHICODE_MCP_MAX_CODE_CHARS', 32 * 1024, 64, 256 * 1024),
    maxPromptChars: intEnv('YAAZHICODE_MCP_MAX_PROMPT_CHARS', 16 * 1024, 64, 128 * 1024),
    maxResultChars: intEnv('YAAZHICODE_MCP_MAX_RESULT_CHARS', 128 * 1024, 1024, 1024 * 1024),
    rateLimitPerMinute: intEnv('YAAZHICODE_MCP_RATE_LIMIT_PER_MIN', 60, 1, 100000),
    logLevel: (process.env.YAAZHICODE_MCP_LOG_LEVEL ?? 'info') as ServerConfig['logLevel'],
  };
  return { ...config, ...overrides };
}

/** Public, non-sensitive portion of the configuration for the version tool. */
export function publicConfigSummary(config: ServerConfig) {
  return {
    transport: config.transport,
    statefulSessions: config.statefulSessions,
    maxToolCodeChars: config.maxToolCodeChars,
    maxBodyBytes: config.maxBodyBytes,
    rateLimitPerMinute: config.rateLimitPerMinute,
  };
}
