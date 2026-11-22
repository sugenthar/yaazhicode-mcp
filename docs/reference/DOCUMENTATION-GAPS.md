# Public documentation gaps

The following public files are stale and must not be used as language facts:

- `Web/public/llms.txt`
- `Web/public/llms-full.txt`
- `Web/public/yaazhicode-spec.json`
- `Web/public/docs/AI_CODING_GUIDE.md`

## Incorrect spellings

| Stale | Correct |
| --- | --- |
| `தொடரு` | `தொடர்` |
| `இல்லையெனில்` | `இல்லை என்றால்` / `இல்லை` |
| `மரபுரிமை` | `சேர்தல்` |
| `முதன்மை` | `புதிய` |
| `வீசு` | `எறி` |
| `இறுதியாக` | `இறுதியில்` |
| `வகையறி` | `வகை` |

## False claims

- `$` is **not** valid inside identifiers.
- Modules such as `கணிதம்`, `உரை`, `பட்டியல்`, `நேரம்`, `கணினி`, `குறியாக்கம்`, `வடிவம்`, `பிழை`, `சுழற்சி`, `நினைவகம்`, `வழி`, `தரவு`, and `வலை_வாடிக்கையாளர்` do not exist.
- “Verified standalone programs” in the stale documents contain invalid syntax and would fail validation.

## Accurate public sources

`Web/src/content/languageData.js` and `Web/src/content/examplesData.js` are current: all 19 snippets validated successfully during knowledge sync.

## MCP response

The server embeds these corrections in `get_yaazhicode_overview`, `yaazhicode://overview`, and the `teach_yaazhicode` prompt, and instructs clients to ignore the stale files.
