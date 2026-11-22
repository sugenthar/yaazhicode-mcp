import { LANGUAGE_VERSION, MCP_VERSION } from '../shared/version.js';
import { PROVENANCE } from '../knowledge/index.js';

export const SERVER_CAPABILITIES = {
  tools: { listChanged: false },
  resources: { subscribe: false, listChanged: false },
  prompts: { listChanged: false },
  logging: {},
} as const;

export const SERVER_INSTRUCTIONS = [
  'You are connected to the authoritative YaazhiCode MCP server.',
  `YaazhiCode language version: ${LANGUAGE_VERSION}. MCP server version: ${MCP_VERSION}.`,
  'Use the provided tools and resources for YaazhiCode facts. Do not rely on Web/public/llms.txt, llms-full.txt, or yaazhicode-spec.json; they are stale.',
  'Use only the 40 active Tamil keywords and verified APIs. Numbers require $ followed by Tamil digits.',
  'Never claim generated YaazhiCode is valid unless validate_yaazhicode_code reports valid: true.',
  'Distinguish verified, experimental, and planned features using get_yaazhicode_feature_status.',
  'This server does not execute user code. It parses, analyzes, and explains it only.',
  `Knowledge snapshot: ${PROVENANCE.syncedAt} from language git ${PROVENANCE.git.yaazhicode ?? 'unknown'}.`,
].join('\n');
