export interface DataTypeEntry {
  readonly name: string;
  readonly description: string;
  readonly example?: string;
}

export const DATA_TYPES: readonly DataTypeEntry[] = [
  { name: 'எண்', description: 'IEEE-754 double-precision number.', example: '$௪௨' },
  { name: 'சொல்', description: 'Unicode string.', example: '"தமிழ்"' },
  { name: 'தர்க்கம்', description: 'Boolean value: உண்மை or பொய்.', example: 'உண்மை' },
  { name: 'வெற்றிடம்', description: 'The null value.', example: 'வெற்றிடம்' },
  { name: 'பட்டியல்', description: 'Mutable ordered array.', example: '[$௧, $௨]' },
  { name: 'பொருள்', description: 'Mutable string-keyed object, class instance, or read-only module namespace.', example: '{ பெயர்: "YaazhiCode" }' },
  { name: 'இடையகம்', description: 'Immutable binary byte buffer created through the இடையகம் built-in module.' },
  { name: 'செயல்', description: 'User function or native function.' },
  { name: 'வகுப்பு', description: 'Class object.' },
  { name: 'பிழை', description: 'Structured caught-error value with .செய்தி, .குறியீடு, and .தடம்.' },
] as const;

export const TRUTHINESS = {
  falsey: ['வெற்றிடம்', 'பொய்', 'numeric zero including -0', 'empty string', 'NaN produced by the engine'],
  truthy: ['all arrays, objects, functions, classes, buffers, and error values, including empty ones'],
} as const;
