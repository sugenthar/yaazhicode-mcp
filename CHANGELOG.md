# Changelog

All notable changes to `@yaazhicode/mcp` are documented here.

## 0.1.0 (initial release)

### Added

- 18 read-only MCP tools for verified YaazhiCode knowledge, example retrieval, validation, static analysis, diagnostic explanation, and conservative corrections.
- 8 MCP resources under the `yaazhicode://` scheme.
- 6 MCP prompts for learning, writing, explaining, debugging, project scaffolding, and teaching.
- Stdio and stateless/stateful Streamable HTTP transports with a `/healthz` endpoint.
- Offline, provenance-tracked knowledge snapshots generated from the read-only YaazhiCode and Web reference projects and `yaazhicode@0.1.0`.
- Security controls: body/code/prompt/result limits, in-memory rate limiting, host/origin checks, session caps, safe diagnostics, and no code logging.
- Comprehensive unit and integration tests covering initialization, tools, resources, prompts, invalid arguments, valid/invalid programs, security limits, and both transports.

### Explicitly not included

- `run_yaazhicode_code` and any other execution capability.
- Remote hosting, deployment accounts, and custom domains; these are separate from npm distribution.
