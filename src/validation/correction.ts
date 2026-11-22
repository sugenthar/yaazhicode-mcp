import { STALE_DOC_CORRECTIONS } from '../knowledge/templates.js';
import type { SafeDiagnostic } from '../security/redaction.js';
import { validateCode } from './validate.js';

const TAMIL_DIGITS = ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'] as const;

/** Replace digit runs outside strings/comments without touching literals or comments. */
function transformDigits(source: string, mode: 'ascii' | 'bare'): string {
  let out = '';
  let i = 0;
  const isAscii = (c: string) => c >= '0' && c <= '9';
  const isTamilDigit = (c: string) => c >= '௦' && c <= '௯';
  while (i < source.length) {
    const c = source[i]!;
    if (c === '"') {
      const start = i++;
      while (i < source.length) {
        if (source[i] === '\\') { i += 2; continue; }
        if (source[i] === '"') { i++; break; }
        i++;
      }
      out += source.slice(start, i);
      continue;
    }
    if (c === '/' && source[i + 1] === '/') {
      const start = i;
      while (i < source.length && source[i] !== '\n') i++;
      out += source.slice(start, i);
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      const start = i;
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
      i = Math.min(source.length, i + 2);
      out += source.slice(start, i);
      continue;
    }
    const isMatch = mode === 'ascii' ? isAscii(c) : isTamilDigit(c);
    if (isMatch && (mode === 'ascii' || source[i - 1] !== '$')) {
      const start = i;
      while (i < source.length && (mode === 'ascii' ? isAscii(source[i]!) : isTamilDigit(source[i]!))) i++;
      const run = source.slice(start, i);
      const mapped = mode === 'ascii'
        ? run.split('').map((d) => TAMIL_DIGITS[Number(d)]).join('')
        : run;
      out += '$' + mapped;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

export interface CorrectionResult {
  readonly strategy: string;
  readonly correctedCode: string | null;
  readonly explanation: string;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly revalidated: boolean | null;
  readonly note: string;
}

/** Produce a conservative correction only where the transformation is deterministic. */
export function suggestCorrection(code: string, diagnostics: readonly SafeDiagnostic[]): CorrectionResult {
  const first = diagnostics[0];
  if (!first) {
    return {
      strategy: 'none',
      correctedCode: null,
      explanation: 'The supplied code has no compiler diagnostics; no correction is needed.',
      confidence: 'high',
      revalidated: null,
      note: 'Corrections are never applied to code that already validates.',
    };
  }

  let candidate: string | null = null;
  let strategy = 'guidance-only';
  let explanation = first.suggestion ?? first.reason ?? first.message;
  let confidence: CorrectionResult['confidence'] = 'low';

  if (first.code === 'YAAZHICODE_ASCII_NUMBER') {
    candidate = transformDigits(code, 'ascii');
    strategy = 'ascii-to-tamil-numeral';
    explanation = 'ASCII digit runs outside strings/comments were converted to $ + Tamil digits.';
    confidence = 'high';
  } else if (first.code === 'YAAZHICODE_BARE_TAMIL_DIGIT') {
    candidate = transformDigits(code, 'bare');
    strategy = 'add-numeral-marker';
    explanation = 'Tamil digit runs outside strings/comments were prefixed with $.';
    confidence = 'high';
  } else if (first.code === 'YAAZHICODE_INCOMPLETE_INPUT') {
    const trimmed = code.replace(/[\s;]*$/, '');
    candidate = trimmed + ';';
    strategy = 'append-terminator';
    explanation = 'A single semicolon was appended to the final statement.';
    confidence = 'medium';
  } else {
    const correction = STALE_DOC_CORRECTIONS.find((item) => code.includes(item.wrong));
    if (correction) {
      candidate = code.replaceAll(correction.wrong, correction.correct);
      strategy = 'stale-doc-spelling';
      explanation = correction.explanation;
      confidence = 'medium';
    }
  }

  if (!candidate || candidate === code) {
    return {
      strategy,
      correctedCode: null,
      explanation,
      confidence,
      revalidated: null,
      note: 'No safe automatic correction is available. Use the compiler message, reason, and suggestion above.',
    };
  }

  const revalidation = validateCode(candidate);
  return {
    strategy,
    correctedCode: candidate,
    explanation,
    confidence,
    revalidated: revalidation.valid,
    note: revalidation.valid
      ? 'The corrected code passed lexing, parsing, and semantic analysis. It was not executed.'
      : 'The corrected code still has diagnostics; review it rather than assuming it is valid.',
  };
}
