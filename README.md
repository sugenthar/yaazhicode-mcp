# @yaazhicode/mcp

Official Model Context Protocol server for **YaazhiCode 0.1.0**. It gives compatible AI clients authoritative Tamil language knowledge, verified examples, static validation, structural analysis, and diagnostic explanations.

> **No deployment or npm publish has been performed.** This repository is local-only until explicit approval.

## What it does

- **18 tools** for language facts, examples, validation, explanation, analysis, and conservative corrections.
- **8 resources** (`yaazhicode://…`) for overview, specification, keywords, syntax, standard library, examples, diagnostics, and version.
- **6 prompts** for learning, writing, explaining, debugging, scaffolding, and teaching YaazhiCode.
- **Two transports**: local stdio (default) and remote Streamable HTTP (`/mcp`, plus `/healthz`).
- **Offline, versioned knowledge** generated from the read-only language repository and the published `yaazhicode@0.1.0` package.
- **No code execution.** `run_yaazhicode_code` is deliberately not implemented.

## Why no execution tool

The public web execution endpoint restricts capabilities but runs interpreter code in-process; its `Promise.race` timeout cannot interrupt a synchronous interpreter loop. Submitting user code to a third-party service also raises privacy concerns. A future execution tool should use a worker thread that can be terminated, explicit opt-in, empty filesystem roots, captured stdio only, and no secrets.

## Quick start (local, no publishing required)

```powershell
cd "D:\YaazhiCode\YaazhiCode MCP"
npm install
npm run build
npm run start:stdio
```

Point your MCP client at `node dist/transports/cli.js --stdio` in this directory.

Remote HTTP:

```powershell
$env:PORT = "3000"
$env:HOST = "127.0.0.1"
npm run start:http
```

Endpoint: `POST /mcp` (Streamable HTTP), `GET /healthz`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm test` | Unit + integration tests (stdio and HTTP). |
| `npm run sync:knowledge` | Regenerate offline knowledge from the read-only reference projects. |
| `npm run check:knowledge` | Fail if committed snapshots are stale. |
| `npm run verify:examples` | Revalidate every captured example with the installed compiler. |

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md)
- [Knowledge sync](docs/architecture/KNOWLEDGE-SYNC.md)
- [Local stdio setup](docs/installation/LOCAL-STDIO.md)
- [Remote HTTP setup](docs/installation/REMOTE-HTTP.md)
- [Client integrations](docs/integrations/README.md)
- [Tools](docs/api/TOOLS.md), [Resources](docs/api/RESOURCES.md), [Prompts](docs/api/PROMPTS.md)
- [Security](docs/security/SECURITY.md)
- [Free hosting options](docs/hosting/FREE-HOSTING.md)
- [Language inventory](docs/reference/LANGUAGE-INVENTORY.md)
- [Documentation gaps](docs/reference/DOCUMENTATION-GAPS.md)

## License

MIT. See [LICENSE](LICENSE).
