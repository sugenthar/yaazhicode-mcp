# Free hosting options (not deployed)

Nothing in this document has been provisioned. Proposed hostname: `https://yaazhi-code-mcp.<hosting-domain>/mcp`.

## Render (recommended free Node option)

- Use `deploy/render.yaml` as a blueprint or create a Web Service manually.
- Build: `npm install && npm run build`.
- Start: `npm run start:http`.
- Set `HOST=0.0.0.0`, `PORT=10000` (or the platform-provided port), and the exact `YAAZHICODE_MCP_ALLOWED_HOSTS` value.
- Free-tier instances sleep when idle; first request after sleep may be slow.
- Stateless mode is required because instances can restart between requests.

## Vercel (stateless function adapter)

- `deploy/vercel.json` routes `/mcp` to a serverless function.
- Remote Streamable HTTP must remain stateless (`sessionIdGenerator: undefined`).
- Cold starts add latency; body size and maximum duration are bounded by the plan.
- The bundled Node HTTP server cannot be used directly in a serverless function; a Web-standard adapter is needed. The provided `vercel.json` is a starting point, not a verified deployment.

## Docker

```powershell
docker build -f deploy/Dockerfile -t yaazhicode-mcp .
docker run --rm -p 3000:3000 -e HOST=0.0.0.0 -e PORT=3000 `
  -e YAAZHICODE_MCP_ALLOWED_HOSTS=localhost:3000 yaazhicode-mcp
```

## Before any deployment

1. Obtain explicit approval.
2. Verify the client's Streamable HTTP requirements.
3. Configure allowed hosts/origins and rate limits.
4. Run `npm test`, `npm run check:knowledge`, and `npm run verify:examples`.
5. Add authentication at the gateway if the endpoint is public.
