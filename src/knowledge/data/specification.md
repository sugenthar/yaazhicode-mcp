# YaazhiCode language specification

**Version:** YaazhiCode `0.1.0`  
**Status:** implemented language surface for the native lexer, parser, semantic analyzer, tree-walking interpreter, modules, standard library, formatter, CLI, and REPL.

This document describes the syntax and runtime behavior that the YaazhiCode implementation in this repository actually accepts. Anything not described here should be treated as unsupported rather than inferred. Deliberate gaps are collected in [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## 1. Execution model

A `.yaazhi` UTF-8 source file passes through these stages:

```text
source text
  -> YaazhiCode lexer
  -> YaazhiCode parser and AST
  -> semantic analysis
  -> direct tree-walking interpretation of YaazhiCode AST nodes
```

No JavaScript or other target source is generated for execution. TypeScript implements the engine only. Values are dynamically typed at runtime, while the semantic analyzer rejects undefined names, invalid declaration combinations, and misplaced control-flow statements before execution.

Since Phase 2, interpretation uses generator-based continuation threads so that `காத்திரு` suspends a frame without blocking the host. `Interpreter.run()` remains synchronous and fails on a pending await with `YAAZHICODE_ASYNC_REQUIRED`; `Interpreter.runAsync()` drives promises and microtasks to completion and is used by the CLI and REPL. No `eval`, `new Function`, transpilation, or second interpreter is involved.

The CLI strips a leading UTF-8 BOM from entry files and modules. Source text otherwise preserves its original Unicode content, except that identifiers are normalized to NFC for lookup and binding names.

## 2. Lexical structure

### 2.1 Whitespace and comments

Whitespace separates tokens and is otherwise insignificant. Newlines do not terminate statements automatically.

```text
// line comment
/* non-nesting block comment */
```

A line comment ends at `\n`, `\r`, `\u2028`, or `\u2029`. Block comments do not nest. An unterminated block comment is a lexical error.

### 2.2 Identifiers

```ebnf
identifier-start = TamilLetter | "_" ;
identifier-part  = TamilLetter | TamilMark | TamilDigit | "_" ;
identifier       = identifier-start , { identifier-part } ;
```

Only Tamil-script letters may begin a non-underscore identifier. Combining marks and Tamil digits may follow. ASCII letters, ASCII digits, and other scripts are not valid in identifiers. The original lexeme is retained for the formatter, while the identifier value is normalized to Unicode NFC before name lookup.

Keywords cannot be used as binding names. They may be used as property names after `.` and as literal object keys.

### 2.3 Keywords

The language has exactly 40 active Tamil keyword spellings, listed in [docs/KEYWORDS.md](docs/KEYWORDS.md). The active spellings are:

```text
என்றால் இல்லை நிறுத்து தொடர் ஒவ்வொரு செயல் கொடு வகுப்பு உருவாக்கு
இது மேல் சேர்தல் நிலையான மாறி மாற்றி இருக்கும்வரை செய் தேர்ந்தெடு நிலை
இயல்புநிலை முயற்சி பிடி இறுதியில் எறி புதிய நீக்கு வகை உதாரணம்
உள்ளே வெற்று ஒத்திசைவற்ற காத்திரு வழங்கு இறக்குமதி ஏற்றுமதி இருந்து
ஆக உடன் பிழைத்திருத்து நிலையியல்
```

There are no ASCII keyword aliases and no transliterated aliases. `அச்சிடு` is a standard-library function, not a keyword. `மாறும்` is not an active keyword.

### 2.4 Numerals

Numeric literals use a required `$` marker followed by Tamil digits `௦`–`௯`. Three forms exist:

```ebnf
integer = "$" , TamilDigit , { TamilDigit } ;
decimal = "$" , TamilDigit , { TamilDigit } , "." , TamilDigit , { TamilDigit } ;
range   = integer , ".." , integer ;
```

Examples: `$௪௨`, `$௧.௫`, `$௧..$௫`.

- Integer literals must convert to a safe integer. Leading zeroes are allowed.
- Decimal literals require at least one digit on each side of the ASCII `.`.
- Range literals are inclusive and ascending. A range may contain at most 100,000 values and is evaluated as an array of numbers.
- Signs are not part of the literal; use unary `-` or `+`.
- ASCII digits outside strings or comments are rejected by the lexer with the stable `YAAZHICODE_ASCII_NUMBER` diagnostic. The diagnostic reports the exact line/column, the reason, a Tamil correction with the converted `$` literal, and a corrected `.yaazhi` example. Digits inside string literals and comments are valid and are never rewritten. `௰`, `௱`, and `௲` are not supported literal digits.
- Bare Tamil digits without `$` use `YAAZHICODE_BARE_TAMIL_DIGIT`; malformed `$` numerals use `YAAZHICODE_BAD_NUMERAL`. Formatting parses the same lexer output and never silently converts an invalid number.
- The parser retains the original numeral spelling for diagnostics and formatting.

See [docs/NUMERALS.md](docs/NUMERALS.md) for conversion and boundary details.

### 2.5 Strings

Strings use double quotes. These escapes are supported:

| Escape | Value |
| --- | --- |
| `\\` | backslash |
| `\"` | double quote |
| `\n` | newline |
| `\r` | carriage return |
| `\t` | tab |

Raw line breaks, unterminated strings, and all other escapes are lexical errors. There are no template literals or interpolation syntax; use `வடிவமை` at runtime.

### 2.6 Operators and punctuation

```text
+  -  *  /  %
=  +=  -=  *=  /=
==  !=  <  <=  >  >=
!  &&  ||
;  ,  .  :  (  )  {  }  [  ]
```

The lexer uses longest-match recognition. There are no bitwise operators, exponentiation operator, increment/decrement, nullish coalescing, optional chaining, ternary operator, or regex literals.

## 3. Values and types

YaazhiCode is dynamically typed. Runtime values are:

| YaazhiCode type name | Values |
| --- | --- |
| `எண்` | IEEE-754 double-precision number |
| `சொல்` | Unicode string |
| `தர்க்கம்` | `உண்மை` or `பொய்` |
| `வெற்றிடம்` | the null value |
| `பட்டியல்` | mutable ordered array |
| `பொருள்` | mutable string-keyed object, class instance, or read-only module namespace |
| `இடையகம்` | immutable binary byte buffer, created through the `இடையகம்` built-in module |
| `செயல்` | user function or native function |
| `வகுப்பு` | class object |
| `பிழை` | structured caught-error value |

`உண்மை`, `பொய்`, and `வெற்றிடம்` are immutable standard globals. The language has no boolean or null literal keywords.

### 3.1 Truthiness

Only these values are falsey:

- `வெற்றிடம்` (`null`)
- `பொய்` (`false`)
- numeric zero, including `-0`
- the empty string
- the numeric value produced as “not a number” by the engine

All arrays, objects, functions, classes, buffers, and error values are truthy, including empty ones.

### 3.2 Display and conversion

`அச்சிடு` and `உரையாக்கு` render booleans as `உண்மை`/`பொய்`, null as `வெற்றிடம்`, arrays as `[a, b]`, ordinary objects as `{ key: value }`, and buffers as `<இடையகம் N பைட்டுகள்>`. Module namespaces render with an explicit namespace marker. Cyclic arrays and objects render as `[சுழற்சி]` and `{சுழற்சி}`.

`எண்ணாக்கு` accepts numbers, booleans, and numeric strings. Numeric strings may use Tamil digits with an optional `$`, or ASCII digits; surrounding whitespace and a leading `+`/`-` are accepted. This string conversion is broader than source literal syntax.

## 4. Expressions

### 4.1 Precedence

From lowest to highest:

1. Assignment: `=`, `+=`, `-=`, `*=`, `/=`, right-associative
2. Logical OR: `||`
3. Logical AND: `&&`
4. Equality: `==`, `!=`
5. Relational: `<`, `<=`, `>`, `>=`, `உள்ளே` (`in`), `உதாரணம்` (`instanceof`)
6. Additive: `+`, `-`
7. Multiplicative: `*`, `/`, `%`
8. Unary: `!`, `+`, `-`, `வகை`, `வெற்று`, `நீக்கு`, `காத்திரு`
9. Postfix: call, `.` member access, `[...]` computed member access
10. Primary literals, identifiers, arrays, objects, functions, classes, `புதிய`

Assignment targets must be identifiers or member expressions.

### 4.2 Unary operators

| Syntax | Behavior |
| --- | --- |
| `!value` | Logical negation using truthiness |
| `-value` / `+value` | Numeric negation/identity; non-numbers are runtime type errors |
| `வகை value` | Returns a Tamil type name such as `"எண்"` or `"பட்டியல்"` |
| `வெற்று value` | Evaluates the operand and returns `வெற்றிடம்` |
| `நீக்கு object.property` | Deletes an object/class property, or removes an array element by index; other targets are errors |
| `காத்திரு promise` | Suspends the enclosing `ஒத்திசைவற்ற` frame until the promise settles, then yields its value; outside async code it is a semantic error |

`வழங்கு` parses as a yield expression, but generator execution is not implemented. Calling a generator or evaluating `வழங்கு` raises `YAAZHICODE_UNSUPPORTED_GENERATOR`.

### 4.3 Binary operators

- `&&` and `||` short-circuit and return an operand value, not necessarily a boolean.
- `==` and `!=` use value equality. Arrays and ordinary objects compare structurally and recursively; buffers compare byte-for-byte; primitives compare by value; functions, classes, and error values compare by identity.
- `<`, `<=`, `>`, and `>=` require two numbers or two strings.
- `+` adds two numbers, concatenates if either operand is a string, or concatenates two arrays. All other combinations are type errors.
- `-`, `*`, `/`, and `%` require numbers. Division or remainder by zero is a `YAAZHICODE_DIVISION_BY_ZERO` runtime error.
- A finite numeric operation whose result becomes non-finite raises `YAAZHICODE_NUMBER_ERROR`.
- `left உள்ளே right` tests object keys, class static members, structural array membership, or substring presence in a string.
- `left உதாரணம் Class` tests an instance against a class and its inheritance chain.

### 4.4 Primary expressions

```yaazhicode
$௪௨
"உரை"
$௧..$௫
பெயர்
[வெளிப்பாடு, ...]
{ விசை: வெளிப்பாடு, சுருக்கம், [கணக்கிடப்பட்டது]: வெளிப்பாடு }
(வெளிப்பாடு)
செயல்(அளவுரு) { ... }
செயல் பெயர்(அளவுரு) { ... }
வகுப்பு [பெயர்] [சேர்தல் வெளிப்பாடு] { ... }
புதிய பெயர்(வாதங்கள்)
```

Trailing commas are accepted in array literals, object literals, argument lists, parameter lists, import lists, and export lists. Array holes and spread/rest syntax are not supported.

A `{ ... }` at the start of a statement is parsed as a block. Wrap an object literal expression in parentheses when it begins a statement:

```yaazhicode
({ பெயர்: "YaazhiCode" });
```

Object member existence and array/string indexing:

- `object.key` and `object[expression]` read properties.
- A missing ordinary-object property yields `வெற்றிடம்`.
- Array and string indices are non-negative decimal property keys. Out-of-range and malformed reads yield `வெற்றிடம்`.
- Strings index by Unicode code point. `நீளம்(string)` and `string.நீளம்` also count code points.
- Arrays support `.நீளம்`.
- Reading a member of `வெற்றிடம்` raises `YAAZHICODE_NULL_ACCESS`.
- Assigning a new object property creates it. Assigning an array index requires a valid non-negative integer key; assigning beyond the end fills missing positions with `வெற்றிடம்`. `.நீளம்` is read-only.
- Deleting an array index removes that item and shifts later items left. Strings and other non-object values cannot be mutated through member assignment or deletion.

## 5. Statements and declarations

### 5.1 Grammar overview

```ebnf
program          = { top-level-item } , EOF ;
top-level-item   = import-declaration | export-declaration | statement ;
statement        = block
                 | empty-statement
                 | variable-declaration
                 | function-declaration
                 | class-declaration
                 | if-statement
                 | while-statement
                 | do-while-statement
                 | for-statement
                 | switch-statement
                 | try-statement
                 | return-statement
                 | break-statement
                 | continue-statement
                 | throw-statement
                 | with-statement
                 | debugger-statement
                 | expression-statement ;
block            = "{" , { statement } , "}" ;
empty-statement  = ";" ;
```

Imports and exports are allowed only at the top level of a file. They are rejected inside blocks.

### 5.2 Terminators

Statements terminated by `;`:

- variable declarations
- expression statements
- `கொடு`, `நிறுத்து`, `தொடர்`, `எறி`
- `பிழைத்திருத்து`
- imports and exports
- class property fields
- `செய் ... இருக்கும்வரை (...)` after the closing `)`

Blocks and control-flow statements that end in a block do not take a semicolon. Automatic semicolon insertion is not implemented.

### 5.3 Variable declarations

```yaazhicode
நிலையான பெயர் = "YaazhiCode";
மாறி எண் = $௧;
மாற்றி கூட்டு;
```

- `நிலையான` (`const`) is block-scoped and immutable. An initializer is required.
- `மாறி` (`let`) is block-scoped and mutable. The initializer is optional; omission initializes to `வெற்றிடம்`.
- `மாற்றி` (`var`) is function-scoped and mutable. Its declaration is hoisted to the nearest function or global scope and initialized to `வெற்றிடம்`.
- Only one binding is allowed per declaration statement.
- Duplicate declarations in the same scope and reassignment of a constant are semantic errors.

### 5.4 Blocks and functions

```yaazhicode
{
  மாறி உள்ளூர் = $௧;
}

செயல் கூட்டு(அ, ஆ) {
  கொடு அ + ஆ;
}
```

Function declarations are hoisted within their block. Functions have exact arity for user code: calling with fewer or more arguments is a runtime arity error. There are no default, optional, rest, or destructured parameters.

`கொடு` with no expression returns `வெற்றிடம்`; falling off the end also returns `வெற்றிடம்`. Recursion and closures are supported.

An `ஒத்திசைவற்ற செயல்` declaration or expression executes as a suspended continuation. Its `காத்திரு` expression yields a `YaazhiCodePromise` to the driver; the frame resumes when the promise settles. Promises are values of the built-in `உறுதி` module and are not a global JavaScript type. There is no cancellation, async iteration, or structured concurrency. Module top-level `await` is rejected with `YAAZHICODE_ASYNC_MODULE`; pending awaits in synchronous callback contexts fail with `YAAZHICODE_ASYNC_IN_SYNC_CONTEXT`. Ordinary synchronous functions and programs keep their original behavior.

Generators (`செயல்*`) and `வழங்கு` are parsed but deliberately unsupported at runtime.

### 5.5 Conditionals

```yaazhicode
என்றால் (நிபந்தனை) {
  ...
} இல்லை என்றால் (மற்றொரு_நிபந்தனை) {
  ...
} இல்லை {
  ...
}
```

The consequent and alternate may each be a single statement instead of a block. The condition uses YaazhiCode truthiness.

### 5.6 Loops

```yaazhicode
இருக்கும்வரை (நிபந்தனை) { ... }

செய் {
  ...
} இருக்கும்வரை (நிபந்தனை);

ஒவ்வொரு (மாறி எண் = $௦; எண் < $௧௦; எண் += $௧) { ... }

ஒவ்வொரு (மாறி மதிப்பு உள்ளே தொகுப்பு) { ... }
```

- C-style `ஒவ்வொரு` initialization may be a declaration, an expression, or empty. Tests and updates may be omitted with the corresponding semicolons.
- For-in accepts a `நிலையான`/`மாறி`/`மாற்றி` declaration or a previously declared mutable variable name.
- For-in iterates array elements (a snapshot), string code points, object property keys, or class static member names.
- `நிறுத்து` exits the nearest loop or switch. `தொடர்` starts the next loop iteration. The analyzer rejects them outside an appropriate construct.
- There are no labels or labeled jumps.

### 5.7 Switch

```yaazhicode
தேர்ந்தெடு (மதிப்பு) {
  நிலை $௧:
    அச்சிடு("ஒன்று");
    நிறுத்து;
  நிலை $௨:
  இயல்புநிலை:
    அச்சிடு("மற்றது");
}
```

Cases compare with YaazhiCode equality. Execution falls through unless `நிறுத்து` exits. `இயல்புநிலை` may appear among the cases; its position is not required to be last. Case bodies are statement lists, not automatically scoped blocks.

### 5.8 Try, catch, finally, and throw

```yaazhicode
முயற்சி {
  எறி பிழை("தோல்வி", "YAAZHICODE_EXAMPLE");
} பிடி (பிழை) {
  அச்சிடு(பிழை.குறியீடு);
} இறுதியில் {
  அச்சிடு("முடிந்தது");
}
```

- A `முயற்சி` requires at least one of `பிடி` or `இறுதியில்`.
- A catch clause requires exactly one binding parameter.
- `எறி` can throw any YaazhiCode value.
- Engine runtime errors caught by `பிடி` are `பிழை` values with `.செய்தி`, `.குறியீடு`, and `.தடம்`.
- `இறுதியில்` runs during normal completion, return, throw, break, continue, and process exit.
- `வெளியேறு(...)` is a process-control signal and is not swallowed by a catch clause.

### 5.9 With and debugger

```yaazhicode
உடன் (பொருள்) {
  அச்சிடு(பெயர்); // with தொகுதியில் உள்ளூர் பெயர் இல்லாவிட்டால் பொருள்.பெயர் பயன்படும்
  புதிய_பெயர் = "மதிப்பு";
}

பிழைத்திருத்து;
```

`உடன்` is available for compatibility with the registered vocabulary; prefer explicit member access in new code. `பிழைத்திருத்து` is accepted as a no-op statement.

## 6. Classes

```yaazhicode
வகுப்பு விலங்கு {
  நிலையான எண்ணிக்கை = $௦;

  உருவாக்கு(பெயர்) {
    இது.பெயர் = பெயர்;
  }

  சொல்() {
    கொடு இது.பெயர் + " ஒலி";
  }

  நிலையியல் வகை() {
    கொடு "விலங்கு";
  }
}

வகுப்பு நாய் சேர்தல் விலங்கு {
  சொல்() {
    கொடு மேல்.சொல்() + " (நாய்)";
  }
}

மாறி நாய்_பொருள் = புதிய நாய்("குட்டி");
அச்சிடு(நாய்_பொருள்.சொல்());
அச்சிடு(நாய்_பொருள் உதாரணம் விலங்கு);
```

Class member forms:

- `உருவாக்கு(params) { ... }` defines the constructor.
- `[நிலையியல்] [ஒத்திசைவற்ற] [*] பெயர்(params) { ... }` defines a method.
- `[நிலையியல்] பெயர் [= expression];` defines a field.

Class declarations create a class binding. Class expressions may be named or anonymous. Inheritance uses `சேர்தல்`. `மேல்` can call the parent constructor (`மேல்(args)`) or access a parent method (`மேல்.பெயர்(...)`).

Instantiation requires `புதிய`. Field initializers run superclass-first before the selected constructor. If a class has no constructor, instantiation forwards the supplied arguments to the nearest inherited constructor. Static members are inherited for lookup. `இது`/`மேல்` are legal only in valid class/function contexts.

There are no access modifiers, private fields, getters/setters, static initialization blocks, interfaces, abstract classes, or multiple inheritance.

## 7. Modules

YaazhiCode modules are `.yaazhi` files loaded by path, plus seventeen host-provided built-in modules loaded by exact Tamil name. The full rules and examples are in [docs/MODULES.md](docs/MODULES.md); built-in APIs are in [docs/BUILTIN_MODULES.md](docs/BUILTIN_MODULES.md).

### 7.1 Imports

```yaazhicode
இறக்குமதி { கூட்டு, பெயர் ஆக கணிதப்_பெயர் } இருந்து "./கணிதம்.yaazhi";
இறக்குமதி * ஆக கணிதம் இருந்து "./கணிதம்.yaazhi";
இறக்குமதி கணிதம் இருந்து "./கணிதம்.yaazhi";
இறக்குமதி "./பக்க_விளைவு.yaazhi";
இறக்குமதி { இணை } இருந்து "பாதை";
```

- Named, namespace (`* ஆக`), module-binding, and side-effect imports are supported.
- Named imports may alias with `ஆக`.
- A user module is executed once per canonical file path and cached.
- A built-in module is created once per interpreter and cached.
- Module namespaces, including built-in namespaces, are read-only objects.
- Imports are resolved at runtime after the entry program's semantic analysis.

### 7.2 Exports

```yaazhicode
ஏற்றுமதி நிலையான பெயர் = "YaazhiCode";
ஏற்றுமதி செயல் கூட்டு(அ, ஆ) { கொடு அ + ஆ; }
ஏற்றுமதி வகுப்பு வடிவம் { ... }
ஏற்றுமதி { கூட்டு, பெயர் ஆக பெயர்இரண்டு };
ஏற்றுமதி { கூட்டு } இருந்து "./கணிதம்.yaazhi";
ஏற்றுமதி * இருந்து "./கணிதம்.yaazhi";
```

Only variables, functions, and classes can be exported as declarations. Named local exports, named re-exports, and wildcard re-exports are supported. Default exports do not exist.

### 7.3 Resolution and checking

- Specifiers must be relative paths beginning with `./` or `../`, absolute paths, or one of the seventeen exact built-in names (`கோப்பு`, `பாதை`, `முகவரி`, `இடையகம்`, `பயன்பாடு`, `உறுதிப்படுத்து`, `நேரிகள்`, `உறுதி`, `நிகழ்வு`, `வலை`, `பாதுகாப்புவலை`, `இயங்குதளம்`, `முனையம்`, `செயல்முறை`, `வரிவாசிப்பு`, `மறையியல்`, `ஓடை`). Package-name resolution is not implemented.
- English aliases, `node:` specifiers, and specifiers with an explicit non-`.yaazhi` extension are rejected.
- A missing `.yaazhi` extension is appended; any other explicit extension is rejected.
- Canonical user-module paths use the host's real path, so different textual paths to the same file share one module instance.
- User-module paths must stay inside the configured filesystem roots. The default roots are the interpreter `cwd` and the entry file's folder; `../` traversal, external absolute paths, and symlink/junction escapes raise `YAAZHICODE_MODULE_PATH_DENIED`.
- Circular module dependencies are rejected with `YAAZHICODE_MODULE_CIRCULAR`.
- `yaazhicode check` parses and semantically analyzes the full graph without executing modules. It validates module existence, extensions, sandbox containment, cycles, built-in export names, and named import/re-export names.
- `yaazhicode run` performs the same static checks while loading, then executes each user module once. Built-in modules are not executed as source files.

## 8. Standard library and capabilities

Native functions are installed as standard globals. The reference is [docs/STANDARD_LIBRARY.md](docs/STANDARD_LIBRARY.md). Major groups:

- constants and type/conversion helpers
- console and formatted output, input
- mathematics and random values
- string and array utilities
- object utilities
- files and paths
- dates and time
- error construction/inspection
- environment variables and process exit

Seventeen built-in namespace modules are imported rather than installed as globals: the seven Phase 1 modules (`கோப்பு`, `பாதை`, `முகவரி`, `இடையகம்`, `பயன்பாடு`, `உறுதிப்படுத்து`, `நேரிகள்`) and the ten Phase 2 modules (`உறுதி`, `நிகழ்வு`, `வலை`, `பாதுகாப்புவலை`, `இயங்குதளம்`, `முனையம்`, `செயல்முறை`, `வரிவாசிப்பு`, `மறையியல்`, `ஓடை`). Their APIs are specified in [docs/BUILTIN_MODULES.md](docs/BUILTIN_MODULES.md). `இடையகம்` introduces the immutable `இடையகம்` runtime type. `நேரிகள்` is a cooperative queue drained only by an explicit `இயக்கு()` call; it does not add an event loop.

Networking is restricted to loopback hosts and `http:`/`https:` schemes. HTTPS verification remains enabled; `பாதுகாப்புவலை.நம்பகம்_சேர்` adds an explicitly supplied local certificate to that interpreter's trust set. Servers, server sockets, streams, and line readers created through built-in modules are tracked and closed by `run`, `test`, and REPL cleanup; outgoing client requests are not added to the resource registry.

The embedding API can restrict fourteen capabilities: stdio, filesystem reads, filesystem writes, environment, process, clock, random, network client, network server, terminal input, terminal output, process exit, crypto randomness, and streams. The CLI uses full capabilities. Standard-library and built-in APIs validate arity and argument types and raise structured `பிழை` values on failure.

Filesystem APIs and user-module imports are sandboxed to `InterpreterOptions.fileSystemRoots`. By default these are the interpreter `cwd` and the entry file's directory. Empty roots deny all real filesystem access. Denials use `YAAZHICODE_FS_PATH_DENIED` or `YAAZHICODE_MODULE_PATH_DENIED`; malformed paths use `YAAZHICODE_FS_INVALID_PATH`. Path validation is not an OS-level sandbox.

## 9. Execution and diagnostics

The interpreter evaluates statements and expressions directly. Lexical, syntax, semantic, module, and runtime failures use stable `YAAZHICODE_*` diagnostic codes and Tamil-first messages, notes, suggestions, reasons, and small examples where useful. Locations track UTF-16 offsets plus line and code-point column information. Undefined-name diagnostics suggest a close visible identifier.

Uncaught runtime errors stop execution and are rendered by the CLI with source context and a YaazhiCode call stack. Diagnostics retain the source file that owns the failing AST, so failures inside imported module functions and class field initializers point to the module source; call frames record the call-site filename. Interpreter call depth is capped deterministically at `512`; exceeding it raises the catchable `YAAZHICODE_STACK_OVERFLOW` code before host stack exhaustion. `--debug` adds host-internal details for unexpected engine errors. Diagnostics do not expose generated JavaScript.

The interactive REPL adds one input convenience: when a completed buffer is not valid only because an expression statement or variable declaration lacks its final `;`, the REPL retries with an inserted semicolon. This does not relax the file grammar; `.yaazhi` files and modules always require their normal terminators.

`yaazhicode test` executes selected `.yaazhi` files as ordinary programs using the `உறுதிப்படுத்து` built-in module. It introduces no test syntax or framework, runs each file in a fresh interpreter with `runAsync`, captures stdout, closes tracked resources, and returns `0` for all passing, `1` for a failure, or `2` for a usage/discovery error. `yaazhicode debug <file>` is `run --debug`: a documented run mode with source-aware stacks, not an interactive debugger. Breakpoints, stepping, and variable inspection are not part of `0.1.0`. See [docs/TESTING.md](docs/TESTING.md) and [docs/DEBUGGING.md](docs/DEBUGGING.md).

## 10. Explicitly unsupported syntax

The following are not part of YaazhiCode `0.1.0` and are diagnosed as syntax errors unless noted:

- destructuring, spread/rest, default parameters
- template literals and string interpolation syntax
- regular-expression literals
- optional chaining, nullish coalescing, ternary conditional expressions
- bitwise operators, exponentiation operator, increment/decrement
- labels and labeled break/continue
- multiple declarators in one variable statement
- default exports/imports
- package-name or `node_modules` module resolution
- English, `node:`, or URL aliases for built-in modules
- dynamic import
- getters/setters, private members, interfaces, abstract classes
- generator execution (`வழங்கு`)
- top-level `காத்திரு` in a program or module (call an `ஒத்திசைவற்ற` function instead)

See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) for behavioral and design gaps beyond syntax. Genuine promises, `காத்திரு`, and async functions are implemented as described in §5.4; they are not unsupported syntax.
