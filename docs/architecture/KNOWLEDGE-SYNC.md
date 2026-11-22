# Knowledge sync

The public AI documents (`llms.txt`, `llms-full.txt`, `yaazhicode-spec.json`, and the AI coding guide on the website) are stale. The MCP server therefore uses generated snapshots from authoritative sources.

## Authoritative sources

Paths below assume the sibling checkout layout (`YaazhiCode/`, `Web/`, and this repository side by side) used by `scripts/sync-knowledge.mjs`. The running server never reads them.

- `../YaazhiCode/SPECIFICATION.md`
- `../YaazhiCode/docs/KEYWORDS.md`
- `../YaazhiCode/src/lexer/keywords.ts` (via the installed package registry)
- `../YaazhiCode/docs/STANDARD_LIBRARY.md`, `BUILTIN_MODULES.md`, `LIMITATIONS.md`, `MODULES.md`, `NUMERALS.md`, `CLI.md`
- `yaazhicode api --json` from `yaazhicode@0.1.0`
- `../Web/src/content/languageData.js` and `examplesData.js` (current website source content)

## Generated files

`scripts/sync-knowledge.mjs` writes only inside `src/knowledge/data`:

| File | Content |
| --- | --- |
| `api-inventory.json` | Raw `api --json` output: 17 modules, 79 native globals, 4 instance types. |
| `keywords.json` | 40 active + 10 inactive registry entries and counts. |
| `examples.json` | 39 official, 10 website, and 9 syntax examples, each revalidated; 15 have captured output. |
| `diagnostics.json` | All `YAAZHICODE_*` codes extracted from the compiler source. |
| `specification.md` | Verbatim specification snapshot. |
| `provenance.json` | Versions, git heads, SHA-256 of every source file, sync date, counts. |
| `snapshot.ts` | Typed TypeScript module imported by the server. |

The reference projects are opened read-only. The sync script never writes to them, never runs `npm install` there, and never formats their code.

## Regenerating

```powershell
npm run sync:knowledge
npm run check:knowledge
npm run verify:examples
```

`--check` compares regenerated content byte-for-byte with committed files and fails on drift. `syncedAt` is preserved across runs so the check is deterministic.

## Version policy

- The snapshot records the exact language version (`0.1.0`) and source hashes.
- If the language version changes, regenerate the snapshot and update the MCP package version only after re-running the full test suite.
- `get_yaazhicode_version` and `yaazhicode://version` expose this provenance to clients.
