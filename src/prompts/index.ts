import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  KEYWORDS_SNAPSHOT,
  LANGUAGE_OVERVIEW,
  PROMPT_KNOWLEDGE,
  SYNTAX_SECTIONS,
} from '../knowledge/index.js';

const RULES = PROMPT_KNOWLEDGE.rules.map((rule) => `- ${rule}`).join('\n');
const KEYWORDS = KEYWORDS_SNAPSHOT.activeSpellings.join(' ');
const SYNTAX_DIGEST = SYNTAX_SECTIONS.map((section) => `## ${section.title}\n${section.grammar}\n${section.example}`).join('\n\n');

function user(text: string) {
  return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] };
}

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'learn_yaazhicode',
    {
      title: 'Learn YaazhiCode',
      description: 'A structured introduction to verified YaazhiCode 0.1.0 syntax and rules.',
      argsSchema: {
        focus: z.string().max(80).optional().describe('Optional topic such as numerals, loops, functions, modules, or async.'),
      },
    },
    async (args) => user([
      `Teach me YaazhiCode ${LANGUAGE_OVERVIEW.version}, focusing on: ${String(args.focus ?? 'the language fundamentals')}.`,
      'Use only these verified facts; do not invent syntax or APIs.',
      RULES,
      `Active keyword vocabulary: ${KEYWORDS}`,
      SYNTAX_DIGEST,
      'After explaining, call validate_yaazhicode_code on every example you present and only show examples that pass.',
    ].join('\n\n')),
  );

  server.registerPrompt(
    'write_yaazhicode_program',
    {
      title: 'Write a YaazhiCode program',
      description: 'Request a YaazhiCode program with mandatory validation before delivery.',
      argsSchema: {
        task: z.string().min(1).describe('What the program must do.'),
        constraints: z.string().max(1000).optional().describe('Optional constraints or input/output description.'),
      },
    },
    async (args) => user([
      `Write a YaazhiCode ${LANGUAGE_OVERVIEW.version} program for this task: ${String(args.task)}`,
      args.constraints ? `Constraints: ${String(args.constraints)}` : '',
      RULES,
      `Active keywords: ${KEYWORDS}`,
      SYNTAX_DIGEST,
      'Workflow: draft the program, call validate_yaazhicode_code, fix all diagnostics, then call analyze_yaazhicode_code. Return the final code only after validation passes. State that execution was not performed.',
    ].filter(Boolean).join('\n\n')),
  );

  server.registerPrompt(
    'explain_yaazhicode_program',
    {
      title: 'Explain a YaazhiCode program',
      description: 'Explain an existing YaazhiCode program using verified semantics.',
      argsSchema: {
        code: z.string().min(1).describe('The YaazhiCode program to explain.'),
      },
    },
    async (args) => user([
      'Explain this YaazhiCode program section by section.',
      'First call validate_yaazhicode_code. If it is invalid, report the exact diagnostics instead of interpreting it as valid.',
      'Then call analyze_yaazhicode_code for structure and experimental-feature notices.',
      'Explain control flow, data types, and any built-in module APIs using the MCP knowledge tools. Do not claim runtime output was observed.',
      `\n\`\`\`yaazhicode\n${String(args.code)}\n\`\`\``,
    ].join('\n\n')),
  );

  server.registerPrompt(
    'debug_yaazhicode_program',
    {
      title: 'Debug a YaazhiCode program',
      description: 'Diagnose a YaazhiCode program or error message without executing it.',
      argsSchema: {
        code: z.string().min(1).describe('The YaazhiCode program with a problem.'),
        error: z.string().max(500).optional().describe('Optional error code or message reported by the user.'),
      },
    },
    async (args) => user([
      `Debug this YaazhiCode program. Reported error: ${String(args.error ?? 'none provided')}`,
      'Call validate_yaazhicode_code and explain_yaazhicode_error. Use suggest_yaazhicode_correction only when it reports revalidated: true.',
      'Never invent a diagnostic meaning. Never claim the program was executed.',
      '\n```yaazhicode\n' + String(args.code) + '\n```',
    ].join('\n\n')),
  );

  server.registerPrompt(
    'create_yaazhicode_project',
    {
      title: 'Create a YaazhiCode project',
      description: 'Scaffold a YaazhiCode project layout using verified module and test rules.',
      argsSchema: {
        purpose: z.string().min(1).describe('Purpose of the project.'),
      },
    },
    async (args) => user([
      `Design a small YaazhiCode ${LANGUAGE_OVERVIEW.version} project for: ${String(args.purpose)}`,
      'Follow these verified constraints:',
      ...PROMPT_KNOWLEDGE.projectLayout.map((line) => `- ${line}`),
      '- Use relative .yaazhi imports only; no default exports or package names.',
      '- Use the உறுதிப்படுத்து built-in module for tests and yaazhicode test as the runner.',
      '- Validate every generated file with validate_yaazhicode_code before presenting it.',
      RULES,
    ].join('\n\n')),
  );

  server.registerPrompt(
    'teach_yaazhicode',
    {
      title: 'Teach YaazhiCode',
      description: 'Build a lesson plan that avoids the known stale public documentation.',
      argsSchema: {
        level: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Learner level. Defaults to beginner.'),
        topic: z.string().max(80).optional().describe('Optional lesson topic.'),
      },
    },
    async (args) => user([
      `Create a ${String(args.level ?? 'beginner')} YaazhiCode lesson on ${String(args.topic ?? 'language fundamentals')}.`,
      'Explicitly warn about these stale public-document claims and give the corrected forms:',
      ...PROMPT_KNOWLEDGE.corrections.map((item) => `- "${item.wrong}" → "${item.correct}": ${item.explanation}`),
      RULES,
      'Include verified examples only and validate each one with validate_yaazhicode_code before including it.',
    ].join('\n\n')),
  );
}

export const PROMPT_NAMES = [
  'learn_yaazhicode',
  'write_yaazhicode_program',
  'explain_yaazhicode_program',
  'debug_yaazhicode_program',
  'create_yaazhicode_project',
  'teach_yaazhicode',
] as const;
