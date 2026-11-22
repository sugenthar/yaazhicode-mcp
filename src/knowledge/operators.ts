export interface OperatorEntry {
  readonly operator: string;
  readonly kind: string;
  readonly behavior: string;
}

export const OPERATORS: readonly OperatorEntry[] = [
  { operator: '+', kind: 'binary', behavior: 'Adds numbers; concatenates when either operand is a string; concatenates two arrays.' },
  { operator: '-', kind: 'binary/unary', behavior: 'Numeric subtraction / unary negation.' },
  { operator: '*', kind: 'binary', behavior: 'Numeric multiplication.' },
  { operator: '/', kind: 'binary', behavior: 'Numeric division; division by zero raises YAAZHICODE_DIVISION_BY_ZERO.' },
  { operator: '%', kind: 'binary', behavior: 'Numeric remainder; zero divisor raises YAAZHICODE_DIVISION_BY_ZERO.' },
  { operator: '=', kind: 'assignment', behavior: 'Assigns to an identifier or member expression.' },
  { operator: '+= -= *= /=', kind: 'assignment', behavior: 'Compound assignment. No other compound forms exist.' },
  { operator: '== !=', kind: 'comparison', behavior: 'Value equality; arrays and ordinary objects compare structurally.' },
  { operator: '< <= > >=', kind: 'comparison', behavior: 'Require two numbers or two strings.' },
  { operator: '!', kind: 'unary', behavior: 'Logical negation using YaazhiCode truthiness.' },
  { operator: '&& ||', kind: 'logical', behavior: 'Short-circuit and return an operand value.' },
  { operator: 'உள்ளே', kind: 'relational', behavior: 'Tests object keys, class static members, array membership, or substring presence.' },
  { operator: 'உதாரணம்', kind: 'relational', behavior: 'Tests an instance against a class and its inheritance chain.' },
  { operator: 'வகை', kind: 'unary', behavior: 'Returns a Tamil type name such as "எண்" or "பட்டியல்".' },
  { operator: 'வெற்று', kind: 'unary', behavior: 'Evaluates the operand and returns வெற்றிடம்.' },
  { operator: 'நீக்கு', kind: 'unary', behavior: 'Deletes an object/class property or array element by index.' },
  { operator: 'காத்திரு', kind: 'unary', behavior: 'Suspends an enclosing ஒத்திசைவற்ற frame until a promise settles.' },
  { operator: 'புதிய', kind: 'primary', behavior: 'Instantiates a class.' },
] as const;

export const UNSUPPORTED_OPERATORS = [
  'bitwise operators and shifts',
  'exponentiation (**) — use சக்தி',
  'increment/decrement (++, --)',
  '%= and other compound assignments',
  'ternary ? :',
  'optional chaining (?.) and nullish coalescing (??)',
  'rest/spread and destructuring',
  'regular-expression literals',
  'template literals and interpolation',
] as const;
