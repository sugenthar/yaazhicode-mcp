# Tools (18)

All tools are read-only. None executes YaazhiCode code.

| Tool | Arguments | Purpose |
| --- | --- | --- |
| `get_yaazhicode_overview` | — | Verified facts, version, stale-doc warnings. |
| `get_yaazhicode_version` | — | Language/MCP versions, snapshot date, git heads, hashes. |
| `get_yaazhicode_spec` | `section?` | Full specification or one numbered section. |
| `list_yaazhicode_keywords` | `scope?` | 40 active, inactive, or all registry entries. |
| `get_yaazhicode_syntax` | `topic?` | Syntax sections with checked examples. |
| `list_yaazhicode_data_types` | — | Ten runtime types and truthiness rules. |
| `list_yaazhicode_operators` | — | Supported and explicitly unsupported operators. |
| `list_yaazhicode_standard_library` | `detail?` | Modules, globals, instances, or summary. |
| `list_yaazhicode_functions` | `name` | Exact API lookup with arity and signature. |
| `get_yaazhicode_control_flow` | — | Verified conditionals, loops, switch. |
| `list_yaazhicode_errors` | `category?` | All stable diagnostic codes. |
| `list_yaazhicode_examples` | `source?`, `category?`, `limit?` | Verified example metadata. |
| `get_yaazhicode_example` | `id` | Full source and captured output where available. |
| `search_yaazhicode_examples` | `query`, `source?`, `limit?` | Search examples. |
| `validate_yaazhicode_code` | `code`, `filename?` | Lex + parse + semantic analysis. Returns `valid`. |
| `explain_yaazhicode_error` | `code?`, `source?` | Explain a code or the diagnostics of supplied code. |
| `analyze_yaazhicode_code` | `code` | AST metrics, constructs, imports, notices. |
| `suggest_yaazhicode_correction` | `code` | Conservative, revalidated corrections or guidance. |

## Validation contract

`validate_yaazhicode_code` returns:

```json
{
  "valid": false,
  "phase": "lexical",
  "diagnostics": [{
    "code": "YAAZHICODE_ASCII_NUMBER",
    "category": "lexical",
    "message": "…",
    "location": { "startLine": 1, "startColumn": 12, "endLine": 1, "endColumn": 13 },
    "reason": "…",
    "suggestion": "…",
    "example": "…"
  }],
  "summary": { "errors": 1, "warnings": 0, "firstCode": "YAAZHICODE_ASCII_NUMBER" }
}
```

The full source text is never echoed back. Never claim generated code is valid unless `valid` is `true`.

## Explicitly absent

`run_yaazhicode_code` is not registered. Calls to it receive an MCP “tool not found” error.
