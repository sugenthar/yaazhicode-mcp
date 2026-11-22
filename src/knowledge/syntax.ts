export interface SyntaxSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly grammar: string;
  readonly example: string;
  readonly notes: readonly string[];
}

export const SYNTAX_SECTIONS: readonly SyntaxSection[] = [
  {
    id: 'lexical',
    title: 'Lexical structure',
    summary: 'Whitespace, comments, identifiers, numerals, and strings.',
    grammar: `// line comment
/* non-nesting block comment */
identifier-start = TamilLetter | "_"
identifier-part  = TamilLetter | TamilMark | TamilDigit | "_"
integer = "$", TamilDigit, { TamilDigit }
decimal = "$", TamilDigit, { TamilDigit }, ".", TamilDigit, { TamilDigit }
range   = integer, "..", integer`,
    example: `// எண்கள் மற்றும் சரங்கள்
நிலையான மொழி = "YaazhiCode";
மாறி வயது = $௨௫;
மாறி விலை = $௧௨.௫;
மாறி வரம்பு = $௧..$௫;
அச்சிடு(மொழி + " " + வடிவமை("{}", வயது));`,
    notes: [
      'ASCII digits outside strings/comments are YAAZHICODE_ASCII_NUMBER.',
      'Bare Tamil digits are YAAZHICODE_BARE_TAMIL_DIGIT; malformed $ numerals are YAAZHICODE_BAD_NUMERAL.',
      'String escapes: \\\\, \\", \\n, \\r, \\t. Raw line breaks are errors.',
    ],
  },
  {
    id: 'declarations',
    title: 'Variable declarations',
    summary: 'நிலையான, மாறி, and மாற்றி bindings.',
    grammar: `நிலையான name = expression;
மாறி name [= expression];
மாற்றி name [= expression];`,
    example: `நிலையான பெயர் = "YaazhiCode";
மாறி எண் = $௧;
மாற்றி கூட்டு;`,
    notes: [
      'நிலையான is block-scoped, immutable, and requires an initializer.',
      'மாறி is block-scoped; omission initializes to வெற்றிடம்.',
      'மாற்றி is function-scoped and hoisted; one binding per statement.',
    ],
  },
  {
    id: 'functions',
    title: 'Functions',
    summary: 'Function declarations, expressions, recursion, and async functions.',
    grammar: `செயல் name(param, ...) { ... }
செயல்(name, ...) { ... }
ஒத்திசைவற்ற செயல் name(param, ...) { ... }`,
    example: `செயல் கூட்டு(அ, ஆ) {
  கொடு அ + ஆ;
}
அச்சிடு(கூட்டு($௧, $௨));`,
    notes: [
      'User functions have exact arity; no default, optional, rest, or destructured parameters.',
      'கொடு with no expression returns வெற்றிடம்; recursion and closures are supported.',
      'Top-level காத்திரு is rejected; call an ஒத்திசைவற்ற function instead.',
    ],
  },
  {
    id: 'classes',
    title: 'Classes',
    summary: 'Constructors, methods, static members, and single inheritance.',
    grammar: `வகுப்பு Name [சேர்தல் Parent] {
  [நிலையியல்] field [= expression];
  உருவாக்கு(params) { ... }
  [நிலையியல்] [ஒத்திசைவற்ற] method(params) { ... }
}`,
    example: `வகுப்பு விலங்கு {
  உருவாக்கு(பெயர்) { இது.பெயர் = பெயர்; }
  சொல்() { கொடு இது.பெயர் + " ஒலி"; }
}
வகுப்பு நாய் சேர்தல் விலங்கு {
  சொல்() { கொடு மேல்.சொல்() + " (நாய்)"; }
}
அச்சிடு(புதிய நாய்("குட்டி").சொல்());`,
    notes: [
      'Instantiation requires புதிய. Single inheritance only.',
      'No access modifiers, private fields, getters/setters, static blocks, or multiple inheritance.',
    ],
  },
  {
    id: 'modules',
    title: 'Modules',
    summary: 'imports, exports, built-in namespaces, and path sandboxing.',
    grammar: `இறக்குமதி { name [ஆக alias] } இருந்து "./file.yaazhi";
இறக்குமதி * ஆக ns இருந்து "built-in-name";
ஏற்றுமதி செயல் name(...) { ... }
ஏற்றுமதி { name };`,
    example: `இறக்குமதி { இணை } இருந்து "பாதை";
இறக்குமதி { தீர்வு } இருந்து "உறுதி";
ஏற்றுமதி நிலையான பெயர் = "YaazhiCode";`,
    notes: [
      'Relative .yaazhi paths or one of 17 exact built-in names only.',
      'No default exports, package names, node: specifiers, dynamic import, or other explicit extensions.',
      'Module namespaces are read-only; paths are confined to interpreter filesystem roots.',
    ],
  },
];
