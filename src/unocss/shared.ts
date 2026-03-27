import type MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import type {
  CallExpression,
  Expression,
  JSXAttribute,
  Node,
  ObjectExpression,
  ObjectProperty,
  Program,
  StringLiteral,
  TemplateLiteral,
} from 'oxc-parser'
import { walk } from 'oxc-walker'

interface Replacement {
  start: number
  end: number
  value: string
}

interface ClassStringContent {
  start: number
  end: number
  text: string
}

type ClassStringNode = StringLiteral | TemplateLiteral

export type ReplacementFactory = (
  start: number,
  end: number,
  text: string,
  source: string,
) => Replacement | null

const TSX_SUFFIX = '.tsx'
const CLASS_TS_SUFFIX = '.class.ts'
const VARIANT_CONST_SUFFIX = 'VARIANT'

export function normalizeId(id: string): string {
  return id.replace(/[?#].*$/, '')
}

function isClassFile(id: string): boolean {
  return normalizeId(id).endsWith(CLASS_TS_SUFFIX)
}

function isTsxFile(id: string): boolean {
  return normalizeId(id).endsWith(TSX_SUFFIX)
}

function unwrapExpression(node: Node | null | undefined): Node | null | undefined {
  let current = node

  while (current) {
    if (current.type === 'ParenthesizedExpression') {
      current = current.expression
      continue
    }

    if (current.type === 'TSAsExpression') {
      current = current.expression
      continue
    }

    if (current.type === 'TSSatisfiesExpression') {
      current = current.expression
      continue
    }

    if (current.type === 'TSTypeAssertion') {
      current = current.expression
      continue
    }

    if (current.type === 'TSNonNullExpression') {
      current = current.expression
      continue
    }

    break
  }

  return current
}

function getCallName(callee: Expression): string | undefined {
  if (callee.type === 'Identifier') {
    return callee.name
  }

  if (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier'
  ) {
    return callee.property.name
  }

  return undefined
}

function getPropertyName(key: ObjectProperty['key']): string | undefined {
  if (key.type === 'Identifier') {
    return key.name
  }

  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value
  }

  return undefined
}

function isVariantConstName(name: string): boolean {
  return name.endsWith(VARIANT_CONST_SUFFIX)
}

function getObjectProperty(
  objectLiteral: ObjectExpression,
  name: string,
): ObjectProperty | undefined {
  return objectLiteral.properties.find((property): property is ObjectProperty => {
    return property.type === 'Property' && getPropertyName(property.key) === name
  })
}

function isClassStringNode(node: Node | null | undefined): node is ClassStringNode {
  if (!node) {
    return false
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return true
  }

  return node.type === 'TemplateLiteral' && node.expressions.length === 0
}

function getClassStringContent(node: ClassStringNode): ClassStringContent {
  if (node.type === 'Literal') {
    return {
      start: node.start + 1,
      end: node.end - 1,
      text: node.value,
    }
  }

  const quasi = node.quasis[0]
  return {
    start: node.start + 1,
    end: node.end - 1,
    text: quasi?.value.cooked ?? quasi?.value.raw ?? '',
  }
}

function queueReplacement(
  replacements: Map<string, Replacement>,
  node: ClassStringNode,
  source: string,
  factory: ReplacementFactory,
): void {
  const content = getClassStringContent(node)
  const replacement = factory(content.start, content.end, content.text, source)

  if (!replacement) {
    return
  }

  const key = `${replacement.start}:${replacement.end}`
  replacements.set(key, replacement)
}

function collectVariantLeafClassReplacements(
  objectLiteral: ObjectExpression,
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
): void {
  for (const property of objectLiteral.properties) {
    if (property.type !== 'Property') {
      continue
    }

    const initializer = property.value

    if (isClassStringNode(initializer)) {
      queueReplacement(replacements, initializer, source, factory)
      continue
    }

    if (initializer.type === 'ObjectExpression') {
      collectVariantLeafClassReplacements(initializer, source, replacements, factory)
    }
  }
}

function collectCvaClassReplacements(
  callNode: CallExpression,
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
): void {
  const base = callNode.arguments[0]
  if (isClassStringNode(base)) {
    queueReplacement(replacements, base, source, factory)
  }

  const config = callNode.arguments[1]
  if (!config || config.type !== 'ObjectExpression') {
    return
  }

  const variantsProperty = getObjectProperty(config, 'variants')
  if (variantsProperty?.value.type === 'ObjectExpression') {
    collectVariantLeafClassReplacements(variantsProperty.value, source, replacements, factory)
  }

  const compoundVariantsProperty = getObjectProperty(config, 'compoundVariants')
  if (!compoundVariantsProperty || compoundVariantsProperty.value.type !== 'ArrayExpression') {
    return
  }

  for (const element of compoundVariantsProperty.value.elements) {
    if (!element || element.type !== 'ObjectExpression') {
      continue
    }

    const classProperty = getObjectProperty(element, 'class')
    if (!classProperty || !isClassStringNode(classProperty.value)) {
      continue
    }

    queueReplacement(replacements, classProperty.value, source, factory)
  }
}

function collectClassOperandReplacements(
  node: Node | null | undefined,
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
  insideClassesArg = false,
): void {
  const current = unwrapExpression(node)

  if (!current) {
    return
  }

  if (isClassStringNode(current)) {
    queueReplacement(replacements, current, source, factory)
    return
  }

  if (current.type === 'ConditionalExpression') {
    collectClassOperandReplacements(
      current.consequent,
      source,
      replacements,
      factory,
      insideClassesArg,
    )
    collectClassOperandReplacements(
      current.alternate,
      source,
      replacements,
      factory,
      insideClassesArg,
    )
    return
  }

  if (current.type === 'LogicalExpression') {
    collectClassOperandReplacements(current.right, source, replacements, factory, insideClassesArg)
    return
  }

  if (current.type === 'ArrayExpression') {
    for (const element of current.elements) {
      collectClassOperandReplacements(element, source, replacements, factory, insideClassesArg)
    }

    return
  }

  if (current.type !== 'CallExpression') {
    return
  }

  const callName = getCallName(current.callee)
  if (callName === 'cn') {
    if (insideClassesArg) {
      return
    }

    for (const argument of current.arguments) {
      collectClassOperandReplacements(argument, source, replacements, factory, insideClassesArg)
    }

    return
  }

  if (callName?.endsWith('Variants')) {
    for (const argument of current.arguments.slice(1)) {
      collectClassOperandReplacements(argument, source, replacements, factory, true)
    }
  }
}

function collectClassFileReplacements(
  program: Program,
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
): void {
  walk(program, {
    enter(node) {
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
        if (!isVariantConstName(node.id.name)) {
          return
        }

        const initializer = unwrapExpression(node.init)
        if (initializer?.type === 'ObjectExpression') {
          collectVariantLeafClassReplacements(initializer, source, replacements, factory)
        }

        return
      }

      if (node.type === 'CallExpression' && getCallName(node.callee) === 'cva') {
        collectCvaClassReplacements(node, source, replacements, factory)
      }
    },
  })
}

function collectTsxReplacements(
  program: Program,
  source: string,
  replacements: Map<string, Replacement>,
  factory: ReplacementFactory,
): void {
  walk(program, {
    enter(node) {
      if (!isClassJsxAttribute(node)) {
        return
      }

      if (isClassStringNode(node.value)) {
        queueReplacement(replacements, node.value, source, factory)
      } else if (node.value?.type === 'JSXExpressionContainer') {
        collectClassOperandReplacements(node.value.expression, source, replacements, factory)
      }

      this.skip()
    },
  })
}

function isClassJsxAttribute(node: Node): node is JSXAttribute {
  return (
    node.type === 'JSXAttribute' &&
    node.name.type === 'JSXIdentifier' &&
    node.name.name === 'class' &&
    Boolean(node.value)
  )
}

export function runTransform(code: MagicString, id: string, factory: ReplacementFactory): void {
  const source = code.toString()
  const lang = isTsxFile(id) ? 'tsx' : 'ts'
  const { program } = parseSync(id, source, { lang, sourceType: 'module' })
  const replacements = new Map<string, Replacement>()

  if (isClassFile(id)) {
    collectClassFileReplacements(program, source, replacements, factory)
  } else {
    collectTsxReplacements(program, source, replacements, factory)
  }

  const sorted = Array.from(replacements.values()).sort((left, right) => right.start - left.start)
  if (sorted.length === 0) {
    return
  }

  let nextSource = source
  for (const replacement of sorted) {
    nextSource =
      nextSource.slice(0, replacement.start) + replacement.value + nextSource.slice(replacement.end)
  }

  if (nextSource !== source) {
    code.overwrite(0, code.original.length, nextSource)
  }
}
