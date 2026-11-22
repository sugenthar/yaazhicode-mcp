import { diagnosticCodeEntry, searchDiagnosticCodes } from '../knowledge/errors.js';
import type { SafeDiagnostic } from '../security/redaction.js';

export function explainDiagnostic(diagnostic: SafeDiagnostic) {
  const catalog = diagnosticCodeEntry(diagnostic.code);
  return {
    code: diagnostic.code,
    category: diagnostic.category,
    message: diagnostic.message,
    location: diagnostic.location,
    reason: diagnostic.reason,
    suggestion: diagnostic.suggestion,
    example: diagnostic.example,
    catalogNote: catalog?.shortExplanation ?? null,
    authoritative: true,
    note: 'This explanation was produced by the YaazhiCode compiler for the supplied source.',
  };
}

export function explainCodeOnly(code: string) {
  const entry = diagnosticCodeEntry(code);
  if (entry) {
    return {
      found: true as const,
      ...entry,
      note: 'Short catalog label only. Supply the failing code to validate_yaazhicode_code for the authoritative Tamil message.',
    };
  }
  return {
    found: false as const,
    code,
    similar: searchDiagnosticCodes(code, 10),
    note: 'Unknown diagnostic code. Do not assume a meaning.',
  };
}
