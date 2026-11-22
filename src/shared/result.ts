import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface StructuredContent {
  [key: string]: unknown;
}

/** Build a successful text tool result. Structured content is also attached when provided. */
export function ok(text: string, structured?: StructuredContent): CallToolResult {
  return {
    content: [{ type: 'text', text }],
    ...(structured ? { structuredContent: structured } : {}),
  };
}

/** Build a failed tool result without throwing across the transport. */
export function fail(message: string, structured?: StructuredContent): CallToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
    ...(structured ? { structuredContent: structured } : {}),
  };
}

/** Serialize structured data as readable JSON text for a tool result. */
export function jsonResult(value: unknown, structured?: StructuredContent): CallToolResult {
  return ok(JSON.stringify(value, null, 2), structured);
}
