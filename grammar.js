/**
 * @file Treesitter parser for hscript
 * @author shifterbit
 * @license MIT
 */
import dsl from 'tree-sitter-cli/dsl'

var identifier = /[a-zA-Z_][a-zA-Z0-9_]*/;
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
export default grammar({
  name: "hscript",
  precedences: [
    // First we need to handle operators
    [
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
    ]

  ],

  rules: {

    source_file: $ => choice($.block, seq($.expression)),
    identifier: $ => identifier,
    expression: $ => choice(
      $._literal,
      $.block,
      $.parent,
      $.identifier,
      $.binaryOp,
      $.unaryOp,
      $.tenaryOp,

    ),
    block: $ => seq(
      '{',
      repeat($.expression),
      '}'
    ),

    ifExpr: $ => seq(
      "if",
      $.expression,
      $.expression,
      optional(
        seq(
          "else",
          $.expression,
        )
      )
    ),

    whileExpr: $ => seq(
      "while",
      $.expression,
      $.expression,
    ),

    doWhileExpr: $ => seq(
      "do",
      $.expression,
      "while",
      $.expression,
    ),

    functionDeclaration: $ => seq(
      "function",
      "(",
      ")",
      $.expression
    ),

    variableDeclaration: $ => seq(
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
    ),

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


    switchStatement: $ => seq(
      "switch",
      "(",
      $.expression,
      ")",
      "{",
      repeat($._switchCase),
      optional($._defaultCase),
      "}"
    ),

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

    type: $ => choice(
      $.identifier,
      $._typePath,
      // Array<Thing>
      seq(
        $.type,
        token.immediate("<"),
        $._typeList,
        token.immediate(">"),
      ),
      // Function type
      $._functionType,
      // Anonymous Type
      $._paramList,
      seq("(", $.type, ")")
    ),


    _anonType: $ => seq(
      "{", $._paramList, "}"
    ),

    _functionType: $ => choice(
      seq(
        $.type,
        repeat1(seq("->", $.type,))
      ),
      seq(
        "(", $._typeList, ")",
        "->", $.type
      )
    ),

    _typePath: $ => seq(
      $.identifier,
      repeat(
        seq(
          token.immediate("."),
          // $.identifier
          token.immediate(identifier),
        )
      )
    ),

    // Literal Values
    call: $ => seq(
      $.expression,
      "(",
      $._expressionList,
      ")",
    ),

    field: $ => seq(
      $.expression,
      token.immediate("."),
      token.immediate(identifier)
    ),


    _expressionList: $ => seq(
      $.expression,
      repeat(seq(",", $.expression,))
    ),
    _typeList: $ => seq(
      $.type,
      repeat(seq(",", $.type))
    ),

    _paramList: $ => seq(
      $.parameter,
      repeat(seq(",", $.parameter))
    ),

    parameter: $ => seq(
      $.identifier,
      optional(seq(":", $.type))
    ),


    _anonObject: $ => seq(
      "{", $._anonFieldList, "}"
    ),

    anonField: $ => seq(
      $.identifier,
      ":",
      $.expression
    ),

    _anonFieldList: $ => seq(
      $.anonField,
      repeat(seq(",", $.anonField))
    ),

    binaryOp: $ => choice(
      // Additive
      prec("addition-subtraction", seq($.expression, "+", $.expression)),
      prec("addition-subtraction", seq($.expression, "-", $.expression)),

      // Multiplicative
      prec("multiplication-division", seq($.expression, "*", $.expression)),
      prec("multiplication-division", seq($.expression, "/", $.expression)),

      prec("modulo", seq($.expression, "/", $.expression)),

      // Bitwise Ops
      prec("bitwise-shifts", seq($.expression, ">>", $.expression)),
      prec("bitwise-shifts", seq($.expression, ">>>", $.expression)),
      prec("bitwise-shifts", seq($.expression, "<<", $.expression)),

      prec("bitwise-operators", seq($.expression, "&", $.expression)),
      prec("bitwise-operators", seq($.expression, "|", $.expression)),
      prec("bitwise-operators", seq($.expression, "^", $.expression)),

      // Logical Operators
      preq("logical-and", seq($.expression, "&&", $.expression)),
      preq("logical-or", seq($.expression, "||", $.expression)),

      // Equality
      prec("comparison", seq($.expression, "==", $.expression)),
      prec("comparison", seq($.expression, "!=", $.expression)),
      prec("comparison", seq($.expression, ">=", $.expression)),
      prec("comparison", seq($.expression, "<=", $.expression)),
      prec("comparison", seq($.expression, "<", $.expression)),
      prec("comparison", seq($.expression, ">", $.expression)),

      // Compound Assignment
      preq("compound-assign", seq($.expression, "%=", $.expression)),
      preq("compound-assign", seq($.expression, "*=", $.expression)),
      preq("compound-assign", seq($.expression, "/=", $.expression)),
      preq("compound-assign", seq($.expression, "+=", $.expression)),
      preq("compound-assign", seq($.expression, "-=", $.expression)),
      preq("compound-assign", seq($.expression, "<<=", $.expression)),
      preq("compound-assign", seq($.expression, ">>=", $.expression)),
      preq("compound-assign", seq($.expression, ">>>=", $.expression)),
      preq("compound-assign", seq($.expression, "&=", $.expression)),
      preq("compound-assign", seq($.expression, "|=", $.expression)),
      preq("compound-assign", seq($.expression, "^=", $.expression)),

      preq("interval", seq($.expression, "...", $.expression)),

    ),

    unaryOp: $ => choice(
     preq("postfix-unary", seq($.expression, "++")) ,
     preq("prefix-unary", seq("++", $.expression)),
     preq("postfix-unary", seq($.expression, "--")),
     preq("prefix-unary", seq("--", $.expression)),
     preq("prefix-unary", seq("-", $.expression)),
     preq("prefix-unary", seq("!", $.expression)),
     preq("prefix-unary", seq("~", $.expression)),
    ),

    tenaryOp: $ => seq(
      $.expression,
      "?",
      $.expression,
      ":",
      $.expression,

    ),

    _literal: $ => choice(
      $.int,
      $.float,
      $.bool,
      $.nil,
      $.string,
      $.parent,
      $.identifier
    ),


    parent: $ => seq("(", $.expression, ")"),
    nil: $ => "null",
    bool: $ => choice("true", "false"),
    int: $ => choice($.plain_int, $.int),
    float: $ => /[0-9]+([.][0-9]+)([eE][0-9]+)/,
    plain_int: $ => /[\d]+/,
    hex_int: $ => /0x[0-9A-Fa-f]+/,
    string: $ => /".*?"|'.*?'/,
  }
});
