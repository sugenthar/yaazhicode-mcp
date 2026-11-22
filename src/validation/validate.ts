import {
  analyze,
  diagnosticFromLexError,
  parseWithRecovery,
  tokenize,
  YaazhiCodeLexError,
  type DiagnosticInfo,
} from 'yaazhicode';
import type { SafeDiagnostic } from '../security/redaction.js';
import { sanitizeDiagnostic } from '../security/redaction.js';

export interface ValidationReport {
  readonly valid: boolean;
  readonly phase: 'lexical' | 'syntax' | 'semantic' | 'complete';
  readonly diagnostics: readonly SafeDiagnostic[];
  readonly summary: {
    readonly errors: number;
    readonly warnings: number;
    readonly firstCode: string | null;
  };
}

/** Parse and statically analyze code. This never executes user programs. */
export function validateCode(source: string, filename = 'snippet.yaazhi'): ValidationReport {
  let diagnostics: DiagnosticInfo[];
  let phase: ValidationReport['phase'];

  try {
    tokenize(source);
  } catch (error) {
    if (error instanceof YaazhiCodeLexError) {
      return {
        valid: false,
        phase: 'lexical',
        diagnostics: [sanitizeDiagnostic(diagnosticFromLexError(error, source, filename))],
        summary: { errors: 1, warnings: 0, firstCode: error.code },
      };
    }
    throw error;
  }

  const parsed = parseWithRecovery(source, { filename });
  if (parsed.errors.length > 0) {
    diagnostics = [...parsed.errors];
    phase = 'syntax';
  } else {
    const analyzed = analyze(parsed.program, { filename, sourceText: source });
    diagnostics = [...analyzed.diagnostics];
    phase = diagnostics.length > 0 ? 'semantic' : 'complete';
  }

  const safe = diagnostics.map(sanitizeDiagnostic);
  return {
    valid: safe.length === 0,
    phase,
    diagnostics: safe,
    summary: {
      errors: safe.length,
      warnings: 0,
      firstCode: safe[0]?.code ?? null,
    },
  };
}
