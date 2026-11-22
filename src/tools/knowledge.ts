import { z } from 'zod';
import {
  API_INVENTORY,
  CONTROL_FLOW,
  DATA_TYPES,
  DIAGNOSTICS_SNAPSHOT,
  KEYWORDS_SNAPSHOT,
  LANGUAGE_OVERVIEW,
  OPERATORS,
  PROVENANCE,
  SPECIFICATION_MARKDOWN,
  SYNTAX_SECTIONS,
  UNSUPPORTED_OPERATORS,
  findApiEntry,
  listGlobals,
  listInstances,
  listModules,
  standardLibrarySummary,
} from '../knowledge/index.js';
import { jsonResult, ok } from '../shared/result.js';
import type { ToolDefinition } from './types.js';

const empty = {};

export const knowledgeTools: readonly ToolDefinition[] = [
  {
    name: 'get_yaazhicode_overview',
    title: 'YaazhiCode overview',
    description: 'Return verified high-level facts about the YaazhiCode language, its version, source of truth, and known stale public documentation.',
    inputSchema: empty,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: () => jsonResult(LANGUAGE_OVERVIEW, { overview: LANGUAGE_OVERVIEW }),
  },
  {
    name: 'get_yaazhicode_version',
    title: 'YaazhiCode version',
    description: 'Return the exact YaazhiCode language version, MCP server version, knowledge snapshot date, and source hashes.',
    inputSchema: empty,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: () => jsonResult({
      languageVersion: PROVENANCE.languageVersion,
      mcpPackageVersion: PROVENANCE.mcpPackageVersion,
      syncedAt: PROVENANCE.syncedAt,
      git: PROVENANCE.git,
      counts: PROVENANCE.counts,
      sources: PROVENANCE.sources,
    }),
  },
  {
    name: 'get_yaazhicode_spec',
    title: 'YaazhiCode specification',
    description: 'Return the authoritative specification snapshot. Optionally request a single numbered section (for example "2.4" or "7").',
    inputSchema: {
      section: z.string().max(20).optional().describe('Optional section number such as 2.4, 5, or 10.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const section = typeof args.section === 'string' ? args.section.trim() : undefined;
      if (!section) return ok(SPECIFICATION_MARKDOWN);
      const lines = SPECIFICATION_MARKDOWN.split('\n');
      const start = lines.findIndex((line) => new RegExp(`^#{2,3}\\s+${section.replace(/\./g, '\\.')}(?:\\s|\\.)`).test(line));
      if (start === -1) {
        return jsonResult({ found: false, section, availableSections: 35, note: 'Use get_yaazhicode_spec without a section to see the full specification.' });
      }
      const level = lines[start]!.match(/^#+/)![0].length;
      let end = lines.length;
      for (let i = start + 1; i < lines.length; i++) {
        const match = lines[i]!.match(/^(#+)\s/);
        if (match && match[1]!.length <= level) { end = i; break; }
      }
      return ok(lines.slice(start, end).join('\n').trim());
    },
  },
  {
    name: 'list_yaazhicode_keywords',
    title: 'List YaazhiCode keywords',
    description: 'List all 40 active Tamil keywords with their internal tokens and roles, plus reserved/inactive registry entries.',
    inputSchema: {
      scope: z.enum(['active', 'inactive', 'all']).optional().describe('Which keyword set to return. Defaults to active.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const scope = (args.scope as 'active' | 'inactive' | 'all' | undefined) ?? 'active';
      return jsonResult({
        version: KEYWORDS_SNAPSHOT.version,
        scope,
        keywords: scope === 'active'
          ? KEYWORDS_SNAPSHOT.active
          : scope === 'inactive'
            ? KEYWORDS_SNAPSHOT.inactive
            : [...KEYWORDS_SNAPSHOT.active, ...KEYWORDS_SNAPSHOT.inactive],
        counts: KEYWORDS_SNAPSHOT.counts,
        note: 'Only status "keyword" entries produce keyword tokens. அச்சிடு is a standard-library function; மாறும் is inactive.',
      });
    },
  },
  {
    name: 'get_yaazhicode_syntax',
    title: 'YaazhiCode syntax reference',
    description: 'Return verified syntax sections with grammar summaries and checked examples.',
    inputSchema: {
      topic: z.enum(['lexical', 'declarations', 'functions', 'classes', 'modules', 'all']).optional().describe('Syntax topic. Defaults to all.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const topic = (args.topic as string | undefined) ?? 'all';
      const sections = topic === 'all' ? SYNTAX_SECTIONS : SYNTAX_SECTIONS.filter((s) => s.id === topic);
      return jsonResult({ topic, sections });
    },
  },
  {
    name: 'list_yaazhicode_data_types',
    title: 'List YaazhiCode data types',
    description: 'List the ten runtime value types and the exact truthiness rules.',
    inputSchema: empty,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: () => jsonResult(DATA_TYPES),
  },
  {
    name: 'list_yaazhicode_operators',
    title: 'List YaazhiCode operators',
    description: 'List supported operators with behavior and the explicit list of unsupported operators.',
    inputSchema: empty,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: () => jsonResult({ supported: OPERATORS, unsupported: UNSUPPORTED_OPERATORS }),
  },
  {
    name: 'list_yaazhicode_standard_library',
    title: 'List YaazhiCode standard library',
    description: 'List the 17 built-in modules, their exports, instance types, and the native global API inventory.',
    inputSchema: {
      detail: z.enum(['summary', 'modules', 'globals', 'instances', 'all']).optional().describe('Detail level. Defaults to summary.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const detail = (args.detail as string | undefined) ?? 'summary';
      return jsonResult({
        detail,
        summary: standardLibrarySummary(),
        modules: detail === 'modules' || detail === 'all' ? listModules() : undefined,
        globals: detail === 'globals' || detail === 'all' ? listGlobals() : undefined,
        instances: detail === 'instances' || detail === 'all' ? listInstances() : undefined,
      });
    },
  },
  {
    name: 'list_yaazhicode_functions',
    title: 'Look up YaazhiCode API entries',
    description: 'Look up a exact native global, built-in module, module export, or instance member by name. Returns arity, signature, and errors.',
    inputSchema: {
      name: z.string().min(1).max(100).describe('Exact Tamil API name, module name, or instance type.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const name = String(args.name ?? '').normalize('NFC');
      const found = findApiEntry(name);
      if (!found) {
        return jsonResult({
          found: false,
          name,
          note: 'No exact match. Use list_yaazhicode_standard_library to inspect available names. Do not invent APIs.',
        });
      }
      return jsonResult({ found: true, name, ...found });
    },
  },
  {
    name: 'get_yaazhicode_control_flow',
    title: 'YaazhiCode control flow',
    description: 'Return verified conditionals, loops, and switch syntax with checked examples.',
    inputSchema: empty,
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: () => jsonResult(CONTROL_FLOW),
  },
  {
    name: 'list_yaazhicode_errors',
    title: 'List YaazhiCode diagnostic codes',
    description: 'List stable YAAZHICODE_* diagnostic codes extracted from the compiler source, grouped by category.',
    inputSchema: {
      category: z.enum(['lexical', 'syntax', 'semantic', 'runtime', 'module', 'standard-library', 'cli', 'all']).optional().describe('Filter by category. Defaults to all.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const category = (args.category as string | undefined) ?? 'all';
      const codes = category === 'all'
        ? DIAGNOSTICS_SNAPSHOT.codes
        : DIAGNOSTICS_SNAPSHOT.codes.filter((entry) => entry.category === category);
      return jsonResult({
        version: DIAGNOSTICS_SNAPSHOT.version,
        note: DIAGNOSTICS_SNAPSHOT.note,
        category,
        count: codes.length,
        codes,
      });
    },
  },
];

export function assertApiInventoryVersion(): void {
  if (API_INVENTORY.version !== PROVENANCE.languageVersion) {
    throw new Error('Knowledge snapshot version mismatch');
  }
}
