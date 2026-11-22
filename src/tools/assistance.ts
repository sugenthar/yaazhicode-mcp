import { z } from 'zod';
import { diagnosticCodeEntry, searchDiagnosticCodes } from '../knowledge/errors.js';
import { readCodeArgument } from '../security/input.js';
import { truncateResult } from '../security/limits.js';
import { jsonResult, ok } from '../shared/result.js';
import { analyzeCode } from '../validation/code-analysis.js';
import { suggestCorrection } from '../validation/correction.js';
import { explainDiagnostic } from '../validation/explain.js';
import { validateCode } from '../validation/validate.js';
import type { ToolDefinition } from './types.js';

export const assistanceTools: readonly ToolDefinition[] = [
  {
    name: 'validate_yaazhicode_code',
    title: 'Validate YaazhiCode code',
    description: 'Lex, parse, and semantically analyze YaazhiCode source without executing it. Returns stable diagnostic codes, locations, reasons, and suggestions.',
    inputSchema: {
      code: z.string().min(1).describe('YaazhiCode source text.'),
      filename: z.string().max(120).optional().describe('Optional logical filename used in diagnostics. No file is read.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args, config) => {
      const code = readCodeArgument(args.code, config.maxToolCodeChars);
      const filename = typeof args.filename === 'string' && args.filename.length <= 120
        ? args.filename.replace(/[^\p{L}\p{M}\p{N}_./-]/gu, '_')
        : 'snippet.yaazhi';
      const report = validateCode(code, filename);
      return jsonResult(report, { valid: report.valid, phase: report.phase, firstCode: report.summary.firstCode });
    },
  },
  {
    name: 'explain_yaazhicode_error',
    title: 'Explain a YaazhiCode error',
    description: 'Explain a YAAZHICODE_* code or explain the diagnostics produced for supplied code. Prefer supplying code for authoritative messages.',
    inputSchema: {
      code: z.string().min(1).max(32).optional().describe('Optional diagnostic code such as YAAZHICODE_ASCII_NUMBER.'),
      source: z.string().min(1).optional().describe('Optional YaazhiCode source that produces the error.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args, config) => {
      if (args.source !== undefined) {
        const source = readCodeArgument(args.source, config.maxToolCodeChars);
        const report = validateCode(source);
        if (report.valid) {
          return jsonResult({ valid: true, note: 'The supplied code has no diagnostics; there is nothing to explain.' });
        }
        return jsonResult({
          valid: false,
          explanations: report.diagnostics.map(explainDiagnostic),
        });
      }
      if (typeof args.code === 'string' && args.code.trim()) {
        const upper = args.code.trim().toUpperCase();
        const entry = diagnosticCodeEntry(upper);
        if (entry) return jsonResult({ found: true, ...entry });
        return jsonResult({ found: false, code: upper, similar: searchDiagnosticCodes(upper, 10) });
      }
      return jsonResult({
        found: false,
        note: 'Supply either `code` or `source`. Unknown diagnostic codes are never given invented meanings.',
      });
    },
  },
  {
    name: 'analyze_yaazhicode_code',
    title: 'Analyze YaazhiCode code',
    description: 'Return structural static analysis: counts, detected constructs, imports, experimental-feature notices, and validation diagnostics. Does not execute code.',
    inputSchema: {
      code: z.string().min(1).describe('YaazhiCode source text.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args, config) => {
      const code = readCodeArgument(args.code, config.maxToolCodeChars);
      const analysis = analyzeCode(code);
      return jsonResult(analysis);
    },
  },
  {
    name: 'suggest_yaazhicode_correction',
    title: 'Suggest a YaazhiCode correction',
    description: 'Propose a conservative correction for a diagnostic. Corrections are revalidated; when no deterministic fix exists, guidance is returned instead.',
    inputSchema: {
      code: z.string().min(1).describe('YaazhiCode source text.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args, config) => {
      const code = readCodeArgument(args.code, config.maxToolCodeChars);
      const report = validateCode(code);
      const suggestion = suggestCorrection(code, report.diagnostics);
      return ok(truncateResult(JSON.stringify({ validation: report, suggestion }, null, 2), config.maxResultChars));
    },
  },
];
