import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import test from 'node:test';

const PORT = 37917;
let child: ChildProcess | undefined;

async function waitForHealth(): Promise<void> {
  for (let i = 0; i < 80; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/healthz`);
      if (response.ok) return;
    } catch {
      // not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('HTTP server did not become healthy');
}

test.before(async () => {
  child = spawn(process.execPath, ['dist/transports/cli.js', '--http'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(PORT),
      YAAZHICODE_MCP_LOG_LEVEL: 'error',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForHealth();
});

test.after(async () => {
  child?.kill('SIGTERM');
});

function rpc(method: string, params: unknown = {}, id = 1, headers: Record<string, string> = {}) {
  return fetch(`http://127.0.0.1:${PORT}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
}

test('health endpoint reports versions', async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/healthz`);
  const body = await response.json() as { status: string; language: string };
  assert.equal(body.status, 'ok');
  assert.equal(body.language, '0.1.0');
});

test('stateless Streamable HTTP handles initialize and tools/list', async () => {
  const init = await rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'http-test', version: '1.0.0' },
  });
  assert.equal(init.status, 200);
  const list = await rpc('tools/list', {}, 2);
  assert.equal(list.status, 200);
  const body = await list.json() as { result: { tools: unknown[] } };
  assert.equal(body.result.tools.length, 18);
});

test('cross-origin requests are blocked by default', async () => {
  const response = await rpc('tools/list', {}, 3, { origin: 'https://evil.example' });
  assert.equal(response.status, 403);
});

test('oversized bodies are rejected', async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'x'.repeat(300_000),
  });
  assert.equal(response.status, 413);
});

test('unknown paths return 404', async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/unknown`);
  assert.equal(response.status, 404);
});
