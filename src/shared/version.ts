import { createRequire } from 'node:module';
import { PROVENANCE } from '../knowledge/data/snapshot.js';

const require = createRequire(import.meta.url);
const packageJson = require('../../package.json') as { name: string; version: string };

export const MCP_NAME: string = packageJson.name;
export const MCP_VERSION: string = packageJson.version;
export const LANGUAGE_VERSION: string = PROVENANCE.languageVersion;

export const SERVER_INFO = {
  name: MCP_NAME,
  version: MCP_VERSION,
} as const;
