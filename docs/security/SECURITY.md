# Security

## Threat model

The MCP server accepts untrusted text from AI clients. It must not execute it, read arbitrary files, leak environment secrets, or allow resource exhaustion.

## Controls

| Area | Control |
| --- | --- |
| Execution | No interpreter is constructed by any tool. No `eval`, no child process from tool handlers. |
| Filesystem | Tools never open user-supplied paths. Example lookup uses an in-memory index. |
| Input size | HTTP body ≤256 KB; code ≤32 KB; query/prompt fields bounded; result output truncated at 128 KB. |
| Rate limiting | Fixed-window limiter keyed by remote address (or trusted proxy IP). Default 60 requests/minute. |
| Host/origin | HTTP rejects unknown `Host` values and cross-origin requests unless explicitly allowed. |
| Sessions | Stateful mode capped at 128 sessions with 10-minute idle expiry. |
| Logging | Stderr only. Codes, prompts, arguments, tokens, and env values are never logged. |
| Diagnostics | `sourceText`, host paths, and stack traces are stripped before client output. |
| Secrets | No secret env vars are read. Redaction covers common token prefixes and `KEY=value` patterns. |
| Transport | stdio uses no network. HTTP uses plain Node `http`; terminate TLS at a trusted proxy. |

## Deployment cautions

- Do not expose the HTTP endpoint publicly without an authenticating gateway.
- Set `YAAZHICODE_MCP_ALLOWED_HOSTS` and `YAAZHICODE_MCP_ALLOWED_ORIGINS` explicitly in production.
- Set `YAAZHICODE_MCP_TRUST_PROXY=true` only when the immediate proxy is trusted.
- Keep `YAAZHICODE_MCP_STATEFUL=false` on serverless platforms.

## Future execution tool requirements

If execution is ever added, it must be opt-in and use a worker thread that can be forcibly terminated on timeout, `RESTRICTED_CAPABILITIES`, `fileSystemRoots: []`, captured stdio only, no environment/process/network capabilities, no secrets, and no logging of user code.
