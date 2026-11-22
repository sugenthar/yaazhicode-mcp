import assert from 'node:assert/strict';
import test from 'node:test';
import {
  API_INVENTORY,
  DIAGNOSTICS_SNAPSHOT,
  EXAMPLES_SNAPSHOT,
  KEYWORDS_SNAPSHOT,
  PROVENANCE,
  SPECIFICATION_MARKDOWN,
  findApiEntry,
  findExample,
  searchExamples,
} from '../../src/knowledge/index.js';
import { TOOL_NAMES } from '../../src/tools/index.js';
import { RESOURCE_URIS } from '../../src/resources/index.js';
import { PROMPT_NAMES } from '../../src/prompts/index.js';

test('keyword snapshot matches the verified 40-active-keyword inventory', () => {
  assert.equal(KEYWORDS_SNAPSHOT.active.length, 40);
  assert.equal(KEYWORDS_SNAPSHOT.counts.standardGlobals, 85);
  assert.equal(KEYWORDS_SNAPSHOT.activeSpellings.includes('தொடர்'), true);
  assert.equal(KEYWORDS_SNAPSHOT.activeSpellings.includes('தொடரு'), false);
  assert.equal(KEYWORDS_SNAPSHOT.activeSpellings.includes('மாறும்'), false);
});

test('API snapshot has 17 modules, 79 globals, and 4 instance types', () => {
  assert.equal(API_INVENTORY.version, '0.1.0');
  assert.equal(API_INVENTORY.modules.length, 17);
  assert.equal(API_INVENTORY.globals.length, 79);
  assert.equal(API_INVENTORY.instances.length, 4);
  assert.ok(findApiEntry('கோப்பு'));
  assert.ok(findApiEntry('அச்சிடு'));
  assert.equal(findApiEntry('கணிதம்'), undefined);
});

test('every captured example validates and 15 have captured output', () => {
  assert.equal(EXAMPLES_SNAPSHOT.counts.allValid, EXAMPLES_SNAPSHOT.examples.length);
  assert.equal(EXAMPLES_SNAPSHOT.examples.filter((e) => e.verifiedOutput !== undefined).length, 15);
  assert.ok(findExample('official:வணக்கம்.yaazhi'));
  assert.ok(searchExamples('பிபொனாச்சி').length > 0);
});

test('diagnostics catalog contains stable codes only', () => {
  assert.ok(DIAGNOSTICS_SNAPSHOT.codes.length > 100);
  assert.ok(DIAGNOSTICS_SNAPSHOT.codes.some((c) => c.code === 'YAAZHICODE_ASCII_NUMBER'));
  assert.ok(DIAGNOSTICS_SNAPSHOT.codes.every((c) => c.code.startsWith('YAAZHICODE_')));
});

test('specification snapshot and provenance are present', () => {
  assert.match(SPECIFICATION_MARKDOWN, /YaazhiCode language specification/);
  assert.equal(PROVENANCE.languageVersion, '0.1.0');
  assert.ok(PROVENANCE.sources.length >= 10);
});

test('exactly 18 tools, 8 resources, and 6 prompts are registered', () => {
  assert.equal(TOOL_NAMES.length, 18);
  assert.equal(new Set(TOOL_NAMES).size, 18);
  assert.equal(RESOURCE_URIS.length, 8);
  assert.equal(PROMPT_NAMES.length, 6);
  assert.equal(TOOL_NAMES.includes('run_yaazhicode_code'), false);
});
