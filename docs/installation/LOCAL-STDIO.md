# Local stdio installation

## From this repository

Requirements: Node.js `>=22.18.0` and npm.

```powershell
cd "D:\YaazhiCode\YaazhiCode MCP"
npm install
npm run build
npm run start:stdio
```

For development without compiling:

```powershell
npx tsx src/transports/cli.ts --stdio
```

## Client configuration examples

Claude Desktop / Cline / Windsurf style configuration (verify the exact field names for your client version):

```json
{
  "mcpServers": {
    "yaazhicode": {
      "command": "node",
      "args": ["D:\\YaazhiCode\\YaazhiCode MCP\\dist\\transports\\cli.js", "--stdio"],
      "env": {
        "YAAZHICODE_MCP_LOG_LEVEL": "error"
      }
    }
  }
}
```

Generic JSON config is also provided under `examples/configs/`.

## Notes

- The server writes protocol messages to stdout and logs only to stderr.
- No network access, filesystem access, or code execution is performed by tool handlers.
- `YAAZHICODE_MCP_MAX_CODE_CHARS` defaults to 32768. Oversized code arguments are rejected.
