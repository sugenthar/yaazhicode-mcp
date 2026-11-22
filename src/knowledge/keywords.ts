import { KEYWORDS_SNAPSHOT } from './data/snapshot.js';
import type { KeywordEntry } from './types.js';

export const KEYWORD_GROUPS: Readonly<Record<string, readonly string[]>> = Object.freeze(
  KEYWORDS_SNAPSHOT.active.reduce<Record<string, string[]>>((groups, entry) => {
    (groups[entry.category] ??= []).push(entry.spelling);
    return groups;
  }, {}),
);

export function keywordBySpelling(spelling: string): KeywordEntry | undefined {
  return KEYWORDS_SNAPSHOT.active.find((entry) => entry.spelling === spelling.normalize('NFC'));
}
