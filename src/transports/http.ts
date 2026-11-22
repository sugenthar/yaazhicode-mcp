import { createServer as createHttpServerNode, type IncomingMessage, type Server as NodeHttpServer, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../server/create-server.js';
import { logger } from '../shared/logger.js';
import { safeErrorMessage } from '../shared/errors.js';
import { InMemoryRateLimiter } from '../security/rate-limit.js';
import type { ServerConfig } from '../security/config.js';
import { clientKey, readBody, validateHostAndOrigin } from './http-security.js';
import { writeHealth, writeJson } from './health.js';

interface Session {
  readonly transport: StreamableHTTPServerTransport;
  readonly close: () => Promise<void>;
  lastUsed: number;
}

export interface HttpServerHandle {
  readonly server: NodeHttpServer;
  readonly close: () => Promise<void>;
  readonly sessionCount: () => number;
}

export async function runHttp(config: ServerConfig): Promise<HttpServerHandle> {
  const limiter = new InMemoryRateLimiter(config.rateLimitPerMinute);
  const sessions = new Map<string, Session>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastUsed > config.sessionIdleMs) {
        void session.close().catch(() => undefined);
        sessions.delete(id);
      }
    }
  }, Math.min(60_000, config.sessionIdleMs));
  cleanup.unref();

  const closeSession = async (id: string) => {
    const session = sessions.get(id);
    if (!session) return;
    sessions.delete(id);
    await session.close();
  };

  const createSession = async (sessionId?: string) => {
    const transport = new StreamableHTTPServerTransport({
      ...(sessionId ? { sessionIdGenerator: () => sessionId } : { sessionIdGenerator: undefined }),
      enableJsonResponse: true,
    });
    const { server, close } = createServer(config);
    await server.connect(transport);
    const id = transport.sessionId;

    transport.onclose = () => {
      if (id) sessions.delete(id);
      void close().catch(() => undefined);
    };
    transport.onerror = (error) => {
      logger.warn('http transport error', { message: safeErrorMessage(error) });
    };

    if (id) {
      if (sessions.size >= config.maxSessions) {
        await close();
        throw new Error('Too many active MCP sessions');
      }
      sessions.set(id, { transport, close, lastUsed: Date.now() });
    }
    return { transport, id, close };
  };

  const handleMcp = async (req: IncomingMessage, res: ServerResponse) => {
    const security = validateHostAndOrigin(req, config);
    if (!security.ok) {
      writeJson(res, security.status ?? 403, { error: security.reason });
      return;
    }

    const rate = limiter.check(clientKey(req, config));
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfterSeconds));
      writeJson(res, 429, { error: 'Rate limit exceeded', retryAfterSeconds: rate.retryAfterSeconds });
      return;
    }

    if (req.method === 'DELETE') {
      const sessionId = req.headers['mcp-session-id'];
      if (typeof sessionId !== 'string' || !sessions.has(sessionId)) {
        writeJson(res, 404, { error: 'Unknown session' });
        return;
      }
      await closeSession(sessionId);
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
      res.setHeader('Allow', 'GET, POST, DELETE');
      writeJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    let parsedBody: unknown;
    if (req.method === 'POST') {
      let raw: string;
      try {
        raw = await readBody(req, config.maxBodyBytes);
      } catch (error) {
        writeJson(res, 413, { error: safeErrorMessage(error) });
        return;
      }
      try {
        parsedBody = JSON.parse(raw);
      } catch {
        writeJson(res, 400, { error: 'Invalid JSON body' });
        return;
      }
    }

    const sessionHeader = req.headers['mcp-session-id'];
    const sessionId = typeof sessionHeader === 'string' ? sessionHeader : undefined;

    if (config.statefulSessions) {
      if (!sessionId) {
        const isInitialize = typeof parsedBody === 'object' && parsedBody !== null &&
          (parsedBody as { method?: unknown }).method === 'initialize';
        if (req.method !== 'POST' || !isInitialize) {
          writeJson(res, 400, { error: 'Missing Mcp-Session-Id header' });
          return;
        }
        try {
          const created = await createSession();
          await created.transport.handleRequest(req, res, parsedBody);
        } catch (error) {
          writeJson(res, 500, { error: safeErrorMessage(error) });
        }
        return;
      }
      const session = sessions.get(sessionId);
      if (!session) {
        writeJson(res, 404, { error: 'Unknown or expired session' });
        return;
      }
      session.lastUsed = Date.now();
      await session.transport.handleRequest(req, res, parsedBody);
      return;
    }

    // Stateless: one server + transport per request. Safe for serverless hosting.
    const { transport, close } = await createSession();
    res.on('close', () => { void close().catch(() => undefined); });
    await transport.handleRequest(req, res, parsedBody);
  };

  const server = createHttpServerNode((req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname === '/healthz') {
      writeHealth(res, config.statefulSessions, sessions.size);
      return;
    }
    if (url.pathname !== '/mcp') {
      writeJson(res, 404, { error: 'Not found. Use /mcp or /healthz.' });
      return;
    }
    void handleMcp(req, res).catch((error) => {
      logger.error('unhandled http error', { message: safeErrorMessage(error) });
      if (!res.headersSent) writeJson(res, 500, { error: 'Internal server error' });
      else res.end();
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.httpPort, config.httpHost, () => {
      server.off('error', reject);
      resolve();
    });
  });

  logger.info('http transport listening', { host: config.httpHost, port: config.httpPort, stateful: config.statefulSessions });

  return {
    server,
    sessionCount: () => sessions.size,
    close: async () => {
      clearInterval(cleanup);
      for (const id of [...sessions.keys()]) await closeSession(id);
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
