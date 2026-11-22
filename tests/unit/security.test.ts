import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryRateLimiter } from '../../src/security/rate-limit.js';
import { safeId, sanitizeUserText } from '../../src/security/input.js';
import { truncateResult, requireString } from '../../src/security/limits.js';
import { loadConfig, publicConfigSummary } from '../../src/security/config.js';
import { redactSecrets, sanitizeDiagnostic } from '../../src/security/redaction.js';

test('rate limiter blocks after the configured number of requests', () => {
  const limiter = new InMemoryRateLimiter(2, 60_000);
  assert.equal(limiter.check('ip').allowed, true);
  assert.equal(limiter.check('ip').allowed, true);
  const third = limiter.check('ip');
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSeconds >= 1);
});

test('safeId rejects traversal and path separators', () => {
  assert.equal(safeId('official:வணக்கம்.yaazhi', 'id'), 'official:வணக்கம்.yaazhi');
  assert.throws(() => safeId('../secret', 'id'));
  assert.throws(() => safeId('C:\\secret', 'id'));
  assert.throws(() => safeId('/etc/passwd', 'id'));
});

test('sanitizeUserText rejects control characters', () => {
  assert.throws(() => sanitizeUserText('ok\u0000bad', 'code'));
  assert.equal(sanitizeUserText('மாறி எண் = $௧;', 'code'), 'மாறி எண் = $௧;');
});

test('string limits and result truncation are enforced', () => {
  assert.throws(() => requireString('x'.repeat(11), 'query', 10));
  const truncated = truncateResult('abcdef', 3);
  assert.ok(truncated.startsWith('abc'));
  assert.match(truncated, /truncated/);
});

test('public config summary omits secrets and host details', () => {
  process.env.API_KEY = 'do-not-expose';
  const summary = publicConfigSummary(loadConfig());
  assert.equal(JSON.stringify(summary).includes('do-not-expose'), false);
  assert.equal('httpHost' in summary, false);
  delete process.env.API_KEY;
});

test('redaction removes secret-shaped values', () => {
  assert.equal(redactSecrets('TOKEN=abc123'), 'TOKEN=[redacted]');
  assert.equal(redactSecrets('key ghp_abcdefghijklmnop'), 'key [redacted]');
});

test('sanitized diagnostics do not echo source text', () => {
  const result = sanitizeDiagnostic({
    code: 'YAAZHICODE_ASCII_NUMBER',
    category: 'lexical',
    message: 'test',
    sourceText: 'SECRET SOURCE',
  });
  assert.equal(JSON.stringify(result).includes('SECRET SOURCE'), false);
});
