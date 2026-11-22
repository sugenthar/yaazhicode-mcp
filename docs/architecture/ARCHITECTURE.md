# Architecture

```
                ┌───────────────────────┐
                │  MCP client (AI app)  │
                └──────────┬────────────┘
         stdio            │          Streamable HTTP
                ┌─────────┴─────────┐
                │ transports/       │
                │  cli · stdio      │
                │  http · security  │
                └─────────┬─────────┘
                          │
                ┌─────────▼─────────┐
                │ server/           │
                │ create-server     │
                │ metadata/instructions
                └─────────┬─────────┘
       ┌──────────────────┼──────────────────┐
       │                  │                  │
┌──────▼──────┐   ┌───────▼───────┐   ┌──────▼──────┐
│ tools/      │   │ resources/    │   │ prompts/    │
│ 18 tools    │   │ 8 resources   │   │ 6 prompts   │
└──────┬──────┘   └───────┬───────┘   └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
       ┌──────────────────▼──────────────────┐
       │ knowledge/ + validation/            │
       │ generated snapshots + official      │
       │ lexer/parser/analyzer (no execution)│
       └──────────────────┬──────────────────┘
                          │
       ┌──────────────────▼──────────────────┐
       │ security/ + shared/                 │
       │ limits, rate limit, redaction,      │
       │ config, logger, results             │
       └─────────────────────────────────────┘
```

## Design decisions

1. **One shared core.** `createServer(config)` builds the same tool/resource/prompt surface for both transports. Transport code only handles I/O, host/origin checks, sessions, and rate limits.
2. **SDK v1.** `@modelcontextprotocol/sdk@1.32.2` is used for broad client compatibility with MCP protocol revisions up to 2025-11-25.
3. **Static validation only.** `validateCode` calls `tokenize`, `parseWithRecovery`, and `analyze` from the published `yaazhicode` package. It never constructs an `Interpreter` and never reads files.
4. **Offline knowledge.** Runtime never reads the reference projects. All facts come from generated TypeScript snapshots in `src/knowledge/data/snapshot.ts`.
5. **Fail-closed security.** Hosts/origins are checked before parsing JSON, bodies and strings are size-limited, and user code is never logged.
6. **No execution.** See [../reference/DOCUMENTATION-GAPS.md](../reference/DOCUMENTATION-GAPS.md) for the rationale.

## Request flow (HTTP stateless)

1. `POST /mcp` → host/origin check → rate-limit check → bounded body read → JSON parse.
2. Create a fresh `McpServer` and `StreamableHTTPServerTransport` with `sessionIdGenerator: undefined`.
3. `transport.handleRequest(req, res, parsedBody)` processes the JSON-RPC message.
4. Tool handlers enforce argument limits, use offline knowledge or the official compiler APIs, and return safe results.
5. `res.on('close')` closes the per-request server.

Stateful mode reuses transports keyed by `Mcp-Session-Id`, applies an idle timeout, and caps active sessions.
