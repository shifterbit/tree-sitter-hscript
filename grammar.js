/**
 * @file Treesitter parser for hscript
 * @author shifterbit
 * @license MIT
 */
// import dsl from 'tree-sitter-cli/dsl'

var identifier = /[a-zA-Z_][a-zA-Z0-9_]*/;
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
export default grammar({
  name: "hscript",
  precedences: () => [
    // First we need to handle operators
    [
      "new",
      "postfix-unary",
      "prefix-unary",
      "modulo",
      "multiplication-division",
      "addition-subtraction",
      "bitwise-shifts",
      "bitwise-operators",
      "comparison",
      "interval",
      "logical-and",
      "logical-or",
      "metadata",
      "tenary",
      "compound-assign",
      "arrow",
      "identifier",

      "primary",
      "unary",
      "binary",
      "block",
      "grouping",
      "access-call",
      "literal",
      "type_identifier",
      "field_identifier",
      "statement",
      "functionType",
      "typePath",
      "type",
      "expression",
    ]
  ],

  extras: ($) => [
    /\s/, // whitespace
    $.comment,
  ],
  supertypes: $ => [
    $.expression,
    $.statement,
    $._literal
  ],
  word: $ => $.identifier,
  rules: {
    source_file: $ => repeat($.statement),
    identifier: _ => identifier,
    type_identifier: $ => prec("type_identifier", alias($.identifier, $.type_identifier)),
    field_identifier: $ => prec("field_identifier", alias($.identifier, $.field_identifier)),
    expression: $ => prec("expression", choice(
      $._literal,
      $.block,
      $.identifier,
      $.binaryOp,
      $.unaryOp,
      $.tenaryOp,
      $.field,
      $.call,
      $.object
    )),
    statement: $ => prec.left(choice(
      $.ifExpr,
      $.switchStatement,
      $.functionDeclaration,
      $.whileExpr,
      $.doWhileExpr,
      $.variableDeclaration,
      $.expression,
    )),
    block: $ => prec.left("block", seq(
      '{',
      field("exprs", repeat(seq($.expression, ";"))),
      '}'
    )),

    ifExpr: $ => prec.left(seq(
      "if",
      $.expression,
      $.expression,
      optional(
        seq(
          "else",
          $.expression,
        )
      )
    )),

    whileExpr: $ => prec.left(seq(
      "while",
      $.expression,
      $.expression,
    )),

    doWhileExpr: $ => prec.left(seq(
      "do",
      $.expression,
      "while",
      $.expression,
    )),

    functionDeclaration: $ => prec.left(seq(
      "function",
      field("name", optional($.identifier)),
      "(",
      field("args", optional($._paramList)),
      ")",
      field("body", $.expression)
    )),

    variableDeclaration: $ => prec.left(seq(
      "var",
      $.identifier,
      optional(
        seq(
          ":",
          $.type
        )
      ),
      optional(
        seq(
          "=",
          $.expression
        )
      ),
      ";"
    )),

    metadataDefinition: $ => seq(
      "@",
      token.immediate(identifier),
      optional(seq(
        "(",
        $._expressionList,
        ")"
      )),
      $.expression
    ),


    switchStatement: $ => prec.left(seq(
      "switch",
      "(",
      $.expression,
      ")",
      "{",
      repeat($._switchCase),
      optional($._defaultCase),
      "}"
    )),

    _switchCase: $ => seq(
      "case",
      $._expressionList,
      ":",
      $.expression
    ),
    _defaultCase: $ => seq(
      "default",
      ":",
      $.expression
    ),

    type: $ => prec.left("type", choice(
      // "Thing.Thing.Foo"
      $._typePath,
      // Array<Thing>
      seq(
        choice($.type_identifier, $._typePath),
        token.immediate("<"),
        $._typeList,
        token.immediate(">"),
      ),
      // Function type
      $._functionType,
      // Anonymous Type
      $._anonType,
      seq("(", $.type, ")")
    )),


    _anonType: $ => seq(
      "{", $._paramList, "}"
    ),

    _functionType: $ => prec.left("functionType", choice(
      prec.left(seq(
        $.type,
        prec.left(repeat1(prec.left(seq("->", $.type,))))
      )),
      seq(
        "(", $._typeList, ")",
        "->", $.type
      )
    )),

    _typePath: $ => prec.left("typePath", seq(
      $.type_identifier,
      repeat(
        seq(
          token.immediate("."),
          // $.identifier
          token.immediate(identifier),
        )
      )
    )),

    // Literal Values
    call: $ => prec.left("access-call", seq(
      $.expression,
      token.immediate("("),
      optional($._expressionList),
      ")",
    )),

    field: $ => prec.left("access-call", seq(
      field("expr", $.expression),
      token.immediate("."),
      field("name", token.immediate(identifier))
    )),


    _expressionList: $ => prec.left(seq(
      $.expression,
      repeat(seq(",", $.expression,))
    )),
    _typeList: $ => prec.left(seq(
      $.type,
      repeat(seq(",", $.type))
    )),

    _paramList: $ => seq(
      $.parameter,
      repeat(seq(",", $.parameter))
    ),

    parameter: $ => seq(
      $.identifier,
      optional(seq(":", $.type))
    ),


    object: $ => seq(
      "{", $._objectFieldList, "}"
    ),

    objectField: $ => seq(
      $.field_identifier,
      ":",
      $.expression
    ),

    _objectFieldList: $ => seq(
      $.objectField,
      repeat(seq(",", $.objectField)),
      optional(",")
    ),

    binaryOp: $ => prec("binary", choice(
      // Additive
      prec.left("addition-subtraction", seq($.expression, "+", $.expression)),
      prec.left("addition-subtraction", seq($.expression, "-", $.expression)),

      // Multiplicative
      prec.left("multiplication-division", seq($.expression, "*", $.expression)),
      prec.left("multiplication-division", seq($.expression, "/", $.expression)),

      prec.left("modulo", seq($.expression, "/", $.expression)),

      // Bitwise Ops
      prec.left("bitwise-shifts", seq($.expression, ">>", $.expression)),
      prec.left("bitwise-shifts", seq($.expression, ">>>", $.expression)),
      prec.left("bitwise-shifts", seq($.expression, "<<", $.expression)),

      prec.left("bitwise-operators", seq($.expression, "&", $.expression)),
      prec.left("bitwise-operators", seq($.expression, "|", $.expression)),
      prec.left("bitwise-operators", seq($.expression, "^", $.expression)),

      // Logical Operators
      prec.left("logical-and", seq($.expression, "&&", $.expression)),
      prec.left("logical-or", seq($.expression, "||", $.expression)),

      // Equality
      prec.left("comparison", seq($.expression, "==", $.expression)),
      prec.left("comparison", seq($.expression, "!=", $.expression)),
      prec.left("comparison", seq($.expression, ">=", $.expression)),
      prec.left("comparison", seq($.expression, "<=", $.expression)),
      prec.left("comparison", seq($.expression, "<", $.expression)),
      prec.left("comparison", seq($.expression, ">", $.expression)),

      // Compound Assignment
      prec.right("compound-assign", seq($.expression, "%=", $.expression)),
      prec.right("compound-assign", seq($.expression, "*=", $.expression)),
      prec.right("compound-assign", seq($.expression, "/=", $.expression)),
      prec.right("compound-assign", seq($.expression, "+=", $.expression)),
      prec.right("compound-assign", seq($.expression, "-=", $.expression)),
      prec.right("compound-assign", seq($.expression, "<<=", $.expression)),
      prec.right("compound-assign", seq($.expression, ">>=", $.expression)),
      prec.right("compound-assign", seq($.expression, ">>>=", $.expression)),
      prec.right("compound-assign", seq($.expression, "&=", $.expression)),
      prec.right("compound-assign", seq($.expression, "|=", $.expression)),
      prec.right("compound-assign", seq($.expression, "^=", $.expression)),
      prec.right("compound-assign", seq($.expression, "=", $.expression)),

      prec.left("interval", seq($.expression, "...", $.expression)),
      prec.right("arrow", seq($.expression, "=>", $.expression)),

    )),

    unaryOp: $ => prec("unary", choice(
      prec.right("postfix-unary", seq($.expression, "++")),
      prec.right("postfix-unary", seq($.expression, "--")),
      prec.right("prefix-unary", seq("++", $.expression)),
      prec.right("prefix-unary", seq("--", $.expression)),
      prec.right("prefix-unary", seq("-", $.expression)),
      prec.right("prefix-unary", seq("!", $.expression)),
      prec.right("prefix-unary", seq("~", $.expression)),
    )),

    tenaryOp: $ => prec.right("tenary", seq(
      $.expression,
      "?",
      $.expression,
      ":",
      $.expression,

    )),

    _literal: $ => prec("literal", choice(
      $.int,
      $.float,
      $.bool,
      $.nil,
      $.string,
      $.parent,
    )),


    parent: $ => prec("grouping", seq("(", $.expression, ")")),
    nil: $ => prec("primary", "null"),
    bool: $ => prec("primary", choice("true", "false")),
    int: $ => prec("primary", (choice($.plain_int, $.int))),
    float: $ => prec("primary", /[0-9]+([.][0-9]+)?([eE][0-9]+)?/),
    plain_int: $ => /[0-9]+/,
    hex_int: $ => /0x[0-9A-Fa-f]+/,
    string: $ => prec.left("primary", 
      choice(
        /\"(?<string>(?:(?<escape>\\[a-zA-Z0-9\\\"])|[^\"\\\n])*)\"/,
        /\'(?<string>(?:(?<escape>\\[a-zA-Z0-9\\\'])|[^\'\\\n])*)\'/,
      )
    ),
    comment: $ =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),
  },
});
