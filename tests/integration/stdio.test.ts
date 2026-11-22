import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function connect() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/transports/cli.js', '--stdio'],
    cwd: process.cwd(),
    env: { ...process.env, YAAZHICODE_MCP_LOG_LEVEL: 'error' },
  });
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  await client.connect(transport);
  return { client, transport };
}

test('stdio transport exposes the full server surface', async () => {
  const { client } = await connect();
  try {
    assert.equal(client.getServerVersion()?.name, '@yaazhicode/mcp');
    assert.equal((await client.listTools()).tools.length, 18);
    assert.equal((await client.listResources()).resources.length, 8);
    assert.equal((await client.listPrompts()).prompts.length, 6);
  } finally {
    await client.close();
  }
});

test('stdio tool calls validate real code and reject invalid code', async () => {
  const { client } = await connect();
  try {
    const valid = await client.callTool({ name: 'validate_yaazhicode_code', arguments: { code: 'அச்சிடு("வணக்கம்");' } });
    assert.match(JSON.stringify(valid), /"valid":true/);
    const invalid = await client.callTool({ name: 'validate_yaazhicode_code', arguments: { code: 'மாறி x = $௧;' } });
    assert.match(JSON.stringify(invalid), /YAAZHICODE_UNEXPECTED_CHARACTER/);
  } finally {
    await client.close();
  }
});

test('unknown tools are rejected by the protocol layer', async () => {
  const { client } = await connect();
  try {
    const result = await client.callTool({ name: 'run_yaazhicode_code', arguments: { code: '' } });
    assert.equal(result.isError, true);
    assert.match(JSON.stringify(result), /Tool run_yaazhicode_code not found/);
  } finally {
    await client.close();
  }
});

test('parallel tool calls remain isolated', async () => {
  const { client } = await connect();
  try {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        client.callTool({
          name: 'validate_yaazhicode_code',
          arguments: { code: index % 2 === 0 ? 'அச்சிடு("வணக்கம்");' : 'மாறி x = $௧;' },
        }),
      ),
    );
    results.forEach((result, index) => {
      const body = JSON.stringify(result);
      assert.equal(body.includes('"valid":true'), index % 2 === 0);
    });
  } finally {
    await client.close();
  }
});

test('prompts and resources can be read over stdio', async () => {
  const { client } = await connect();
  try {
    const prompt = await client.getPrompt({ name: 'write_yaazhicode_program', arguments: { task: 'print greeting' } });
    assert.match(prompt.messages[0]!.content.type === 'text' ? prompt.messages[0]!.content.text : '', /validate_yaazhicode_code/);
    const resource = await client.readResource({ uri: 'yaazhicode://keywords' });
    assert.match(resource.contents[0]!.text!, /தொடர்/);
  } finally {
    await client.close();
  }
});
