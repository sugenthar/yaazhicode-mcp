import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  DIAGNOSTICS_SNAPSHOT,
  EXAMPLES_SNAPSHOT,
  KEYWORDS_SNAPSHOT,
  LANGUAGE_OVERVIEW,
  OPERATORS,
  PROVENANCE,
  SPECIFICATION_MARKDOWN,
  SYNTAX_SECTIONS,
  UNSUPPORTED_OPERATORS,
  standardLibrarySummary,
} from '../knowledge/index.js';
import { MCP_VERSION } from '../shared/version.js';

interface ResourceDefinition {
  readonly name: string;
  readonly uri: string;
  readonly title: string;
  readonly description: string;
  readonly text: () => string;
}

function textResource(name: string, uri: string, title: string, description: string, value: unknown): ResourceDefinition {
  return {
    name,
    uri,
    title,
    description,
    text: () => typeof value === 'string' ? value : JSON.stringify(value, null, 2),
  };
}

const RESOURCES: readonly ResourceDefinition[] = [
  textResource('overview', 'yaazhicode://overview', 'YaazhiCode overview',
    'Verified high-level language facts and stale-document warnings.', LANGUAGE_OVERVIEW),
  textResource('specification', 'yaazhicode://specification', 'YaazhiCode specification',
    'Full authoritative language specification snapshot.', SPECIFICATION_MARKDOWN),
  textResource('keywords', 'yaazhicode://keywords', 'YaazhiCode keywords',
    'All active, reserved, and identifier entries from the keyword registry.', KEYWORDS_SNAPSHOT),
  textResource('syntax', 'yaazhicode://syntax', 'YaazhiCode syntax',
    'Syntax sections, operators, and unsupported constructs.', {
      sections: SYNTAX_SECTIONS,
      operators: OPERATORS,
      unsupported: UNSUPPORTED_OPERATORS,
    }),
  textResource('standard-library', 'yaazhicode://standard-library', 'YaazhiCode standard library',
    'Built-in modules, globals, instance types, and capability notes.', standardLibrarySummary()),
  textResource('examples', 'yaazhicode://examples', 'YaazhiCode examples',
    'Verified examples with validation status and captured output where available.', EXAMPLES_SNAPSHOT),
  textResource('diagnostics', 'yaazhicode://diagnostics', 'YaazhiCode diagnostics',
    'Stable YAAZHICODE_* diagnostic code catalog.', DIAGNOSTICS_SNAPSHOT),
  textResource('version', 'yaazhicode://version', 'YaazhiCode version',
    'Language and MCP server versions with snapshot provenance.', {
      languageVersion: PROVENANCE.languageVersion,
      mcpVersion: MCP_VERSION,
      syncedAt: PROVENANCE.syncedAt,
      git: PROVENANCE.git,
      sources: PROVENANCE.sources,
    }),
];

export function registerResources(server: McpServer): void {
  for (const resource of RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.uri.endsWith('specification') ? 'text/markdown' : 'application/json',
      },
      async (uri) => ({
        contents: [{
          uri: uri.href,
          mimeType: resource.uri.endsWith('specification') ? 'text/markdown' : 'application/json',
          text: resource.text(),
        }],
      }),
    );
  }
}

export const RESOURCE_URIS: readonly string[] = RESOURCES.map((r) => r.uri);
