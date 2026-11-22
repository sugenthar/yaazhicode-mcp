# Verified YaazhiCode 0.1.0 inventory

Source: `YaazhiCode/SPECIFICATION.md`, `docs/KEYWORDS.md`, `docs/STANDARD_LIBRARY.md`, `docs/BUILTIN_MODULES.md`, `docs/LIMITATIONS.md`, and `yaazhicode api --json`.

## Keywords

40 active spellings. `அச்சிடு` is a standard-library function; `மாறும்` is inactive. Correct spellings include `தொடர்`, `இல்லை என்றால்`, `சேர்தல்`, `மேல்`, `எறி`, `இறுதியில்`, `வகை`.

## Identifiers and numerals

- Tamil letters, Tamil marks, Tamil digits, and `_`; NFC normalization; no ASCII letters.
- `$` is the numeral marker only: `$௪௨`, `$௧.௫`, `$௧..$௫`.
- ASCII digits outside strings/comments → `YAAZHICODE_ASCII_NUMBER`.

## Types

`எண், சொல், தர்க்கம், வெற்றிடம், பட்டியல், பொருள், இடையகம், செயல், வகுப்பு, பிழை`.
`உண்மை`, `பொய்`, `வெற்றிடம்` are standard globals, not keywords.

## Standard library and modules

- 85 standard global names; 79 documented native callables.
- 17 built-in modules: `கோப்பு, பாதை, முகவரி, இடையகம், பயன்பாடு, உறுதிப்படுத்து, நேரிகள், உறுதி, நிகழ்வு, வலை, பாதுகாப்புவலை, இயங்குதளம், முனையம், செயல்முறை, வரிவாசிப்பு, மறையியல், ஓடை`.
- 4 instance types with documented members.

## Async and modules

- `ஒத்திசைவற்ற` + `காத்திரு` are genuine, driven by `runAsync`.
- Top-level `காத்திரு` is rejected; generators are diagnosed as unsupported.
- User modules are `.yaazhi` files under filesystem roots; namespaces are read-only; no default/package/dynamic imports.

## Feature boundaries

See `get_yaazhicode_overview` and the `FEATURE_STATUS` data for verified / experimental / planned-or-open classification.
