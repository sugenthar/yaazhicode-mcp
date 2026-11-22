export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Stderr-only logger. Never include user code, prompts, arguments, or secrets in
 * log messages. `meta` is restricted to primitive counters/flags by convention.
 */
export function createLogger(level: LogLevel = 'info'): Logger {
  const threshold = LEVELS[level];
  const emit = (name: LogLevel, message: string, meta?: Record<string, unknown>) => {
    if (LEVELS[name] < threshold) return;
    const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    process.stderr.write(`[yaazhicode-mcp] ${name}: ${message}${suffix}\n`);
  };
  return {
    debug: (m, x) => emit('debug', m, x),
    info: (m, x) => emit('info', m, x),
    warn: (m, x) => emit('warn', m, x),
    error: (m, x) => emit('error', m, x),
  };
}

export const logger = createLogger(
  (process.env.YAAZHICODE_MCP_LOG_LEVEL as LogLevel | undefined) ?? 'info',
);
