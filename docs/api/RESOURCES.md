# Resources (8)

| URI | MIME type | Content |
| --- | --- | --- |
| `yaazhicode://overview` | application/json | Verified overview and stale-document warnings. |
| `yaazhicode://specification` | text/markdown | Full specification snapshot. |
| `yaazhicode://keywords` | application/json | Keyword registry snapshot. |
| `yaazhicode://syntax` | application/json | Syntax sections, operators, unsupported constructs. |
| `yaazhicode://standard-library` | application/json | Module/global/instance summary. |
| `yaazhicode://examples` | application/json | All verified examples. |
| `yaazhicode://diagnostics` | application/json | Diagnostic code catalog. |
| `yaazhicode://version` | application/json | Versions, git heads, source hashes. |

Resources are read-only and static for the lifetime of the process. Subscription and list-changed notifications are not used for content updates; clients should re-read after a server upgrade.
