# Prompts (6)

| Prompt | Arguments | Behavior |
| --- | --- | --- |
| `learn_yaazhicode` | `focus?` | Structured introduction with verified keyword/syntax digest. |
| `write_yaazhicode_program` | `task`, `constraints?` | Requires validation and analysis before returning code. |
| `explain_yaazhicode_program` | `code` | Validates first, then explains structure and semantics. |
| `debug_yaazhicode_program` | `code`, `error?` | Uses validation and explanation tools; never invents meanings. |
| `create_yaazhicode_project` | `purpose` | Project layout using verified module/test rules. |
| `teach_yaazhicode` | `level?`, `topic?` | Lesson plan with corrections for stale public docs. |

Prompts inject verified knowledge snapshots into the model context. They are instructions to the client/model, not server-side code generation or execution.
