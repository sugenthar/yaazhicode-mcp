# Remote Streamable HTTP installation

The HTTP transport implements MCP Streamable HTTP at `POST /mcp`, with `GET /healthz` for health checks.

## Start locally

```powershell
$env:HOST = "127.0.0.1"
$env:PORT = "3000"
$env:YAAZHICODE_MCP_ALLOWED_HOSTS = "127.0.0.1:3000"
npm run start:http
```

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address. Use `0.0.0.0` only behind a trusted proxy. |
| `PORT` | `3000` | Listen port. |
| `YAAZHICODE_MCP_ALLOWED_HOSTS` | empty | Comma-separated exact `Host` header values. Required for non-local deployment. |
| `YAAZHICODE_MCP_ALLOWED_ORIGINS` | empty | Comma-separated allowed origins. Empty means same-origin only. |
| `YAAZHICODE_MCP_TRUST_PROXY` | `false` | Use `X-Forwarded-For` for the rate-limit key. Enable only behind a trusted proxy. |
| `YAAZHICODE_MCP_STATEFUL` | `false` | Enable session reuse via `Mcp-Session-Id`. |
| `YAAZHICODE_MCP_MAX_SESSIONS` | `128` | Maximum concurrent stateful sessions. |
| `YAAZHICODE_MCP_SESSION_IDLE_MS` | `600000` | Idle session expiry. |
| `YAAZHICODE_MCP_MAX_BODY_BYTES` | `262144` | HTTP body limit. |
| `YAAZHICODE_MCP_MAX_CODE_CHARS` | `32768` | Maximum code argument length. |
| `YAAZHICODE_MCP_RATE_LIMIT_PER_MIN` | `60` | Requests per client per minute. |
| `YAAZHICODE_MCP_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, or `error`. |

No secrets are read by the server. Do not put credentials in these variables.

## Modes

- **Stateless (default).** Each request creates a fresh server and transport. Recommended for serverless and horizontal scaling. It is compatible with clients that do not require a persistent session.
- **Stateful.** Set `YAAZHICODE_MCP_STATEFUL=true`. The first `initialize` request receives an `Mcp-Session-Id`; later requests must include it. `DELETE /mcp` closes a session.

## Client URL

Proposed URL once deployed (not yet deployed): `https://yaazhi-code-mcp.<hosting-domain>/mcp`.

Clients must support Streamable HTTP and send `Accept: application/json, text/event-stream`. Verify your client's exact configuration format before publishing copy-ready instructions.
