export interface FeatureStatusEntry {
  readonly feature: string;
  readonly status: 'verified' | 'experimental' | 'planned-or-open';
  readonly detail: string;
}

export const FEATURE_STATUS: readonly FeatureStatusEntry[] = [
  { feature: 'Lexer, parser, semantic analysis, interpreter', status: 'verified', detail: 'Implemented and exercised by the language CLI and its 39 official examples.' },
  { feature: 'Tamil identifiers and $ Tamil numerals', status: 'verified', detail: 'Documented in SPECIFICATION.md §2.2 and §2.4; enforced by the lexer.' },
  { feature: 'Functions, closures, recursion, classes, single inheritance', status: 'verified', detail: 'SPECIFICATION.md §5.4 and §6.' },
  { feature: 'Promises, async functions, and காத்திரு', status: 'verified', detail: 'Genuinely implemented since Phase 2; driven by Interpreter.runAsync().' },
  { feature: '17 built-in modules and sandboxed user modules', status: 'verified', detail: 'SPECIFICATION.md §7 and docs/BUILTIN_MODULES.md.' },
  { feature: 'Structured YAAZHICODE_* diagnostics', status: 'verified', detail: 'Every compiler phase emits stable codes with Tamil-first messages.' },
  { feature: '12 capability switches and filesystem roots', status: 'verified', detail: 'Embedding API; path validation is not an OS-level sandbox.' },
  { feature: 'Generators (செயல்*, வழங்கு)', status: 'experimental', detail: 'The parser accepts the syntax, but semantic analysis reports YAAZHICODE_UNSUPPORTED_GENERATOR. There is no generator execution.' },
  { feature: 'நேரிகள் cooperative timers', status: 'experimental', detail: 'Queue drained only by an explicit இயக்கு() call; no background event loop.' },
  { feature: 'உடன் (with) statement', status: 'experimental', detail: 'Implemented for vocabulary compatibility; not recommended for new code.' },
  { feature: 'பிழைத்திருத்து / yaazhicode debug', status: 'experimental', detail: 'No-op statement / run mode with source-aware stacks; not an interactive debugger.' },
  { feature: 'Temporal dead zone model', status: 'planned-or-open', detail: 'Duplicate and const-reassignment checks exist, but a complete TDZ model is not defined.' },
  { feature: 'Default exports, package resolution, dynamic import', status: 'planned-or-open', detail: 'Explicitly unsupported in 0.1.0.' },
  { feature: 'Type annotations, interfaces, abstract classes', status: 'planned-or-open', detail: 'Reserved spellings exist but are inactive.' },
  { feature: 'Cancellation, async iteration, structured concurrency', status: 'planned-or-open', detail: 'Listed as open language-design questions.' },
  { feature: 'OS-level filesystem jail, remote HTTP hosts', status: 'planned-or-open', detail: 'Open design questions; current behavior is path sandbox and loopback-only networking.' },
] as const;
