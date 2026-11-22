# Client integrations

MCP client support changes frequently. Verify the exact configuration schema for your installed client version; the examples below are templates, not guarantees.

## Claude Desktop / Cline / Windsurf (stdio)

```json
{
  "mcpServers": {
    "yaazhicode": {
      "command": "node",
      "args": ["<absolute path to repository>/dist/transports/cli.js", "--stdio"]
    }
  }
}
```

## Streamable HTTP client

```json
{
  "mcpServers": {
    "yaazhicode": {
      "type": "http",
      "url": "https://yaazhi-code-mcp.<hosting-domain>/mcp"
    }
  }
}
```

Some clients use `transport: "streamable-http"` or require additional headers. Check their documentation.

## Usage pattern for AI assistants

1. Read `yaazhicode://overview` or call `get_yaazhicode_overview`.
2. Use `list_yaazhicode_keywords`, `get_yaazhicode_syntax`, and `list_yaazhicode_standard_library` before writing code.
3. Draft code, then call `validate_yaazhicode_code`.
4. If invalid, call `explain_yaazhicode_error` and, where available, `suggest_yaazhicode_correction`.
5. Call `analyze_yaazhicode_code` for structure and experimental-feature notices.
6. Only present code after validation passes. State that it was not executed.

## Compatibility notes

- The server uses MCP SDK v1 (`1.32.2`) and advertises tools, resources, prompts, and logging.
- `listChanged` notifications may be reported as enabled by the SDK even though server content is static.
- No authentication is implemented. For public HTTP deployment, place the server behind an authenticated gateway or restrict ingress.
