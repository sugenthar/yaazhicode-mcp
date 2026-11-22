/** Re-validate every captured example against the installed YaazhiCode compiler. */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze, parseWithRecovery, tokenize } from 'yaazhicode';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src', 'knowledge', 'data', 'examples.json');
const snapshot = JSON.parse(readFileSync(file, 'utf8'));
let failures = 0;

for (const example of snapshot.examples) {
  try {
    tokenize(example.code);
    const parsed = parseWithRecovery(example.code);
    if (parsed.errors.length > 0) throw new Error(parsed.errors[0].code);
    const analyzed = analyze(parsed.program, { sourceText: example.code });
    if (analyzed.diagnostics.length > 0) throw new Error(analyzed.diagnostics[0].code);
  } catch (error) {
    failures++;
    console.error(`INVALID ${example.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures > 0) {
  console.error(`${failures} of ${snapshot.examples.length} captured examples no longer validate.`);
  process.exitCode = 1;
} else {
  console.log(`All ${snapshot.examples.length} captured examples validate.`);
}
