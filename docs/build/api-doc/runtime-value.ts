import type { RuntimeAttributeValueApi } from './types'

export interface NodeLike {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

export interface StaticValueAnalysis {
  values: Array<string | boolean>
  dynamic: boolean
}

export const BOOLEAN_ARIA_ATTRIBUTES = new Set([
  'aria-atomic',
  'aria-busy',
  'aria-disabled',
  'aria-expanded',
  'aria-hidden',
  'aria-invalid',
  'aria-modal',
  'aria-multiline',
  'aria-multiselectable',
  'aria-pressed',
  'aria-readonly',
  'aria-required',
  'aria-selected',
])

export function isNode(value: unknown): value is NodeLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string' &&
    typeof (value as { start?: unknown }).start === 'number' &&
    typeof (value as { end?: unknown }).end === 'number'
  )
}

export function unwrapExpression(expression: unknown): NodeLike | null {
  let current = isNode(expression) ? expression : null
  while (
    current &&
    (current.type === 'TSAsExpression' ||
      current.type === 'TSTypeAssertion' ||
      current.type === 'TSNonNullExpression' ||
      current.type === 'TSInstantiationExpression' ||
      current.type === 'ParenthesizedExpression')
  ) {
    current = isNode(current.expression) ? current.expression : null
  }
  return current
}

function combineAnalyses(analyses: StaticValueAnalysis[]): StaticValueAnalysis {
  return {
    values: analyses.flatMap((analysis) => analysis.values),
    dynamic: analyses.some((analysis) => analysis.dynamic),
  }
}

/**
 * Collect statically known runtime values without discarding unresolved branches.
 * Empty results with `dynamic: false` represent omission (`null` or `undefined`).
 */
export function analyzeStaticValues(expression: unknown): StaticValueAnalysis {
  const current = unwrapExpression(expression)
  if (!current) {
    return { values: [], dynamic: true }
  }
  if (current.type === 'Literal') {
    if (typeof current.value === 'string' || typeof current.value === 'boolean') {
      return { values: [current.value], dynamic: false }
    }
    if (current.value === null || current.value === undefined) {
      return { values: [], dynamic: false }
    }
    return { values: [], dynamic: true }
  }
  if (current.type === 'Identifier' && current.name === 'undefined') {
    return { values: [], dynamic: false }
  }
  if (current.type === 'TemplateLiteral') {
    const expressions = Array.isArray(current.expressions) ? current.expressions : []
    const quasis = Array.isArray(current.quasis) ? current.quasis : []
    if (expressions.length === 0 && quasis.length === 1) {
      const quasi = quasis[0]
      if (isNode(quasi) && typeof quasi.value === 'object' && quasi.value !== null) {
        const cooked = (quasi.value as { cooked?: unknown }).cooked
        if (typeof cooked === 'string') {
          return { values: [cooked], dynamic: false }
        }
      }
    }
    return { values: [], dynamic: true }
  }
  if (current.type === 'ConditionalExpression') {
    return combineAnalyses([
      analyzeStaticValues(current.consequent),
      analyzeStaticValues(current.alternate),
    ])
  }
  if (
    current.type === 'LogicalExpression' &&
    (current.operator === '||' || current.operator === '??')
  ) {
    return combineAnalyses([analyzeStaticValues(current.left), analyzeStaticValues(current.right)])
  }
  return { values: [], dynamic: true }
}

export function uniqueStaticStrings(values: Array<string | boolean>): string[] {
  return [...new Set(values.map(String))]
}

export function classifyRuntimeValue(name: string, expression: unknown): RuntimeAttributeValueApi {
  const analysis = analyzeStaticValues(expression)
  const values = uniqueStaticStrings(analysis.values)

  if (name.startsWith('data-') && !analysis.dynamic && values.length === 1 && values[0] === '') {
    return { kind: 'presence' }
  }
  if (BOOLEAN_ARIA_ATTRIBUTES.has(name)) {
    const knownValuesAreBoolean = values.every((value) => value === 'true' || value === 'false')
    if (knownValuesAreBoolean && (values.length > 0 || analysis.dynamic)) {
      return { kind: 'boolean' }
    }
  }
  if (analysis.dynamic) {
    return { kind: 'dynamic' }
  }
  if (values.length === 1) {
    return { kind: 'literal', value: values[0]! }
  }
  if (values.length > 1) {
    return { kind: 'enum', values: [...values].sort() }
  }
  return { kind: 'dynamic' }
}

export function mergeRuntimeValues(
  left: RuntimeAttributeValueApi,
  right: RuntimeAttributeValueApi,
): RuntimeAttributeValueApi {
  if (left.kind === 'dynamic' || right.kind === 'dynamic') {
    return { kind: 'dynamic' }
  }
  if (left.kind === 'presence' || right.kind === 'presence') {
    return left.kind === 'presence' && right.kind === 'presence'
      ? { kind: 'presence' }
      : { kind: 'dynamic' }
  }
  if (left.kind === 'boolean' || right.kind === 'boolean') {
    if (left.kind === 'boolean' && right.kind === 'boolean') {
      return { kind: 'boolean' }
    }
    const other = left.kind === 'boolean' ? right : left
    if (other.kind === 'boolean') {
      return { kind: 'boolean' }
    }
    const values = other.kind === 'literal' ? [other.value] : other.values
    return values.every((value) => value === 'true' || value === 'false')
      ? { kind: 'boolean' }
      : { kind: 'dynamic' }
  }

  const leftValues = left.kind === 'literal' ? [left.value] : left.values
  const rightValues = right.kind === 'literal' ? [right.value] : right.values
  const values = [...new Set([...leftValues, ...rightValues])].sort()
  return values.length === 1 ? { kind: 'literal', value: values[0]! } : { kind: 'enum', values }
}
