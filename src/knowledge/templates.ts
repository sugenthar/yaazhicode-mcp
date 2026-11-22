export interface Misconception {
  readonly wrong: string;
  readonly correct: string;
  readonly explanation: string;
}

/** Verified corrections for the stale public llms*.txt / spec JSON files. */
export const STALE_DOC_CORRECTIONS: readonly Misconception[] = [
  { wrong: 'தொடரு', correct: 'தொடர்', explanation: 'Active keyword for continue is தொடர்.' },
  { wrong: 'இல்லையெனில்', correct: 'இல்லை என்றால் / இல்லை', explanation: 'Conditional alternative uses இல்லை and இல்லை என்றால்.' },
  { wrong: 'மரபுரிமை', correct: 'சேர்தல்', explanation: 'Inheritance clause keyword is சேர்தல்.' },
  { wrong: 'முதன்மை', correct: 'புதிய', explanation: 'Construction operator is புதிய.' },
  { wrong: 'வீசு', correct: 'எறி', explanation: 'Throw keyword is எறி.' },
  { wrong: 'இறுதியாக', correct: 'இறுதியில்', explanation: 'Finally keyword is இறுதியில்.' },
  { wrong: 'வகையறி', correct: 'வகை', explanation: 'Type query operator is வகை.' },
  { wrong: '$ inside identifiers', correct: 'Tamil letters, marks, digits, and _', explanation: '$ is only the numeral marker, never an identifier character.' },
  { wrong: 'module கணிதம் / உரை / பட்டியல் / நேரம்', correct: '17 exact built-in Tamil module names', explanation: 'The stale spec JSON lists modules that do not exist.' },
] as const;

export const PROMPT_KNOWLEDGE = {
  rules: [
    'Use only the 40 active Tamil keywords and verified standard-library APIs.',
    'Numbers must be written as $ + Tamil digits; ASCII digits outside strings/comments are invalid.',
    'Every statement needs its terminator; there is no automatic semicolon insertion.',
    'Do not use unsupported syntax such as template literals, destructuring, optional chaining, ternary, regex, ++, or **.',
    'Do not claim code is valid unless it has been checked with validate_yaazhicode_code.',
    'Treat verified, experimental, and planned features distinctly.',
  ],
  projectLayout: [
    'main.yaazhi — entry program',
    'lib/*.yaazhi — user modules imported with relative paths',
    'tests/*.yaazhi — files that use the உறுதிப்படுத்து module, run with yaazhicode test',
  ],
  corrections: STALE_DOC_CORRECTIONS,
} as const;
