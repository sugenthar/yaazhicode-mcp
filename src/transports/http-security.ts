import type { IncomingMessage } from 'node:http';
import { LimitExceededError } from '../shared/errors.js';
import type { ServerConfig } from '../security/config.js';

export interface HttpSecurityResult {
  readonly ok: boolean;
  readonly status?: number;
  readonly reason?: string;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function validateHostAndOrigin(req: IncomingMessage, config: ServerConfig): HttpSecurityResult {
  const hostHeader = req.headers.host ?? '';
  const host = hostHeader.split(':')[0]!.toLowerCase();

  if (config.allowedHosts.length > 0 && !config.allowedHosts.includes(hostHeader.toLowerCase())) {
    return { ok: false, status: 403, reason: 'Host not allowed' };
  }
  if (config.allowedHosts.length === 0 && !LOCAL_HOSTS.has(host)) {
    return { ok: false, status: 403, reason: 'Set YAAZHICODE_MCP_ALLOWED_HOSTS for non-local deployment' };
  }

  const origin = req.headers.origin;
  if (origin) {
    let originHost = '';
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch {
      return { ok: false, status: 400, reason: 'Invalid Origin header' };
    }
    if (config.allowedOrigins.length > 0) {
      const allowed = config.allowedOrigins.map((o) => o.toLowerCase());
      if (!allowed.includes(origin.toLowerCase()) && !allowed.includes(originHost)) {
        return { ok: false, status: 403, reason: 'Origin not allowed' };
      }
    } else if (originHost !== hostHeader.toLowerCase()) {
      return { ok: false, status: 403, reason: 'Cross-origin requests are disabled' };
    }
  }
  return { ok: true };
}

export async function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new LimitExceededError('Request body too large');
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function clientKey(req: IncomingMessage, config: ServerConfig): string {
  // Never use Authorization or Cookie values as a rate-limit key.
  if (config.trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) {
      return forwarded.split(',')[0]!.trim().slice(0, 64);
    }
  }
  return req.socket.remoteAddress ?? 'unknown';
}
