import { z } from 'zod';
import { EXAMPLE_INDEX, EXAMPLES_SNAPSHOT, findExample, searchExamples } from '../knowledge/index.js';
import { jsonResult } from '../shared/result.js';
import type { ToolDefinition } from './types.js';

export const exampleTools: readonly ToolDefinition[] = [
  {
    name: 'list_yaazhicode_examples',
    title: 'List YaazhiCode examples',
    description: 'List verified examples from the official repository, website source content, and website syntax snippets.',
    inputSchema: {
      source: z.enum(['official', 'website', 'website-syntax', 'all']).optional().describe('Example source filter. Defaults to all.'),
      category: z.string().max(60).optional().describe('Optional category filter.'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum number of entries. Defaults to 20.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const source = (args.source as 'official' | 'website' | 'website-syntax' | 'all' | undefined) ?? 'all';
      const category = typeof args.category === 'string' ? args.category : undefined;
      const limit = typeof args.limit === 'number' ? args.limit : 20;
      let entries = EXAMPLE_INDEX;
      if (source !== 'all') entries = entries.filter((e) => e.source === source);
      if (category) entries = entries.filter((e) => e.category === category);
      const selected = entries.slice(0, limit);
      return jsonResult({
        counts: EXAMPLES_SNAPSHOT.counts,
        filter: { source, category, limit },
        matched: entries.length,
        returned: selected.length,
        truncated: entries.length > selected.length,
        note: entries.length > selected.length
          ? 'Results were limited. Use a more specific filter, a larger limit, or search_yaazhicode_examples.'
          : undefined,
        examples: selected.map(({ code: _code, ...meta }) => meta),
      });
    },
  },
  {
    name: 'get_yaazhicode_example',
    title: 'Get YaazhiCode example',
    description: 'Return one verified example with its full source and, where independently captured, its exact output.',
    inputSchema: {
      id: z.string().min(1).max(200).describe('Exact example id from list_yaazhicode_examples.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const id = String(args.id ?? '');
      const example = findExample(id);
      if (!example) {
        return jsonResult({
          found: false,
          id,
          note: 'Unknown example id. Use list_yaazhicode_examples or search_yaazhicode_examples first.',
        });
      }
      return jsonResult({ found: true, ...example });
    },
  },
  {
    name: 'search_yaazhicode_examples',
    title: 'Search YaazhiCode examples',
    description: 'Search verified example titles, summaries, categories, and source text.',
    inputSchema: {
      query: z.string().min(1).max(120).describe('Search text in English or Tamil.'),
      source: z.enum(['official', 'website', 'website-syntax', 'all']).optional().describe('Optional source filter.'),
      limit: z.number().int().min(1).max(50).optional().describe('Maximum results. Defaults to 10.'),
    },
    annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    handler: (args) => {
      const query = String(args.query ?? '');
      const source = args.source as 'official' | 'website' | 'website-syntax' | 'all' | undefined;
      const limit = typeof args.limit === 'number' ? Math.min(args.limit, 50) : 10;
      const matches = searchExamples(query, { source, limit });
      return jsonResult({
        query,
        source: source ?? 'all',
        returned: matches.length,
        examples: matches.map(({ code: _code, ...meta }) => meta),
      });
    },
  },
];
