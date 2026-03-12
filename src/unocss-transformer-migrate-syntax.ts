import * as ts from 'typescript'
import type { SourceCodeTransformer } from 'unocss'

interface Replacement {
  start: number
  end: number
  value: string
}

type ClassStringLiteral = ts.StringLiteral | ts.NoSubstitutionTemplateLiteral

const TSX_SUFFIX = '.tsx'
const CLASS_TS_SUFFIX = '.class.ts'
const BORDER_SIDE_MAP = {
  t: 't',
  r: 'r',
  b: 'b',
  l: 'l',
  x: 'x',
  y: 'y',
} as const

function isClassFile(id: string): boolean {
  return id.endsWith(CLASS_TS_SUFFIX)
}

function isTsxFile(id: string): boolean {
  return id.endsWith(TSX_SUFFIX)
}

function isClassStringLiteral(node: ts.Node | undefined): node is ClassStringLiteral {
  return Boolean(node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)))
}

function getPropertyNameText(name: ts.PropertyName): string | undefined {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text
  }

  return undefined
}

function getObjectProperty(
  objectLiteral: ts.ObjectLiteralExpression,
  name: string,
): ts.PropertyAssignment | undefined {
  return objectLiteral.properties.find((property): property is ts.PropertyAssignment => {
    return ts.isPropertyAssignment(property) && getPropertyNameText(property.name) === name
  })
}

function getCallName(expression: ts.LeftHandSideExpression): string | undefined {
  if (ts.isIdentifier(expression)) {
    return expression.text
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text
  }

  return undefined
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression

  while (true) {
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression
      continue
    }

    if (ts.isAsExpression(current)) {
      current = current.expression
      continue
    }

    if (ts.isSatisfiesExpression(current)) {
      current = current.expression
      continue
    }

    if (ts.isTypeAssertionExpression(current)) {
      current = current.expression
      continue
    }

    if (ts.isNonNullExpression(current)) {
      current = current.expression
      continue
    }

    break
  }

  return current
}

function splitTokenByTopLevelColon(token: string): string[] {
  const parts: string[] = []
  let bracketDepth = 0
  let parenDepth = 0
  let braceDepth = 0
  let start = 0

  for (let index = 0; index < token.length; index += 1) {
    const char = token[index]
    if (char === '\\') {
      index += 1
      continue
    }

    if (char === '[') {
      bracketDepth += 1
      continue
    }
    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1)
      continue
    }
    if (char === '(') {
      parenDepth += 1
      continue
    }
    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1)
      continue
    }
    if (char === '{') {
      braceDepth += 1
      continue
    }
    if (char === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
      continue
    }

    if (char === ':' && bracketDepth === 0 && parenDepth === 0 && braceDepth === 0) {
      parts.push(token.slice(start, index))
      start = index + 1
    }
  }

  parts.push(token.slice(start))
  return parts
}

function normalizeBorderUtility(utility: string): string {
  if (utility === 'b') {
    return 'border'
  }
  if (utility === 'b-transparent') {
    return 'border-transparent'
  }
  if (utility === 'b-border') {
    return 'border-border'
  }

  const simpleSideMatch = utility.match(/^b-([trblxy])$/)
  if (simpleSideMatch) {
    return `border-${BORDER_SIDE_MAP[simpleSideMatch[1] as keyof typeof BORDER_SIDE_MAP]}`
  }

  const sideMatch = utility.match(/^b-([trblxy])-(.+)$/)
  if (sideMatch) {
    const side = BORDER_SIDE_MAP[sideMatch[1] as keyof typeof BORDER_SIDE_MAP]
    const tail = sideMatch[2]
    if (tail === '1') {
      return `border-${side}`
    }
    return `border-${side}-${tail}`
  }

  const borderMatch = utility.match(/^b-(.+)$/)
  if (!borderMatch) {
    return utility
  }

  const tail = borderMatch[1]
  if (tail === '1') {
    return 'border'
  }
  return `border-${tail}`
}

function normalizeUtility(utility: string): string {
  if (utility === 'font-500') {
    return 'font-medium'
  }
  if (utility === 'content-empty') {
    return "content-['']"
  }
  const cssVarValueMatch = utility.match(/^(.+)-\$([a-z0-9-]+)$/i)
  if (cssVarValueMatch) {
    return `${cssVarValueMatch[1]}-[var(--${cssVarValueMatch[2]})]`
  }
  if (utility.startsWith('animate-duration-')) {
    return `[animation-duration:${utility.slice('animate-duration-'.length)}]`
  }
  if (utility.startsWith('animate-ease-')) {
    return `[animation-timing-function:${utility.slice('animate-ease-'.length)}]`
  }
  if (utility.startsWith('animate-iteration-')) {
    return `[animation-iteration-count:${utility.slice('animate-iteration-'.length)}]`
  }
  if (utility.startsWith('b-') || utility === 'b') {
    return normalizeBorderUtility(utility)
  }

  return utility
}

function normalizeVariant(variant: string): string {
  if (variant === 'supports-backdrop-filter') {
    return 'supports-[backdrop-filter]'
  }
  if (variant === 'not-dark') {
    return '[html:not(.dark)_&]'
  }
  if (variant === 'not-last') {
    return '[&:not(:last-child)]'
  }

  return variant
}

function normalizeToken(token: string): string {
  const parts = splitTokenByTopLevelColon(token)
  if (parts.length === 1) {
    return normalizeUtility(token)
  }

  const utility = normalizeUtility(parts.pop() ?? '')
  const variants = parts.map(normalizeVariant)
  const utilityTokens = utility.match(/\S+/g) ?? [utility]
  return utilityTokens.map((utilityToken) => [...variants, utilityToken].join(':')).join(' ')
}

export function normalizeClassList(value: string): string {
  const tokens = value.match(/\S+/g)

  if (!tokens) {
    return value
  }

  return tokens.map((token) => normalizeToken(token)).join(' ')
}

function queueReplacement(
  replacements: Map<string, Replacement>,
  literal: ClassStringLiteral,
  source: string,
): void {
  const start = literal.getStart() + 1
  const end = literal.end - 1
  const key = `${start}:${end}`
  const originalValue = literal.text
  const normalizedValue = normalizeClassList(originalValue)
  const quoteChar = source[literal.getStart()]
  const nextValue = normalizedValue
    .replace(/\\/g, '\\\\')
    .replaceAll(quoteChar, `\\${quoteChar}`)
    .replace(/\$\{/g, '\\${')
  const originalSlice = source.slice(start, end)

  if (nextValue === originalSlice) {
    return
  }

  replacements.set(key, { start, end, value: nextValue })
}

function collectVariantLeafClassLiterals(
  objectLiteral: ts.ObjectLiteralExpression,
  source: string,
  replacements: Map<string, Replacement>,
): void {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue
    }

    const { initializer } = property

    if (isClassStringLiteral(initializer)) {
      queueReplacement(replacements, initializer, source)
      continue
    }

    if (ts.isObjectLiteralExpression(initializer)) {
      collectVariantLeafClassLiterals(initializer, source, replacements)
    }
  }
}

function collectCvaClassReplacements(
  call: ts.CallExpression,
  source: string,
  replacements: Map<string, Replacement>,
): void {
  const base = call.arguments[0]
  if (isClassStringLiteral(base)) {
    queueReplacement(replacements, base, source)
  }

  const config = call.arguments[1]
  if (!ts.isObjectLiteralExpression(config)) {
    return
  }

  const variantsProperty = getObjectProperty(config, 'variants')
  if (variantsProperty && ts.isObjectLiteralExpression(variantsProperty.initializer)) {
    collectVariantLeafClassLiterals(variantsProperty.initializer, source, replacements)
  }

  const compoundVariantsProperty = getObjectProperty(config, 'compoundVariants')
  if (
    !compoundVariantsProperty ||
    !ts.isArrayLiteralExpression(compoundVariantsProperty.initializer)
  ) {
    return
  }

  for (const element of compoundVariantsProperty.initializer.elements) {
    if (!ts.isObjectLiteralExpression(element)) {
      continue
    }

    const classProperty = getObjectProperty(element, 'class')
    if (!classProperty || !isClassStringLiteral(classProperty.initializer)) {
      continue
    }

    queueReplacement(replacements, classProperty.initializer, source)
  }
}

function collectClassFileReplacements(
  sourceFile: ts.SourceFile,
  source: string,
  replacements: Map<string, Replacement>,
): void {
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && getCallName(node.expression) === 'cva') {
      collectCvaClassReplacements(node, source, replacements)
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

function collectClassOperandReplacements(
  expression: ts.Expression | undefined,
  source: string,
  replacements: Map<string, Replacement>,
  insideClassesArg = false,
): void {
  if (!expression) {
    return
  }

  const current = unwrapExpression(expression)

  if (isClassStringLiteral(current)) {
    queueReplacement(replacements, current, source)
    return
  }

  if (ts.isConditionalExpression(current)) {
    collectClassOperandReplacements(current.whenTrue, source, replacements, insideClassesArg)
    collectClassOperandReplacements(current.whenFalse, source, replacements, insideClassesArg)
    return
  }

  if (ts.isBinaryExpression(current)) {
    const operator = current.operatorToken.kind
    if (
      operator === ts.SyntaxKind.AmpersandAmpersandToken ||
      operator === ts.SyntaxKind.BarBarToken ||
      operator === ts.SyntaxKind.QuestionQuestionToken
    ) {
      collectClassOperandReplacements(current.right, source, replacements, insideClassesArg)
    }

    return
  }

  if (ts.isArrayLiteralExpression(current)) {
    for (const element of current.elements) {
      if (ts.isExpression(element)) {
        collectClassOperandReplacements(element, source, replacements, insideClassesArg)
      }
    }

    return
  }

  if (!ts.isCallExpression(current)) {
    return
  }

  const callName = getCallName(current.expression)
  if (callName === 'cn') {
    if (insideClassesArg) {
      return
    }

    for (const argument of current.arguments) {
      collectClassOperandReplacements(argument, source, replacements, insideClassesArg)
    }

    return
  }

  if (callName?.endsWith('Variants')) {
    for (const argument of current.arguments.slice(1)) {
      collectClassOperandReplacements(argument, source, replacements, true)
    }
  }
}

function collectTsxReplacements(
  sourceFile: ts.SourceFile,
  source: string,
  replacements: Map<string, Replacement>,
): void {
  const visit = (node: ts.Node): void => {
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'class' &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer)) {
        queueReplacement(replacements, node.initializer, source)
      } else if (ts.isJsxExpression(node.initializer)) {
        collectClassOperandReplacements(node.initializer.expression, source, replacements)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

export function createMigrateSyntaxTransformer(): SourceCodeTransformer {
  return {
    name: 'transformer-migrate-syntax',
    enforce: 'pre',
    idFilter: (id) => isClassFile(id) || isTsxFile(id),
    transform(code, id) {
      const source = code.toString()
      const sourceFile = ts.createSourceFile(
        id,
        source,
        ts.ScriptTarget.Latest,
        true,
        isTsxFile(id) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      )
      const replacements = new Map<string, Replacement>()

      if (isClassFile(id)) {
        collectClassFileReplacements(sourceFile, source, replacements)
      } else {
        collectTsxReplacements(sourceFile, source, replacements)
      }

      const sorted = Array.from(replacements.values()).sort((a, b) => b.start - a.start)
      if (sorted.length === 0) {
        return
      }

      let nextSource = source
      for (const replacement of sorted) {
        nextSource =
          nextSource.slice(0, replacement.start) +
          replacement.value +
          nextSource.slice(replacement.end)
      }

      if (nextSource !== source) {
        code.overwrite(0, code.original.length, nextSource)
      }
    },
  }
}
