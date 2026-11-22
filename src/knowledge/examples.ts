import { EXAMPLES_SNAPSHOT } from './data/snapshot.js';
import type { ExampleEntry } from './types.js';

export const EXAMPLE_INDEX: readonly ExampleEntry[] = EXAMPLES_SNAPSHOT.examples;

export function findExample(id: string): ExampleEntry | undefined {
  return EXAMPLE_INDEX.find((example) => example.id === id);
}

export function searchExamples(query: string, options: {
  source?: ExampleEntry['source'] | 'all';
  limit?: number;
} = {}): readonly ExampleEntry[] {
  const q = query.toLocaleLowerCase();
  const limit = options.limit ?? 10;
  const matches = EXAMPLE_INDEX.filter((example) => {
    if (options.source && options.source !== 'all' && example.source !== options.source) return false;
    if (!q) return true;
    const haystack = [
      example.id,
      example.title,
      example.titleTa ?? '',
      example.category,
      example.summary?.en ?? '',
      example.summary?.ta ?? '',
      example.code,
    ].join('\n').toLocaleLowerCase();
    return haystack.includes(q);
  });
  return matches.slice(0, limit);
}
