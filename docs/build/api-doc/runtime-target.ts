import {
  analyzeStaticValues,
  isNode,
  mergeRuntimeValues,
  uniqueStaticStrings,
  unwrapExpression,
} from './runtime-value'
import type { NodeLike } from './runtime-value'
import type { RuntimeAttributeApi, RuntimeTargetApi } from './types'

export type { NodeLike } from './runtime-value'

export interface ImportBinding {
  importedName: string
  source: string
}

export interface RuntimeExtractionOptions {
  sourcePath: string
  implementationName: string
  publicSlotNames: ReadonlySet<string>
  targetFallback: string
  allowHostFallback?: boolean
  delegateRootTargets?: Readonly<Record<string, string>>
  defaultElement?: string
}

export interface RuntimeTargetState extends RuntimeTargetApi {
  attributeMap: Map<string, RuntimeAttributeApi>
  physicalIdentity?: string
  selectorAlias?: boolean
}

export function visitNodes(
  root: unknown,
  visit: (node: NodeLike, ancestors: readonly NodeLike[]) => void,
  ancestors: readonly NodeLike[] = [],
): void {
  if (Array.isArray(root)) {
    for (const value of root) {
      visitNodes(value, visit, ancestors)
    }
    return
  }
  if (!isNode(root)) {
    return
  }

  visit(root, ancestors)
  const nextAncestors = [...ancestors, root]
  for (const [key, value] of Object.entries(root)) {
    if (key !== 'comments' && key !== 'parent') {
      visitNodes(value, visit, nextAncestors)
    }
  }
}

export function propertyName(node: unknown): string | null {
  if (!isNode(node)) {
    return null
  }
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
    return typeof node.name === 'string' ? node.name : null
  }
  if (node.type === 'Literal') {
    return typeof node.value === 'string' ? node.value : null
  }
  return null
}

export function jsxName(node: unknown): string | null {
  if (!isNode(node)) {
    return null
  }
  if (node.type === 'JSXIdentifier') {
    return typeof node.name === 'string' ? node.name : null
  }
  if (node.type === 'JSXMemberExpression') {
    const object = jsxName(node.object)
    const property = jsxName(node.property)
    return object && property ? `${object}.${property}` : null
  }
  return null
}

export function getJsxAttributeName(attribute: NodeLike): string | null {
  const name = attribute.name
  if (!isNode(name)) {
    return null
  }
  if (name.type === 'JSXIdentifier') {
    return typeof name.name === 'string' ? name.name : null
  }
  if (name.type === 'JSXNamespacedName') {
    const namespace = propertyName(name.namespace)
    const localName = propertyName(name.name)
    return namespace && localName ? `${namespace}:${localName}` : null
  }
  return null
}

export function attributeExpression(attribute: NodeLike): unknown {
  const value = attribute.value
  if (!value) {
    return { type: 'Literal', start: attribute.start, end: attribute.end, value: '' }
  }
  if (isNode(value) && value.type === 'JSXExpressionContainer') {
    return value.expression
  }
  return value
}

export function returnedExpressions(body: unknown): NodeLike[] {
  const results: NodeLike[] = []
  visitNodes(body, (node, ancestors) => {
    if (node.type !== 'ReturnStatement') {
      return
    }
    const nestedFunction = ancestors.some(
      (ancestor) =>
        ancestor !== body &&
        (ancestor.type === 'FunctionDeclaration' ||
          ancestor.type === 'FunctionExpression' ||
          ancestor.type === 'ArrowFunctionExpression'),
    )
    if (!nestedFunction) {
      const expression = unwrapExpression(node.argument)
      if (expression) {
        results.push(expression)
      }
    }
  })
  return results
}

export function returnedExpression(body: unknown): NodeLike | null {
  return returnedExpressions(body)[0] ?? null
}

export function objectPropertyExpression(property: NodeLike): unknown {
  if (property.kind === 'get' && isNode(property.value)) {
    return returnedExpression(property.value.body)
  }
  return property.value
}

export function collectBindings(root: unknown): Map<string, NodeLike> {
  const bindings = new Map<string, NodeLike>()
  visitNodes(root, (node) => {
    if (node.type !== 'VariableDeclarator') {
      return
    }
    const name = propertyName(node.id)
    const value = unwrapExpression(node.init)
    if (name && value) {
      bindings.set(name, value)
    }
  })
  return bindings
}

export function resolveObjectExpressions(
  expression: unknown,
  bindings: ReadonlyMap<string, NodeLike>,
  seen = new Set<string>(),
): NodeLike[] {
  const current = unwrapExpression(expression)
  if (!current) {
    return []
  }
  if (current.type === 'ObjectExpression') {
    return [current]
  }
  if (current.type === 'Identifier' && typeof current.name === 'string') {
    if (seen.has(current.name)) {
      return []
    }
    const bound = bindings.get(current.name)
    if (!bound) {
      return []
    }
    const nextSeen = new Set(seen)
    nextSeen.add(current.name)
    return resolveObjectExpressions(bound, bindings, nextSeen)
  }
  if (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') {
    const unwrappedBody = unwrapExpression(current.body)
    const bodies =
      unwrappedBody?.type === 'BlockStatement'
        ? returnedExpressions(unwrappedBody)
        : unwrappedBody
          ? [unwrappedBody]
          : []
    return bodies.flatMap((body) => resolveObjectExpressions(body, bindings, new Set(seen)))
  }
  if (current.type === 'ConditionalExpression') {
    return [current.consequent, current.alternate].flatMap((branch) =>
      resolveObjectExpressions(branch, bindings, new Set(seen)),
    )
  }
  if (current.type === 'CallExpression') {
    const calleeName = propertyName(current.callee)
    const args = Array.isArray(current.arguments) ? current.arguments : []
    if (calleeName === 'createMemo' && args[0]) {
      return resolveObjectExpressions(args[0], bindings, seen)
    }
    if (
      calleeName === 'mergeProps' ||
      calleeName === 'mergePopperElementProps' ||
      calleeName === 'mergeMenuTriggerProps' ||
      calleeName === 'assign'
    ) {
      return args.flatMap((argument) => resolveObjectExpressions(argument, bindings, new Set(seen)))
    }
    if (calleeName) {
      const bound = bindings.get(calleeName)
      if (bound) {
        return resolveObjectExpressions(bound, bindings, seen)
      }
    }
  }
  return []
}

function staticPropertyValue(object: NodeLike, key: string): string | null {
  const properties = Array.isArray(object.properties) ? object.properties : []
  let value: string | null = null
  for (const property of properties) {
    if (!isNode(property) || property.type !== 'Property' || propertyName(property.key) !== key) {
      continue
    }
    const analysis = analyzeStaticValues(objectPropertyExpression(property))
    const values = uniqueStaticStrings(analysis.values).filter(Boolean)
    if (!analysis.dynamic && values.length === 1) {
      value = values[0]!
    }
  }
  return value
}

function knownRepositorySlot(
  expression: unknown,
  bindings: ReadonlyMap<string, NodeLike>,
  seen = new Set<string>(),
): string | null {
  const current = unwrapExpression(expression)
  if (!current) {
    return null
  }
  if (current.type === 'Identifier' && typeof current.name === 'string') {
    if (seen.has(current.name)) {
      return null
    }
    const bound = bindings.get(current.name)
    if (!bound) {
      return null
    }
    const nextSeen = new Set(seen)
    nextSeen.add(current.name)
    return knownRepositorySlot(bound, bindings, nextSeen)
  }
  if (current.type === 'MemberExpression' && propertyName(current.property) === 'triggerProps') {
    return 'trigger'
  }
  if (current.type === 'CallExpression') {
    const args = Array.isArray(current.arguments) ? current.arguments : []
    for (let index = args.length - 1; index >= 0; index -= 1) {
      const slot = knownRepositorySlot(args[index], bindings, new Set(seen))
      if (slot) {
        return slot
      }
    }
  }
  return null
}

export function staticSlotName(
  opening: NodeLike,
  bindings: ReadonlyMap<string, NodeLike>,
): string | null {
  const attributes = Array.isArray(opening.attributes) ? opening.attributes : []
  let slot: string | null = null
  for (const attribute of attributes) {
    if (!isNode(attribute)) {
      continue
    }
    if (attribute.type === 'JSXAttribute') {
      const name = getJsxAttributeName(attribute)
      if (name !== 'data-slot' && name !== 'slotName' && name !== 'rootSlot') {
        continue
      }
      const analysis = analyzeStaticValues(attributeExpression(attribute))
      const values = uniqueStaticStrings(analysis.values).filter(Boolean)
      const expression = unwrapExpression(attributeExpression(attribute))
      const hasStaticDefault =
        expression?.type === 'LogicalExpression' &&
        (expression.operator === '||' || expression.operator === '??')
      if ((!analysis.dynamic || hasStaticDefault) && values.length > 0) {
        slot = values[0]!
      }
      continue
    }
    if (attribute.type !== 'JSXSpreadAttribute') {
      continue
    }
    for (const object of resolveObjectExpressions(attribute.argument, bindings)) {
      slot = staticPropertyValue(object, 'data-slot') ?? slot
    }
    slot = knownRepositorySlot(attribute.argument, bindings) ?? slot
  }
  return slot
}

function resolveValueExpressions(
  expression: unknown,
  bindings: ReadonlyMap<string, NodeLike>,
  seen = new Set<string>(),
): NodeLike[] {
  const current = unwrapExpression(expression)
  if (!current) {
    return []
  }
  if (current.type === 'Identifier' && typeof current.name === 'string') {
    if (seen.has(current.name)) {
      return []
    }
    const bound = bindings.get(current.name)
    if (!bound) {
      return [current]
    }
    const nextSeen = new Set(seen)
    nextSeen.add(current.name)
    return resolveValueExpressions(bound, bindings, nextSeen)
  }
  if (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') {
    const body = unwrapExpression(current.body)
    const values = body?.type === 'BlockStatement' ? returnedExpressions(body) : body ? [body] : []
    return values.flatMap((value) => resolveValueExpressions(value, bindings, new Set(seen)))
  }
  if (current.type === 'CallExpression') {
    const calleeName = propertyName(current.callee)
    const args = Array.isArray(current.arguments) ? current.arguments : []
    if (calleeName === 'createMemo' && args[0]) {
      return resolveValueExpressions(args[0], bindings, seen)
    }
    if (calleeName) {
      const bound = bindings.get(calleeName)
      if (bound) {
        return resolveValueExpressions(bound, bindings, seen)
      }
    }
  }
  return [current]
}

function defaultElementCandidates(
  expression: unknown,
  bindings: ReadonlyMap<string, NodeLike>,
): string[] {
  const candidates: string[] = []
  for (const value of resolveValueExpressions(expression, bindings)) {
    candidates.push(...uniqueStaticStrings(analyzeStaticValues(value).values).filter(Boolean))
  }
  return candidates
}

export function renderedElement(
  opening: NodeLike,
  bindings: ReadonlyMap<string, NodeLike>,
  defaultElement?: string,
): string | undefined {
  const name = jsxName(opening.name)
  if (!name) {
    return defaultElement
  }
  if (/^[a-z]/.test(name)) {
    return name
  }
  if (name !== 'Dynamic') {
    return undefined
  }

  const candidates: string[] = []
  const attributes = Array.isArray(opening.attributes) ? opening.attributes : []
  for (const attribute of attributes) {
    if (!isNode(attribute)) {
      continue
    }
    if (attribute.type === 'JSXAttribute' && getJsxAttributeName(attribute) === 'component') {
      candidates.push(...defaultElementCandidates(attributeExpression(attribute), bindings))
      continue
    }
    if (attribute.type !== 'JSXSpreadAttribute') {
      continue
    }
    for (const object of resolveObjectExpressions(attribute.argument, bindings)) {
      const properties = Array.isArray(object.properties) ? object.properties : []
      for (const property of properties) {
        if (
          isNode(property) &&
          property.type === 'Property' &&
          propertyName(property.key) === 'component'
        ) {
          candidates.push(...defaultElementCandidates(objectPropertyExpression(property), bindings))
        }
      }
    }
  }
  const unique = [...new Set(candidates)]
  if (unique.length === 1) {
    return unique[0]
  }
  return unique.length > 1 ? undefined : defaultElement
}

export function addAttribute(
  map: Map<string, RuntimeAttributeApi>,
  attribute: RuntimeAttributeApi,
): void {
  const existing = map.get(attribute.name)
  if (!existing) {
    map.set(attribute.name, attribute)
    return
  }
  map.set(attribute.name, {
    ...existing,
    value: mergeRuntimeValues(existing.value, attribute.value),
  })
}

interface MergeTargetOptions {
  name: string
  publicSlot?: string
  publicSelector?: string
  preferIncomingPhysical?: boolean
  diagnostics: string[]
  diagnosticContext: string
}

/** Merge public call-site identity with physical DOM metadata using explicit precedence. */
export function mergeTarget(
  existing: RuntimeTargetState | undefined,
  incoming: RuntimeTargetState,
  options: MergeTargetOptions,
): RuntimeTargetState {
  if (!existing) {
    return {
      ...incoming,
      name: options.name,
      ...(options.publicSlot ? { slot: options.publicSlot } : {}),
      ...(options.publicSelector ? { selector: options.publicSelector } : {}),
      attributeMap: new Map(incoming.attributeMap),
    }
  }

  const selector = options.publicSelector ?? existing.selector ?? incoming.selector
  const slot = options.publicSlot ?? existing.slot ?? incoming.slot
  const hasConditionalAlternative = Boolean(existing.condition || incoming.condition)
  const hasDifferentKnownElements =
    existing.element && incoming.element && existing.element !== incoming.element
  const element =
    hasConditionalAlternative && hasDifferentKnownElements
      ? undefined
      : options.preferIncomingPhysical
        ? (incoming.element ?? existing.element)
        : (existing.element ?? incoming.element)
  const physicalIdentity = options.preferIncomingPhysical
    ? (incoming.physicalIdentity ?? existing.physicalIdentity)
    : (existing.physicalIdentity ?? incoming.physicalIdentity)

  const distinctPhysicalNodes =
    existing.physicalIdentity &&
    incoming.physicalIdentity &&
    existing.physicalIdentity !== incoming.physicalIdentity
  const incompatibleSelectors =
    existing.selector && incoming.selector && existing.selector !== incoming.selector
  const incompatibleSlots = existing.slot && incoming.slot && existing.slot !== incoming.slot
  const incompatibleElements =
    existing.element && incoming.element && existing.element !== incoming.element
  if (
    distinctPhysicalNodes &&
    !options.preferIncomingPhysical &&
    ((!hasConditionalAlternative && incompatibleElements) ||
      (!options.publicSelector && (incompatibleSelectors || incompatibleSlots)))
  ) {
    options.diagnostics.push(
      `${options.diagnosticContext}: target ${options.name} resolved to incompatible physical nodes`,
    )
  }

  const merged: RuntimeTargetState = {
    name: options.name,
    ...(slot ? { slot } : {}),
    ...(selector ? { selector } : {}),
    ...(element ? { element } : {}),
    ...((existing.description ?? incoming.description)
      ? { description: existing.description ?? incoming.description }
      : {}),
    ...(existing.condition || incoming.condition ? { condition: 'Conditional' } : {}),
    attributes: [],
    attributeMap: new Map(existing.attributeMap),
    ...(physicalIdentity ? { physicalIdentity } : {}),
    ...(existing.selectorAlias || incoming.selectorAlias ? { selectorAlias: true } : {}),
  }
  for (const attribute of incoming.attributeMap.values()) {
    addAttribute(merged.attributeMap, attribute)
  }
  return merged
}
