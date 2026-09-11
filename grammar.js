/**
 * @file Treesitter parser for hscript
 * @author shifterbit
 * @license MIT
 */
// import dsl from 'tree-sitter-cli/dsl'


function opRule(precFn, precName, leftExpr, op, rightExpr) {
  var sequence = [];
  if (leftExpr != null && rightExpr != null) {
    sequence = [field("left", leftExpr), field("op", op), field("right", rightExpr)];
  } else if (rightExpr != null) {
    sequence = [field("op", op), field("expr", rightExpr)];
  } else if (leftExpr != null) {
    sequence = [field("expr", leftExpr), field("op", op)];
  }
  return precFn(precName, seq(...sequence));
}
var identifier = /[a-zA-Z_][a-zA-Z0-9_]*/;
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
export default grammar({
  name: "hscript",
  precedences: () => [
    // First we need to handle operators
    [
      "statement",
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
      // "statement",
      "access-call",
      "grouping",
      "literal",
      "type_identifier",
      "field_identifier",
      "functionType",
      "typePath",
      "type",
      "expression",
      "expressionStatement",
      "expressionInline",
      "expressionList",
    ],
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
    source_file: $ => seq(repeat($.statement), optional($.expression)),
    identifier: _ => identifier,
    type_identifier: $ => prec("type_identifier", alias($.identifier, $.type_identifier)),
    field_identifier: $ => prec("field_identifier", alias($.identifier, $.field_identifier)),
    _expressionInline: $ => prec("expressionInline", choice(
      $._literal,
      $.identifier,
      $.binaryOp,
      $.unaryOp,
      $.tenaryOp,
      $.field_access,
      $.call_expression,
      $.arrayAccess,
      $.arrayDeclaration,
      $.object,
      $.new,
      $.return
    )),

    _expressionOutline: $ => prec("statement", choice(
      $.block,
      $.function_declaration
    )),
    expression: $ => prec.left("expression", choice($._expressionInline, $._expressionOutline)),
    expressionStatement: $ => prec.left("statement", choice(seq($._expressionInline, ";"), $._expressionOutline)),
    statement: $ => prec.left("statement", choice(
      $.ifExpr,
      $.switchStatement,
      $.whileExpr,
      $.doWhileExpr,
      $.variableDeclaration,
      $.forStatement,
      $.expressionStatement,
      $.break,
      $.continue
    )),
    block: $ => prec.left("block", seq(
      '{',
      field("statement", seq(repeat($.statement), optional($.expression))),
      '}'
    )),

    ifExpr: $ => prec.left(seq(
      "if",
      $.expression,
      choice($.expression, $.statement),
      optional(
        seq(
          "else",
          choice($.statement, $.expression),
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

    function_declaration: $ => prec.left(seq(
      "function",
      field("name", optional($.identifier)),
      "(",
      field("args", optional($._paramList)),
      ")",
      optional(seq(
        ":",
        $.type
      )),
      field("body", $.expression)
    )),

    variableDeclaration: $ => prec.left(seq(
      "var",
      field("name", $.identifier),
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

    forStatement: $ => seq(
      "for",
      "(",
      choice(
        $.keyValueForIterator,
        $.valueForIterator
      ),
      "in",
      $.expression,
      ")",
    ),
    keyValueForIterator: $ => seq(
      field("key", $.identifier),
      "=>",
      field("value", $.identifier)
    ),

    valueForIterator: $ => seq(
      field("value", $.identifier)
    ),


    switchStatement: $ => prec.left(seq(
      "switch",
      "(",
      $.expression,
      ")",
      "{",
      repeat($.switchCase),
      optional($.defaultCase),
      "}"
    )),

    switchCase: $ => seq(
      "case",
      $._expressionList,
      ":",
      repeat($.statement)
    ),
    defaultCase: $ => seq(
      "default",
      ":",
      repeat($.statement)
    ),

    type: $ => prec.left("type", choice(
      // "Thing.Thing.Foo"
      $.typePath,
      // Array<Thing>
      seq(
        choice($.type_identifier, $.typePath),
        $.type_params
      ),
      // Function type
      $.functionType,
      // Anonymous Type
      $.anonType,
      seq("(", $.type, ")")
    )),

    type_params: $ => seq(
      token.immediate("<"),
      field("typeParameters", $._typeList),
      token.immediate(">"),
    ),


    anonType: $ => seq(
      "{", $._paramList, "}"
    ),

    functionType: $ => prec.left("functionType", choice(
      prec.left(seq(
        $.type,
        prec.left(repeat1(prec.left(seq("->", $.type,))))
      )),
      seq(
        "(", $._typeList, ")",
        "->", $.type
      )
    )),

    typePath: $ => prec.left("typePath", seq(
      $.type_identifier,
      repeat(
        seq(
          token.immediate("."),
          // $.identifier
          alias(token.immediate(identifier), $.type_identifier),
        )
      )
    )),

    // Literal Values
    call_expression: $ => prec.left("access-call", seq(
      field("expr",$.expression),
      token.immediate("("),
      field("args", optional($._expressionList)),
      ")",
    )),

    arrayAccess: $ => prec.left("access-call", seq(
      field("expr", $.expression),
      token.immediate("["),
      field("key", $.expression),
      "]",
    )),

    new: $ => prec.left("access-call", seq(
      "new",
      field("name", $.identifier),
      token.immediate("("),
      optional($._expressionList),
      ")",
    )),

    field_access: $ => prec.left("access-call", seq(
      field("expr", $.expression),
      token.immediate("."),
      field("name", alias(token.immediate(identifier), $.field_identifier))
    )),


    _expressionList: $ => prec.right("expressionList", seq(
      $.expression,
      (repeat(prec.right(seq(",", $.expression)))),
      optional(",")

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
      field("name", $.identifier),
      field("type", optional(seq(":", $.type)))
    ),


    object: $ => seq(
      "{", $._objectFieldList, "}"
    ),

    arrayDeclaration: $ => seq(
      "[",
      optional(
        $._expressionList,
      ),
      "]"
    ),

    objectField: $ => seq(
      field("name", $.field_identifier),
      ":",
      field("value", $.expression)
    ),

    _objectFieldList: $ => seq(
      $.objectField,
      repeat(seq(",", $.objectField)),
      optional(",")
    ),

    return: $ => prec.left(seq(
      "return",
      field("value", optional($.expression)),

    )),

    break: $ => "break",
    continue: $ => "continue",

    _assignable: $ => choice($.identifier, $.arrayAccess, $.field_access),
    binaryOp: $ => prec("binary", choice(
      // Additive
      opRule(prec.left, "addition-subtraction", $.expression, "+", $.expression),
      opRule(prec.left, "addition-subtraction", $.expression, "-", $.expression),

      // Multiplicative
      opRule(prec.left, "multiplication-division", $.expression, "*", $.expression),
      opRule(prec.left, "multiplication-division", $.expression, "/", $.expression),

      opRule(prec.left, "modulo", $.expression, "%", $.expression),

      // Bitwise Ops
      opRule(prec.left, "bitwise-shifts", $.expression, ">>", $.expression),
      opRule(prec.left, "bitwise-shifts", $.expression, ">>>", $.expression),
      opRule(prec.left, "bitwise-shifts", $.expression, "<<", $.expression),
      opRule(prec.left, "bitwise-shifts", $.expression, "&", $.expression),
      opRule(prec.left, "bitwise-shifts", $.expression, "|", $.expression),

      // Logical Operators
      opRule(prec.left, "logical-and", $.expression, "&&", $.expression),
      opRule(prec.left, "logical-or", $.expression, "||", $.expression),

      // Comparison
      opRule(prec.left, "comparison", $.expression, "==", $.expression),
      opRule(prec.left, "comparison", $.expression, "!=", $.expression),
      opRule(prec.left, "comparison", $.expression, ">=", $.expression),
      opRule(prec.left, "comparison", $.expression, "<=", $.expression),
      opRule(prec.left, "comparison", $.expression, "<", $.expression),
      opRule(prec.left, "comparison", $.expression, ">", $.expression),

      // Assignment
      opRule(prec.right, "compound-assign", $._assignable, "%=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "*=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "/=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "+=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "-=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "<<=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, ">>=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, ">>>=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "&=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "|=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "^=", $.expression),
      opRule(prec.right, "compound-assign", $._assignable, "=", $.expression),

      opRule(prec.left, "interval", $.expression, "...", $.expression),
      opRule(prec.right, "arrow", $.expression, "=>", $.expression),

    )),

    unaryOp: $ => prec("unary", choice(
      opRule(prec.right, "postfix-unary", $.expression, "++", null),
      opRule(prec.right, "postfix-unary", $.expression, "--", null),
      opRule(prec.right, "prefix-unary", null, "++", $.expression),
      opRule(prec.right, "prefix-unary", null, "--", $.expression),
      opRule(prec.right, "prefix-unary", null, "-", $.expression),
      opRule(prec.right, "prefix-unary", null, "!", $.expression),
      opRule(prec.right, "prefix-unary", null, "~", $.expression),
    )),

    tenaryOp: $ => prec.right("tenary", seq(
      field("cond", $.expression),
      "?",
      field("trueExpr", $.expression),
      ":",
      field("falseExpr", $.expression),

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
    int: $ => prec("primary", (choice($._plain_int, $._hex_int))),
    float: $ => prec("primary", /[0-9]+([.][0-9]+)?([eE][0-9]+)?/),
    float: $ => prec("primary", choice(
      /[0-9]+[.][0-9]+[eE][+-]?[0-9]+/,
      /[0-9]+[.][0-9]+/,
      /[0-9]+[eE][+-]?[0-9]+/,
    )),
    _plain_int: $ => /[0-9]+/,
    _hex_int: $ => /0[xX][0-9a-fA-F]+/,
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
