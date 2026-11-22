import { DIAGNOSTICS_SNAPSHOT } from './data/snapshot.js';
import type { DiagnosticCodeEntry } from './types.js';

export const ERROR_HANDLING = {
  syntax: `முயற்சி {
  எறி பிழை("தோல்வி", "YAAZHICODE_EXAMPLE");
} பிடி (பிழை) {
  அச்சிடு(பிழை.குறியீடு + ": " + பிழை.செய்தி);
} இறுதியில் {
  அச்சிடு("முடிந்தது");
}`,
  notes: [
    'முயற்சி requires at least one of பிடி or இறுதியில்.',
    'A catch clause has exactly one binding parameter.',
    'எறி can throw any YaazhiCode value.',
    'Caught engine errors are பிழை values with .செய்தி, .குறியீடு, and .தடம்.',
    'இறுதியில் runs on normal completion, return, throw, break, continue, and exit.',
    'வெளியேறு(...) is a process signal and is not swallowed by பிடி.',
  ],
} as const;

export function diagnosticCodeEntry(code: string): DiagnosticCodeEntry | undefined {
  return DIAGNOSTICS_SNAPSHOT.codes.find((entry) => entry.code === code);
}

export function searchDiagnosticCodes(query: string, limit = 20): readonly DiagnosticCodeEntry[] {
  const q = query.toUpperCase();
  return DIAGNOSTICS_SNAPSHOT.codes
    .filter((entry) => entry.code.includes(q) || (entry.shortExplanation ?? '').includes(query))
    .slice(0, limit);
}
