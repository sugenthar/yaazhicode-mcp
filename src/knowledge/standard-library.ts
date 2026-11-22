import { API_INVENTORY, KEYWORDS_SNAPSHOT, PROVENANCE } from './data/snapshot.js';
import type { ApiCallable, ApiInstance, ApiModule } from './types.js';

export function listModules() {
  return API_INVENTORY.modules;
}

export function listGlobals() {
  return API_INVENTORY.globals;
}

export function listInstances() {
  return API_INVENTORY.instances;
}

export function findApiEntry(name: string): { kind: string; entry: ApiCallable | ApiInstance | ApiModule } | undefined {
  const module = API_INVENTORY.modules.find((m) => m.name === name);
  if (module) return { kind: 'module', entry: module };
  const global = API_INVENTORY.globals.find((g) => g.name === name);
  if (global) return { kind: 'global', entry: global };
  const instance = API_INVENTORY.instances.find((i) => i.type === name);
  if (instance) return { kind: 'instance', entry: instance };
  for (const m of API_INVENTORY.modules) {
    const exportEntry = m.exports.find((e) => e.name === name);
    if (exportEntry) return { kind: `module.${m.name}`, entry: exportEntry };
  }
  for (const i of API_INVENTORY.instances) {
    const member = i.members.find((e) => e.name === name);
    if (member) return { kind: `instance.${i.type}`, entry: member };
  }
  return undefined;
}

export function standardLibrarySummary() {
  const groups = new Map<string, number>();
  for (const g of API_INVENTORY.globals) {
    const first = g.name[0] ?? '?';
    groups.set(first, (groups.get(first) ?? 0) + 1);
  }
  return {
    version: API_INVENTORY.version,
    standardGlobalNames: PROVENANCE.counts.standardGlobalNames,
    documentedNativeGlobals: API_INVENTORY.globals.length,
    builtinModules: API_INVENTORY.modules.map((m) => ({
      name: m.name,
      summary: m.summary,
      exportCount: m.exports.length,
      errors: m.errors,
    })),
    instanceTypes: API_INVENTORY.instances.map((i) => ({ type: i.type, summary: i.summary, memberCount: i.members.length })),
    constantsAndGlobalsNote:
      'உண்மை, பொய், and வெற்றிடம் are immutable standard globals. They are not literal keywords and are not listed among native callables.',
    keywordCount: KEYWORDS_SNAPSHOT.counts.active,
  };
}
