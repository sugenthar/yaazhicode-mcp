import type { DiagnosticInfo } from 'yaazhicode';

/** Public diagnostic shape: no full source echo, no host paths. */
export interface SafeDiagnostic {
  code: string;
  category: string;
  message: string;
  location?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  note?: string;
  reason?: string;
  suggestion?: string;
  example?: string;
}

export function sanitizeDiagnostic(diagnostic: DiagnosticInfo): SafeDiagnostic {
  const result: SafeDiagnostic = {
    code: diagnostic.code,
    category: diagnostic.category,
    message: diagnostic.message,
  };
  if (diagnostic.location) {
    result.location = {
      startLine: diagnostic.location.startLine,
      startColumn: diagnostic.location.startColumn,
      endLine: diagnostic.location.endLine,
      endColumn: diagnostic.location.endColumn,
    };
  }
  if (diagnostic.note) result.note = diagnostic.note;
  if (diagnostic.reason) result.reason = diagnostic.reason;
  if (diagnostic.suggestion) result.suggestion = diagnostic.suggestion;
  if (diagnostic.example) result.example = diagnostic.example;
  return result;
}

/** Strip anything that resembles an environment assignment or secret token. */
export function redactSecrets(text: string): string {
  return text
    .replace(/([A-Z_][A-Z0-9_]*)\s*=\s*\S+/g, '$1=[redacted]')
    .replace(/(sk-|pk_|ghp_|github_pat_)[A-Za-z0-9_-]+/g, '[redacted]');
}
