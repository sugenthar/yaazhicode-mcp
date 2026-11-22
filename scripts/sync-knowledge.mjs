/**
 * Regenerate the MCP server's offline YaazhiCode knowledge snapshots.
 *
 * This script only READS the local reference projects and the installed
 * `yaazhicode` package. It writes exclusively inside `src/knowledge/data`
 * of this MCP project. It never edits, formats, or builds the language repo.
 *
 * Usage:
 *   node scripts/sync-knowledge.mjs            # regenerate snapshots
 *   node scripts/sync-knowledge.mjs --check    # verify snapshots are current
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  KEYWORDS,
  STANDARD_GLOBAL_NAMES,
  YAAZHICODE_VERSION,
  runCli,
  tokenize,
  parseWithRecovery,
  analyze,
  diagnosticFromLexError,
  Interpreter,
  RESTRICTED_CAPABILITIES,
} from 'yaazhicode';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const MCP_DIR = resolve(SCRIPT_DIR, '..');
const REF_DIR = resolve(MCP_DIR, '..', 'YaazhiCode');
const WEB_DIR = resolve(MCP_DIR, '..', 'Web');
const DATA_DIR = join(MCP_DIR, 'src', 'knowledge', 'data');
const CHECK_ONLY = process.argv.includes('--check');

const OUTPUTS = new Map();

function put(rel, content) {
  OUTPUTS.set(rel, content);
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function read(absolute) {
  return readFileSync(absolute, 'utf8');
}

function json(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function templateLiteral(text) {
  return '`' + text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
}

function gitHead(dir) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function validateSource(source) {
  try {
    tokenize(source);
  } catch (error) {
    const diagnostic = diagnosticFromLexError(error, source);
    return {
      ok: false,
      phase: 'lexical',
      errors: [{
        code: diagnostic.code,
        message: diagnostic.message,
        line: error.line,
        column: error.column,
        reason: diagnostic.reason,
        suggestion: diagnostic.suggestion,
      }],
    };
  }
  const parsed = parseWithRecovery(source);
  if (parsed.errors.length > 0) {
    return {
      ok: false,
      phase: 'syntax',
      errors: parsed.errors.map((d) => ({ code: d.code, message: d.message, line: d.location?.startLine, column: d.location?.startColumn })),
    };
  }
  const result = analyze(parsed.program, { sourceText: source });
  if (result.diagnostics.length > 0) {
    return {
      ok: false,
      phase: 'semantic',
      errors: result.diagnostics.map((d) => ({ code: d.code, message: d.message, line: d.location?.startLine, column: d.location?.startColumn })),
    };
  }
  return { ok: true, phase: null, errors: [] };
}

async function executeSafe(source, filename) {
  const chunks = [];
  const interpreter = new Interpreter({
    capabilities: { ...RESTRICTED_CAPABILITIES, stdio: true },
    cwd: MCP_DIR,
    filename,
    sourceText: source,
    stdout: (text) => chunks.push(text),
    fileSystemRoots: [],
  });
  const program = parseWithRecovery(source).program;
  await interpreter.runAsync(program);
  return chunks.join('');
}

// ---------------------------------------------------------------------------
// API inventory (authoritative output of the language's own CLI)
// ---------------------------------------------------------------------------
let apiText = '';
runCli(['api', '--json'], { stdout: (text) => { apiText += text; } });
const apiInventory = JSON.parse(apiText);
if (apiInventory.version !== YAAZHICODE_VERSION) {
  throw new Error(`Version mismatch: CLI says ${apiInventory.version}, package says ${YAAZHICODE_VERSION}`);
}
put('api-inventory.json', json(apiInventory));

// ---------------------------------------------------------------------------
// Keyword registry
// ---------------------------------------------------------------------------
const keywordsSnapshot = {
  version: YAAZHICODE_VERSION,
  active: KEYWORDS.filter((k) => k.status === 'keyword'),
  inactive: KEYWORDS.filter((k) => k.status !== 'keyword'),
  activeSpellings: KEYWORDS.filter((k) => k.status === 'keyword').map((k) => k.spelling),
  counts: {
    total: KEYWORDS.length,
    active: KEYWORDS.filter((k) => k.status === 'keyword').length,
    reserved: KEYWORDS.filter((k) => k.status === 'reserved').length,
    identifier: KEYWORDS.filter((k) => k.status === 'identifier').length,
    standardGlobals: STANDARD_GLOBAL_NAMES.length,
    apiGlobals: apiInventory.globals.length,
  },
};
put('keywords.json', json(keywordsSnapshot));

// ---------------------------------------------------------------------------
// Examples (official repository + website source content)
// ---------------------------------------------------------------------------
const SAFE_EXECUTE = new Set([
  'வணக்கம்.yaazhi',
  'கட்டுப்பாடு.yaazhi',
  'தொகுப்புகள்.yaazhi',
  'வகுப்புகள்.yaazhi',
  'hello-world',
  'variables',
  'conditions',
  'loops',
  'functions',
  'arrays',
  'objects',
  'practical',
  'hello',
]);

const examples = [];
const officialRoot = join(REF_DIR, 'examples');
for (const file of walk(officialRoot).filter((f) => extname(f) === '.yaazhi').sort()) {
  const rel = relative(officialRoot, file).replace(/\\/g, '/');
  const source = read(file);
  const validation = validateSource(source);
  let verifiedOutput;
  let outputError;
  if (SAFE_EXECUTE.has(rel.split('/').pop()) && validation.ok) {
    try {
      verifiedOutput = await executeSafe(source, rel);
    } catch (error) {
      outputError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
  }
  examples.push({
    id: `official:${rel}`,
    title: rel.replace(/\.yaazhi$/, '').replace(/[\\/]/g, ' / '),
    source: 'official',
    path: rel,
    category: rel.includes('/') ? rel.split('/')[0] : 'basics',
    code: source,
    validation,
    verifiedOutput,
    outputError,
    notes: 'Output was captured by executing only curated, side-effect-free examples with restricted capabilities and an empty filesystem root.',
  });
}

const webExamples = await import(pathToFileURL(join(WEB_DIR, 'src', 'content', 'examplesData.js')).href);
for (const item of webExamples.examples) {
  const validation = validateSource(item.code);
  let verifiedOutput;
  let outputError;
  if (SAFE_EXECUTE.has(item.id) && validation.ok && item.id !== 'input' && item.id !== 'file-operations') {
    try {
      verifiedOutput = await executeSafe(item.code, `${item.id}.yaazhi`);
    } catch (error) {
      outputError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    }
  }
  examples.push({
    id: `website:${item.id}`,
    title: item.title?.en ?? item.id,
    titleTa: item.title?.ta,
    source: 'website',
    category: item.category,
    summary: item.summary,
    code: item.code,
    documentedOutput: item.output,
    verifiedOutput,
    outputError,
    runCommand: item.run,
    validation,
    notes: 'Website content file Web/src/content/examplesData.js; output is recorded only when independently captured by this sync script.',
  });
}

const webLanguage = await import(pathToFileURL(join(WEB_DIR, 'src', 'content', 'languageData.js')).href);
for (const item of webLanguage.syntaxExamples) {
  const validation = validateSource(item.code);
  let verifiedOutput;
  if (SAFE_EXECUTE.has(item.id) && validation.ok) {
    try {
      verifiedOutput = await executeSafe(item.code, `${item.id}.yaazhi`);
    } catch {
      // Keep the entry without verified output.
    }
  }
  examples.push({
    id: `syntax:${item.id}`,
    title: item.title?.en ?? item.id,
    titleTa: item.title?.ta,
    source: 'website-syntax',
    category: 'syntax',
    summary: item.note,
    code: item.code,
    verifiedOutput,
    validation,
    notes: 'Website content file Web/src/content/languageData.js.',
  });
}

const examplesSnapshot = {
  version: YAAZHICODE_VERSION,
  counts: {
    total: examples.length,
    official: examples.filter((e) => e.source === 'official').length,
    website: examples.filter((e) => e.source === 'website').length,
    syntax: examples.filter((e) => e.source === 'website-syntax').length,
    allValid: examples.filter((e) => e.validation.ok).length,
  },
  examples,
};
put('examples.json', json(examplesSnapshot));

// ---------------------------------------------------------------------------
// Diagnostic code catalog (extracted from the language source, not guessed)
// ---------------------------------------------------------------------------
const codeSet = new Set();
for (const file of walk(join(REF_DIR, 'src')).filter((f) => f.endsWith('.ts'))) {
  for (const match of read(file).matchAll(/YAAZHICODE_[A-Z_]+/g)) codeSet.add(match[0]);
}
function categoryOf(code) {
  if (/LEX|CHARACTER|NUMERAL|ESCAPE|STRING|COMMENT|ASCII|BARE/.test(code)) return 'lexical';
  if (/SYNTAX|INCOMPLETE|MODULE_SPECIFIER|MODULE_EXTENSION/.test(code)) return 'syntax';
  if (/UNDEFINED|SEMANTIC|CONST_RE|AWAIT_OUTSIDE|ASYNC_MODULE|BREAK_OUTSIDE|CONTINUE_OUTSIDE|RETURN_OUTSIDE|THIS_OUTSIDE|SUPER_OUTSIDE|DUPLICATE|INVALID_SUPER|NOT_A_CLASS|UNKNOWN_EXPORT|YIELD_OUTSIDE|UNSUPPORTED_GENERATOR/.test(code)) return 'semantic';
  if (/^YAAZHICODE_MODULE/.test(code)) return 'module';
  if (/CLI|INIT|PROJECT_CONFIG|TEST_|IDE_|WATCH|REPL|MIGRATE|PACKAGE_ROOT|FORMAT_DIFF|VERSION/.test(code)) return 'cli';
  if (/FILE|FS_|PATH|NETWORK|BUFFER|CRYPTO|DATE|ROUTE|STATIC|JSON|URL|READER|TIMER|CAPABILITY|UNKNOWN_MEMBER|MODULE_MEMBER/.test(code)) return 'standard-library';
  return 'runtime';
}
const lexicalNotes = {
  YAAZHICODE_ASCII_NUMBER: 'ASCII இலக்கங்கள் (0-9) YaazhiCode மூலத்தில் எண் மதிப்புகளாக ஏற்கப்படுவதில்லை. 201 என்பதற்குப் பதிலாக $௨௦௧ என எழுதவும்.',
  YAAZHICODE_BARE_TAMIL_DIGIT: 'தமிழ் இலக்கங்களை எண் மதிப்பாகப் பயன்படுத்த $ குறி தேவை; உதாரணம் $௧௨.',
  YAAZHICODE_BAD_NUMERAL: '$ குறிக்குப் பிறகு சரியான தமிழ் இலக்கங்கள் தேவை; தசமத்தில் இரு புறமும் இலக்கம் இருக்க வேண்டும்.',
  YAAZHICODE_UNEXPECTED_CHARACTER: 'YaazhiCode மூலத்தில் தமிழ் எழுத்துகள், _, $, சரங்கள், குறியீடுகள் மட்டுமே அனுமதிக்கப்படுகின்றன.',
  YAAZHICODE_INVALID_ESCAPE: 'சரங்களில் \\\\, \\", \\n, \\r, \\t மட்டுமே அனுமதிக்கப்படும்.',
  YAAZHICODE_UNTERMINATED_STRING: 'இரட்டை மேற்கோளுடன் தொடங்கிய சர் மூடப்படவில்லை.',
  YAAZHICODE_UNTERMINATED_COMMENT: '/* உடன் தொடங்கிய விளக்கம் */ உடன் மூடப்படவில்லை.',
};
const diagnosticsSnapshot = {
  version: YAAZHICODE_VERSION,
  note: 'Codes are extracted from the YaazhiCode 0.1.0 source. For the authoritative Tamil message, reason, suggestion, and example, validate the actual code with the compiler rather than relying on these short labels.',
  codes: [...codeSet].sort().map((code) => ({
    code,
    category: categoryOf(code),
    shortExplanation: lexicalNotes[code] ?? null,
  })),
};
put('diagnostics.json', json(diagnosticsSnapshot));

// ---------------------------------------------------------------------------
// Specification snapshot and provenance
// ---------------------------------------------------------------------------
const specPath = join(REF_DIR, 'SPECIFICATION.md');
const specificationMarkdown = read(specPath);
put('specification.md', specificationMarkdown);

const provenanceFiles = [
  [REF_DIR, 'package.json'],
  [REF_DIR, 'SPECIFICATION.md'],
  [REF_DIR, 'docs/KEYWORDS.md'],
  [REF_DIR, 'docs/STANDARD_LIBRARY.md'],
  [REF_DIR, 'docs/BUILTIN_MODULES.md'],
  [REF_DIR, 'docs/LIMITATIONS.md'],
  [REF_DIR, 'docs/MODULES.md'],
  [REF_DIR, 'docs/NUMERALS.md'],
  [REF_DIR, 'docs/CLI.md'],
  [WEB_DIR, 'src/content/languageData.js'],
  [WEB_DIR, 'src/content/examplesData.js'],
  [WEB_DIR, 'public/llms.txt'],
  [WEB_DIR, 'public/llms-full.txt'],
  [WEB_DIR, 'public/yaazhicode-spec.json'],
];
const existingProvenancePath = join(DATA_DIR, 'provenance.json');
const previousSyncedAt = existsSync(existingProvenancePath)
  ? JSON.parse(read(existingProvenancePath)).syncedAt
  : undefined;
const provenanceSnapshot = {
  languageVersion: YAAZHICODE_VERSION,
  mcpPackageVersion: JSON.parse(read(join(MCP_DIR, 'package.json'))).version,
  syncedAt: previousSyncedAt ?? new Date().toISOString(),
  git: {
    yaazhicode: gitHead(REF_DIR),
    web: gitHead(WEB_DIR),
  },
  sources: provenanceFiles.map(([root, rel]) => {
    const full = join(root, rel);
    return {
      path: `${root === REF_DIR ? 'YaazhiCode' : 'Web'}/${rel.replace(/\\/g, '/')}`,
      sha256: existsSync(full) ? sha256(read(full)) : null,
    };
  }),
  counts: {
    activeKeywords: KEYWORDS.filter((k) => k.status === 'keyword').length,
    standardGlobalNames: STANDARD_GLOBAL_NAMES.length,
    apiGlobals: apiInventory.globals.length,
    builtinModules: apiInventory.modules.length,
    instanceTypes: apiInventory.instances.length,
    examples: examples.length,
    diagnosticCodes: codeSet.size,
  },
  authoritativeSources: [
    'YaazhiCode/SPECIFICATION.md',
    'YaazhiCode/docs/KEYWORDS.md',
    'YaazhiCode/src/lexer/keywords.ts',
    'YaazhiCode/docs/STANDARD_LIBRARY.md',
    'YaazhiCode/docs/BUILTIN_MODULES.md',
    'YaazhiCode/docs/LIMITATIONS.md',
    'yaazhicode api --json',
  ],
  staleSourcesIdentified: [
    'Web/public/llms.txt',
    'Web/public/llms-full.txt',
    'Web/public/yaazhicode-spec.json',
    'Web/public/docs/AI_CODING_GUIDE.md',
  ],
};
put('provenance.json', json(provenanceSnapshot));

// ---------------------------------------------------------------------------
// A single TypeScript snapshot module is what the server actually imports.
// The JSON/Markdown files above remain as human-readable, auditable artifacts.
// ---------------------------------------------------------------------------
const snapshotSource = [
  '// Generated by scripts/sync-knowledge.mjs. Do not edit by hand.',
  '/* eslint-disable */',
  "import type { ApiInventory, DiagnosticsSnapshot, ExamplesSnapshot, KeywordsSnapshot, ProvenanceSnapshot } from '../types.js';",
  '',
  `export const API_INVENTORY: ApiInventory = ${json(apiInventory).trim()};`,
  '',
  `export const KEYWORDS_SNAPSHOT: KeywordsSnapshot = ${json(keywordsSnapshot).trim()};`,
  '',
  `export const EXAMPLES_SNAPSHOT: ExamplesSnapshot = ${json(examplesSnapshot).trim()};`,
  '',
  `export const DIAGNOSTICS_SNAPSHOT: DiagnosticsSnapshot = ${json(diagnosticsSnapshot).trim()};`,
  '',
  `export const PROVENANCE: ProvenanceSnapshot = ${json(provenanceSnapshot).trim()};`,
  '',
  `export const SPECIFICATION_MARKDOWN: string = ${templateLiteral(specificationMarkdown)};`,
  '',
].join('\n');
put('snapshot.ts', snapshotSource);

// ---------------------------------------------------------------------------
// Write or verify
// ---------------------------------------------------------------------------
mkdirSync(DATA_DIR, { recursive: true });
let allMatch = true;
for (const [rel, content] of OUTPUTS) {
  const full = join(DATA_DIR, rel);
  const existing = existsSync(full) ? read(full) : null;
  if (CHECK_ONLY) {
    const match = existing === content;
    if (!match) {
      allMatch = false;
      console.error(`STALE: ${rel}`);
    }
  } else {
    writeFileSync(full, content, 'utf8');
  }
}
if (CHECK_ONLY) {
  if (!allMatch) process.exitCode = 1;
  else console.log(`Knowledge snapshots are current (${OUTPUTS.size} files).`);
} else {
  console.log(`Wrote ${OUTPUTS.size} knowledge snapshot files to ${DATA_DIR}`);
}
