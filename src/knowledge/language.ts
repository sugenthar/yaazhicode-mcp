import { PROVENANCE } from './data/snapshot.js';

export const LANGUAGE_OVERVIEW = {
  name: 'YaazhiCode',
  version: PROVENANCE.languageVersion,
  fileExtension: '.yaazhi',
  engine: 'Direct tree-walking interpreter; no JavaScript is generated and eval is not used.',
  nodeRequirement: '>=22.18.0',
  sourceOfTruth: [
    'YaazhiCode/SPECIFICATION.md',
    'YaazhiCode/docs/KEYWORDS.md',
    'YaazhiCode/src/lexer/keywords.ts',
    'YaazhiCode/docs/STANDARD_LIBRARY.md',
    'YaazhiCode/docs/BUILTIN_MODULES.md',
    'YaazhiCode/docs/LIMITATIONS.md',
    'yaazhicode api --json',
  ],
  counts: PROVENANCE.counts,
  keyFacts: [
    '40 active Tamil keywords. There are no ASCII or transliterated keyword aliases.',
    'Identifiers use Tamil letters, Tamil marks, Tamil digits, and _. ASCII letters are invalid; $ is not valid inside identifiers.',
    'Number literals use $ followed by Tamil digits, e.g. $௪௨, $௧.௫, $௧..$௫.',
    'Strings use double quotes with only \\\\, \\", \\n, \\r, \\t escapes; no template literals.',
    'Statements require explicit terminators; there is no automatic semicolon insertion.',
    'உண்மை, பொய், and வெற்றிடம் are standard globals, not literal keywords.',
    '17 built-in modules are imported by exact Tamil name; user modules are .yaazhi files.',
    'All diagnostics use stable YAAZHICODE_* codes with Tamil-first messages.',
  ],
  stalePublicDocumentation: PROVENANCE.staleSourcesIdentified,
} as const;
