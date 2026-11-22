import { LANGUAGE_OVERVIEW, PROMPT_KNOWLEDGE } from '../knowledge/index.js';

export const CLIENT_GUIDANCE = [
  ...PROMPT_KNOWLEDGE.rules,
  `Language: ${LANGUAGE_OVERVIEW.name} ${LANGUAGE_OVERVIEW.version}`,
  'Available assistance: validation, static analysis, diagnostic explanation, conservative corrections, and verified examples.',
  'Execution is intentionally unavailable in this release because safe, isolated execution is not guaranteed.',
].join('\n');
