
; highlights.scm
; Preprocessor Statement
; --------
; (preprocessor_statement) @tag
; ; (metadata name: (identifier) @type) @tag

; MetaData
; --------
; (metadata) @tag
; (metadata name: (identifier) @type) @tag

; Generic/Type Params
; --------------
(type_params
  "<" @punctuation.bracket
  ">" @punctuation.bracket
)

; Declarations
; ------------

; (class_declaration name: (identifier) @type.definition)
; (interface_declaration name: (identifier) @type.definition)
; (typedef_declaration name: (identifier) @type.definition)

(function_declaration name: (identifier) @function)
(parameter name: (identifier) @variable.parameter)

; Expressions
; -----------
; (call_expression name: (identifier) @variable.parameter)

; TODO: Figure out how to determined when "nested member call" is last ident.
; apparently this is a known issue https://github.com/tree-sitter/tree-sitter/issues/880
(call_expression expr: [
  (_) @function
  (_ (identifier) @function .)
  (_(_ (identifier) @function .))
  (_(_(_ (identifier) @function .)))
  (_(_(_(_ (identifier) @function .))))
  (_(_(_(_(_ (identifier) @function .)))))
])

; Literals
; --------
; [(keyword) (null)] @keyword
(type) @type
(type_identifier) @type
; (package_name) @module
; (type (identifier) !built_in) @type
; (type built_in: (identifier)) @type.builtin
[(int) (float)] @number
(string) @string
(bool) @boolean
; (escape_sequence) @punctuation
(nil) @constant.builtin
; (access_identifiers "null" @keyword)
[
; Logical
    "&&"
    "||"
; Mod
    "%"
; Bitwise
    ">>"
    ">>>"
    "<<"
    "|"
    "&"
; Add subtract
    "+"
    "-"
; Comparison
    "=="
    "!="
    ">="
    "<="
    ">"
    "<"

; Compound Assign
    "%=" 
    "*=" 
    "/=" 
    "+=" 
    "-=" 
    "<<="
    ">>="
    ">>>="
    "&=" 
    "|=" 
    "^=" 
    "="
] @operator

; Keywords
; --------
[
;   "abstract"
;   "as"
;   "break"
    (break)
  "case"
;   "cast"
;   "catch"
;   "class"
;   "continue"
    (continue)
  "default"
  "do"
;   "dynamic"
  "else"
;   "enum"
;   "extends"
;   "extern"
;   "final"
  "for"
  "function"
  "if"
;   "implements"
;   "import"
  "in"
;   "inline"
;   "interface"
;   "macro"
;   "operator"
;   "overload"
;   "override"
;   "package"
;   "private"
;   "public"
  "return"
;   "static"
  "switch"
;   "this"
;   "throw"
;   "try"
;   "typedef"
;   "untyped"
;   "using"
  "var"
  "while"
] @keyword

; (function_declaration name: "new" @constructor)
; (call_expression
;   "new" @keyword
;   constructor: (type_name) @constructor
; )

; Tokens
; ------

(":") @punctuation.special
; (pair [":" "=>"] @punctuation.special)

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
]  @punctuation.bracket
;
[
;   ";"
;   "?."
;   "."
  ","
] @punctuation.delimiter


; Interpolation
; -------------
; (interpolation "$" @punctuation.special)
; (interpolation
;   "${" @punctuation.special
;   "}" @punctuation.special
; ) @embedded

