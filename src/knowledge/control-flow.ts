export interface ControlFlowEntry {
  readonly id: string;
  readonly title: string;
  readonly syntax: string;
  readonly example: string;
  readonly notes: readonly string[];
}

export const CONTROL_FLOW: readonly ControlFlowEntry[] = [
  {
    id: 'conditional',
    title: 'Conditional',
    syntax: 'என்றால் (cond) { ... } இல்லை என்றால் (cond2) { ... } இல்லை { ... }',
    example: `என்றால் (மதிப்பு > $௧௦) {
  அச்சிடு("பெரியது");
} இல்லை {
  அச்சிடு("சிறியது");
}`,
    notes: ['Branches may be a single statement instead of a block.', 'The condition uses YaazhiCode truthiness.'],
  },
  {
    id: 'while',
    title: 'While loop',
    syntax: 'இருக்கும்வரை (cond) { ... }',
    example: `இருக்கும்வரை (எண் < $௫) {
  எண் += $௧;
}`,
    notes: ['நிறுத்து exits the nearest loop; தொடர் starts the next iteration.'],
  },
  {
    id: 'do-while',
    title: 'Do-while loop',
    syntax: 'செய் { ... } இருக்கும்வரை (cond);',
    example: `செய் {
  எண் += $௧;
} இருக்கும்வரை (எண் < $௫);`,
    notes: ['The trailing semicolon after the parenthesized condition is required.'],
  },
  {
    id: 'for',
    title: 'C-style for loop',
    syntax: 'ஒவ்வொரு (init; test; update) { ... }',
    example: `ஒவ்வொரு (மாறி எண் = $௦; எண் < $௧௦; எண் += $௧) {
  அச்சிடு(எண்);
}`,
    notes: ['Init may be a declaration, expression, or empty.', 'Test and update may be omitted.'],
  },
  {
    id: 'for-in',
    title: 'For-in loop',
    syntax: 'ஒவ்வொரு (மாறி value உள்ளே collection) { ... }',
    example: `ஒவ்வொரு (மாறி மதிப்பு உள்ளே [$௨, $௪, $௬]) {
  அச்சிடு(மதிப்பு);
}`,
    notes: ['Iterates array elements (snapshot), string code points, object keys, or class static member names.'],
  },
  {
    id: 'switch',
    title: 'Switch',
    syntax: 'தேர்ந்தெடு (value) { நிலை expr: ...; இயல்புநிலை: ... }',
    example: `தேர்ந்தெடு (எண்) {
  நிலை $௧:
    அச்சிடு("ஒன்று");
    நிறுத்து;
  இயல்புநிலை:
    அச்சிடு("மற்றது");
}`,
    notes: ['Cases use value equality and fall through unless நிறுத்து exits.', 'இயல்புநிலை position is not required to be last.'],
  },
] as const;
