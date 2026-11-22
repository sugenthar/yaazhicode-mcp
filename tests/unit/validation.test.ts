import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCode } from '../../src/validation/validate.js';
import { analyzeCode } from '../../src/validation/code-analysis.js';
import { suggestCorrection } from '../../src/validation/correction.js';

test('valid program passes all static phases', () => {
  const report = validateCode('அச்சிடு("வணக்கம்");');
  assert.equal(report.valid, true);
  assert.equal(report.phase, 'complete');
  assert.deepEqual(report.diagnostics, []);
});

test('ASCII identifiers are rejected lexically with a stable code', () => {
  const report = validateCode('மாறி x = $௧;');
  assert.equal(report.valid, false);
  assert.equal(report.phase, 'lexical');
  assert.equal(report.diagnostics[0]?.code, 'YAAZHICODE_UNEXPECTED_CHARACTER');
});

test('ASCII digits are rejected with the authoritative conversion hint', () => {
  const report = validateCode('மாறி எண் = 42;');
  assert.equal(report.valid, false);
  assert.equal(report.diagnostics[0]?.code, 'YAAZHICODE_ASCII_NUMBER');
  assert.match(report.diagnostics[0]?.suggestion ?? '', /௨௦௧/);
});

test('missing terminator is a syntax diagnostic', () => {
  const report = validateCode('அச்சிடு("வணக்கம்")');
  assert.equal(report.valid, false);
  assert.equal(report.phase, 'syntax');
  assert.equal(report.diagnostics[0]?.code, 'YAAZHICODE_INCOMPLETE_INPUT');
});

test('undefined identifiers are semantic diagnostics', () => {
  const report = validateCode('அச்சிடு(இல்லை_இங்கு_இல்லை);');
  assert.equal(report.valid, false);
  assert.equal(report.phase, 'semantic');
  assert.equal(report.diagnostics[0]?.code, 'YAAZHICODE_UNDEFINED_IDENTIFIER');
});

test('diagnostics never include the full source text', () => {
  const report = validateCode('மாறி எண் = 42;');
  assert.equal(JSON.stringify(report).includes('sourceText'), false);
});

test('static analysis counts constructs without executing code', () => {
  const source = `செயல் கூட்டு(அ, ஆ) { கொடு அ + ஆ; }
என்றால் (கூட்டு($௧, $௨) > $௧) { அச்சிடு("ஆம்"); }`;
  const analysis = analyzeCode(source);
  assert.equal(analysis.valid, true);
  assert.equal(analysis.metrics.functions, 1);
  assert.equal(analysis.metrics.calls, 2);
  assert.ok(analysis.constructs.includes('conditional'));
});

test('correction for ASCII numerals is deterministic and revalidated', () => {
  const report = validateCode('மாறி எண் = 42;');
  const correction = suggestCorrection('மாறி எண் = 42;', report.diagnostics);
  assert.equal(correction.strategy, 'ascii-to-tamil-numeral');
  assert.equal(correction.correctedCode, 'மாறி எண் = $௪௨;');
  assert.equal(correction.revalidated, true);
});

test('generator code is diagnosed as unsupported rather than invented as working', () => {
  const source = 'செயல்* எண்கள்() { வழங்கு $௧; }';
  const report = validateCode(source);
  assert.equal(report.valid, false);
  assert.ok(report.diagnostics.every((d) => d.code === 'YAAZHICODE_UNSUPPORTED_GENERATOR'));
  const analysis = analyzeCode(source);
  assert.equal(analysis.valid, false);
});
