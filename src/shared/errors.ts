/** Error types used by the MCP server. Messages are safe for client output. */
export class McpServerError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'McpServerError';
  }
}

export class ValidationError extends McpServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVALID_ARGUMENT', details);
    this.name = 'ValidationError';
  }
}

export class LimitExceededError extends McpServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'LIMIT_EXCEEDED', details);
    this.name = 'LimitExceededError';
  }
}

export class RateLimitError extends McpServerError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RATE_LIMITED', details);
    this.name = 'RateLimitError';
  }
}

/** Convert an unknown thrown value into a short, non-sensitive client message. */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof McpServerError) return error.message;
  if (error instanceof Error) {
    // Do not leak stack traces, file paths, or environment details.
    return error.message.slice(0, 300);
  }
  return 'இந்தக் கோரிக்கையைச் செயலாக்க முடியவில்லை (Unexpected error).';
}
