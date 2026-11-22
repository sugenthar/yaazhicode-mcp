/** Types for the generated, offline YaazhiCode knowledge snapshots. */

export interface ApiSignatureParam {
  readonly name: string;
  readonly type: string;
  readonly rest?: boolean;
  readonly optional?: boolean;
}

export interface ApiSignature {
  readonly params: readonly ApiSignatureParam[];
  readonly returns: string;
  readonly async: boolean;
  readonly summary: string;
  readonly errors: readonly string[];
  readonly overloads: readonly unknown[];
}

export interface ApiCallable {
  readonly name: string;
  readonly minArgs: number;
  readonly maxArgs: number | null;
  readonly signature: ApiSignature | null;
}

export interface ApiModule {
  readonly name: string;
  readonly summary: string;
  readonly errors: readonly string[];
  readonly exports: readonly ApiCallable[];
}

export interface ApiInstanceMember extends ApiCallable {
  readonly kind: string;
}

export interface ApiInstance {
  readonly type: string;
  readonly summary: string;
  readonly members: readonly ApiInstanceMember[];
}

export interface ApiInventory {
  readonly version: string;
  readonly modules: readonly ApiModule[];
  readonly globals: readonly ApiCallable[];
  readonly instances: readonly ApiInstance[];
}

export interface KeywordEntry {
  readonly spelling: string;
  readonly token: string | null;
  readonly status: 'keyword' | 'reserved' | 'identifier';
  readonly category: string;
}

export interface KeywordsSnapshot {
  readonly version: string;
  readonly active: readonly KeywordEntry[];
  readonly inactive: readonly KeywordEntry[];
  readonly activeSpellings: readonly string[];
  readonly counts: Readonly<Record<string, number>>;
}

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly reason?: string;
  readonly suggestion?: string;
}

export interface ExampleValidation {
  readonly ok: boolean;
  readonly phase: 'lexical' | 'syntax' | 'semantic' | null;
  readonly errors: readonly ValidationError[];
}

export interface ExampleSummary {
  readonly en?: string | null;
  readonly ta?: string | null;
}

export interface ExampleEntry {
  readonly id: string;
  readonly title: string;
  readonly titleTa?: string;
  readonly source: 'official' | 'website' | 'website-syntax';
  readonly path?: string;
  readonly category: string;
  readonly summary?: ExampleSummary | null;
  readonly code: string;
  readonly documentedOutput?: string;
  readonly verifiedOutput?: string;
  readonly outputError?: string;
  readonly runCommand?: string;
  readonly validation: ExampleValidation;
  readonly notes: string;
}

export interface ExamplesSnapshot {
  readonly version: string;
  readonly counts: Readonly<Record<string, number>>;
  readonly examples: readonly ExampleEntry[];
}

export interface DiagnosticCodeEntry {
  readonly code: string;
  readonly category: 'lexical' | 'syntax' | 'semantic' | 'runtime' | 'module' | 'standard-library' | 'cli';
  readonly shortExplanation: string | null;
}

export interface DiagnosticsSnapshot {
  readonly version: string;
  readonly note: string;
  readonly codes: readonly DiagnosticCodeEntry[];
}

export interface ProvenanceSource {
  readonly path: string;
  readonly sha256: string | null;
}

export interface ProvenanceSnapshot {
  readonly languageVersion: string;
  readonly mcpPackageVersion: string;
  readonly syncedAt: string;
  readonly git: { readonly yaazhicode: string | null; readonly web: string | null };
  readonly sources: readonly ProvenanceSource[];
  readonly counts: Readonly<Record<string, number>>;
  readonly authoritativeSources: readonly string[];
  readonly staleSourcesIdentified: readonly string[];
}
