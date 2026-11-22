import type { ServerResponse } from 'node:http';
import { LANGUAGE_VERSION, MCP_VERSION } from '../shared/version.js';

export function writeHealth(res: ServerResponse, stateful: boolean, sessions: number): void {
  const body = JSON.stringify({
    status: 'ok',
    mcp: MCP_VERSION,
    language: LANGUAGE_VERSION,
    transport: 'streamable-http',
    sessions: stateful ? sessions : 0,
  });
  res.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function writeJson(res: ServerResponse, status: number, value: unknown, extraHeaders: Record<string, string> = {}): void {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}
