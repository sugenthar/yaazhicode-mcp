import assert from 'node:assert/strict';
import test from 'node:test';
import { ALL_TOOLS, findTool } from '../../src/tools/index.js';
import { loadConfig } from '../../src/security/config.js';

const config = loadConfig();

function call(name: string, args: Record<string, unknown> = {}) {
  const tool = findTool(name);
  assert.ok(tool, `tool ${name} must exist`);
  const result = tool.handler(args, config);
  return Promise.resolve(result);
}

function text(result: Awaited<ReturnType<typeof call>>): string {
  const content = result.content[0];
  return content && content.type === 'text' ? content.text : '';
}

test('all tool handlers return safe results for valid arguments', async () => {
  for (const tool of ALL_TOOLS) {
    const args: Record<string, unknown> = {};
    if (tool.name === 'validate_yaazhicode_code' || tool.name === 'analyze_yaazhicode_code' || tool.name === 'suggest_yaazhicode_correction') {
      args.code = 'அச்சிடு("வணக்கம்");';
    } else if (tool.name === 'explain_yaazhicode_error') {
      args.code = 'YAAZHICODE_ASCII_NUMBER';
    } else if (tool.name === 'get_yaazhicode_example') {
      args.id = 'official:வணக்கம்.yaazhi';
    } else if (tool.name === 'search_yaazhicode_examples') {
      args.query = 'வணக்கம்';
    } else if (tool.name === 'list_yaazhicode_functions') {
      args.name = 'அச்சிடு';
    }
    const result = await call(tool.name, args);
    assert.equal(result.isError, undefined, `${tool.name} returned an error`);
    assert.ok(text(result).length > 0, `${tool.name} returned empty text`);
  }
});

test('unknown example and unknown API name fail gracefully', async () => {
  const example = await call('get_yaazhicode_example', { id: 'does-not-exist' });
  assert.match(text(example), /"found": false/);
  const api = await call('list_yaazhicode_functions', { name: 'நிஜமில்லை' });
  assert.match(text(api), /"found": false/);
});

test('oversized code input is rejected', async () => {
  await assert.rejects(async () => {
    await call('validate_yaazhicode_code', { code: 'அ'.repeat(config.maxToolCodeChars + 1) });
  }, /limit/i);
});

test('spec section lookup works for a real section', async () => {
  const result = await call('get_yaazhicode_spec', { section: '10' });
  assert.match(text(result), /Explicitly unsupported syntax/);
});
