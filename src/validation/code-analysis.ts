import { collectNodes, parseWithRecovery, tokenize, type AnyAstNode } from 'yaazhicode';
import type { SafeDiagnostic } from '../security/redaction.js';
import { validateCode } from './validate.js';

export interface CodeAnalysis {
  readonly valid: boolean;
  readonly diagnostics: readonly SafeDiagnostic[];
  readonly metrics: {
    readonly lines: number;
    readonly characters: number;
    readonly astNodes: number;
    readonly functions: number;
    readonly classes: number;
    readonly asyncFunctions: number;
    readonly imports: number;
    readonly exports: number;
    readonly calls: number;
    readonly identifiers: number;
  };
  readonly importedSpecifiers: readonly string[];
  readonly constructs: readonly string[];
  readonly notices: readonly string[];
  readonly limitations: readonly string[];
}

const CONSTRUCT_KINDS: Readonly<Record<string, string>> = {
  IfStatement: 'conditional',
  WhileStatement: 'while loop',
  DoWhileStatement: 'do-while loop',
  ForStatement: 'for loop',
  ForInStatement: 'for-in loop',
  SwitchStatement: 'switch',
  TryStatement: 'try/catch/finally',
  WithStatement: 'with',
  AwaitExpression: 'await',
  YieldExpression: 'yield',
  ClassDeclaration: 'class',
  FunctionDeclaration: 'function',
};

export function analyzeCode(source: string): CodeAnalysis {
  const validation = validateCode(source);
  const diagnostics = validation.diagnostics;
  const notices: string[] = [];
  const limitations: string[] = [];
  let nodes: AnyAstNode[] = [];

  if (validation.valid) {
    // A valid report guarantees tokenization and parsing succeed.
    tokenize(source);
    const parsed = parseWithRecovery(source);
    nodes = collectNodes(parsed.program);
    const kinds = new Set<string>(nodes.map((node) => node.kind));
    const constructs = [...Object.entries(CONSTRUCT_KINDS)]
      .filter(([kind]) => kinds.has(kind))
      .map(([, label]) => label);

    if (kinds.has('YieldExpression')) {
      limitations.push('வழங்கு/Yield parses but generator execution is unsupported (YAAZHICODE_UNSUPPORTED_GENERATOR).');
    }
    if (kinds.has('AwaitExpression')) {
      notices.push('காத்திரு is used; it only works inside an ஒத்திசைவற்ற function driven by runAsync.');
    }
    if (kinds.has('WithStatement')) {
      notices.push('உடன் is implemented but not recommended for new code.');
    }
    if (kinds.has('DebuggerStatement')) {
      notices.push('பிழைத்திருத்து is accepted as a no-op; there is no interactive debugger.');
    }

    const imports = nodes.filter((node) => node.kind === 'ImportDeclaration') as Array<{ source: { value?: string } }>;
    const importedSpecifiers = imports.map((node) => String(node.source?.value ?? '')).filter(Boolean);

    const asyncFunctions = nodes.filter((node) =>
      (node.kind === 'FunctionDeclaration' || node.kind === 'FunctionExpression') &&
      (node as { isAsync?: boolean }).isAsync === true,
    ).length;

    return {
      valid: true,
      diagnostics,
      metrics: {
        lines: source.split(/\r\n|\r|\n/).length,
        characters: source.length,
        astNodes: nodes.length,
        functions: nodes.filter((node) => node.kind === 'FunctionDeclaration' || node.kind === 'FunctionExpression').length,
        classes: nodes.filter((node) => node.kind === 'ClassDeclaration' || node.kind === 'ClassExpression').length,
        asyncFunctions,
        imports: imports.length,
        exports: nodes.filter((node) => node.kind === 'ExportDeclaration').length,
        calls: nodes.filter((node) => node.kind === 'CallExpression' || node.kind === 'NewExpression').length,
        identifiers: nodes.filter((node) => node.kind === 'Identifier').length,
      },
      importedSpecifiers,
      constructs,
      notices,
      limitations,
    };
  }

  return {
    valid: false,
    diagnostics,
    metrics: {
      lines: source.split(/\r\n|\r|\n/).length,
      characters: source.length,
      astNodes: 0,
      functions: 0,
      classes: 0,
      asyncFunctions: 0,
      imports: 0,
      exports: 0,
      calls: 0,
      identifiers: 0,
    },
    importedSpecifiers: [],
    constructs: [],
    notices: ['Static analysis stopped because the code did not pass validation.'],
    limitations: [],
  };
}
