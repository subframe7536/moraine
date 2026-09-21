import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { ARIA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions'

import { getIdentifierName, parseTypeScript } from './ast'
import type {
  CssVariableApi,
  RuntimeAttributeApi,
  RuntimeAttributeValueApi,
  RuntimeTargetApi,
} from './types'

export interface RuntimeExtraction {
  targets: RuntimeTargetApi[]
  cssVariables: CssVariableApi[]
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

interface NodeLike {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

interface ImportBinding {
  importedName: string
  source: string
}

const CONTROL_FLOW_COMPONENTS = new Set([
  'ErrorBoundary',
  'For',
  'Index',
  'Match',
  'Portal',
  'Show',
  'Suspense',
  'Switch',
])

const BOOLEAN_ARIA_ATTRIBUTES = new Set([
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

function isNode(value: unknown): value is NodeLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string' &&
    typeof (value as { start?: unknown }).start === 'number' &&
    typeof (value as { end?: unknown }).end === 'number'
  )
}

function visitNodes(
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

function unwrapExpression(expression: unknown): NodeLike | null {
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

function propertyName(node: unknown): string | null {
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

function jsxName(node: unknown): string | null {
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

function getJsxAttributeName(attribute: NodeLike): string | null {
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

function collectStaticValues(expression: unknown): Array<string | boolean> {
  const current = unwrapExpression(expression)
  if (!current) {
    return []
  }
  if (current.type === 'Literal') {
    if (typeof current.value === 'string' || typeof current.value === 'boolean') {
      return [current.value]
    }
    return []
  }
  if (current.type === 'Identifier' && current.name === 'undefined') {
    return []
  }
  if (current.type === 'TemplateLiteral') {
    const expressions = Array.isArray(current.expressions) ? current.expressions : []
    const quasis = Array.isArray(current.quasis) ? current.quasis : []
    if (expressions.length === 0 && quasis.length === 1) {
      const quasi = quasis[0]
      if (isNode(quasi) && typeof quasi.value === 'object' && quasi.value !== null) {
        const cooked = (quasi.value as { cooked?: unknown }).cooked
        return typeof cooked === 'string' ? [cooked] : []
      }
    }
    return []
  }
  if (current.type === 'ConditionalExpression') {
    return [...collectStaticValues(current.consequent), ...collectStaticValues(current.alternate)]
  }
  if (
    current.type === 'LogicalExpression' &&
    (current.operator === '||' || current.operator === '??')
  ) {
    return [...collectStaticValues(current.left), ...collectStaticValues(current.right)]
  }
  return []
}

function attributeExpression(attribute: NodeLike): unknown {
  const value = attribute.value
  if (!value) {
    return { type: 'Literal', start: attribute.start, end: attribute.end, value: '' }
  }
  if (isNode(value) && value.type === 'JSXExpressionContainer') {
    return value.expression
  }
  return value
}

function uniqueStrings(values: Array<string | boolean>): string[] {
  return [...new Set(values.map(String))]
}

function classifyValue(name: string, expression: unknown): RuntimeAttributeValueApi {
  const values = uniqueStrings(collectStaticValues(expression))
  const hasEmpty = values.includes('')
  const meaningful = values.filter((value) => value !== '')

  if (name.startsWith('data-') && hasEmpty && meaningful.length === 0) {
    return { kind: 'presence' }
  }
  if (BOOLEAN_ARIA_ATTRIBUTES.has(name)) {
    if (meaningful.every((value) => value === 'true' || value === 'false')) {
      return { kind: 'boolean' }
    }
  }
  if (meaningful.length === 1) {
    return { kind: 'literal', value: meaningful[0]! }
  }
  if (meaningful.length > 1) {
    return { kind: 'enum', values: [...meaningful].sort() }
  }
  return { kind: 'dynamic' }
}

function descriptionFor(name: string): string {
  if (name === 'role') {
    return ARIA_ATTRIBUTE_DESCRIPTIONS.role ?? 'Defines the semantic role of this target.'
  }
  if (name.startsWith('aria-')) {
    return ARIA_ATTRIBUTE_DESCRIPTIONS[name] ?? 'Provides accessibility semantics for this target.'
  }
  return (
    DATA_ATTRIBUTE_DESCRIPTIONS[name] ?? `Present when ${name.slice(5)} applies to this target.`
  )
}

function createAttribute(name: string, expression: unknown): RuntimeAttributeApi | null {
  if (name === 'data-slot' || name.startsWith('data-moraine-') || name.startsWith('data-test-')) {
    return null
  }
  const kind = name === 'role' ? 'role' : name.startsWith('aria-') ? 'aria' : 'data'
  if (kind === 'data' && !name.startsWith('data-')) {
    return null
  }
  return {
    name,
    kind,
    value: classifyValue(name, expression),
    description: descriptionFor(name),
  }
}

function findImplementation(program: ESTree.Program, name: string): NodeLike | null {
  let found: NodeLike | null = null
  visitNodes(program, (node) => {
    if (found) {
      return
    }
    if (node.type === 'FunctionDeclaration' && propertyName(node.id) === name) {
      found = node
      return
    }
    if (node.type === 'VariableDeclarator' && propertyName(node.id) === name) {
      found = unwrapExpression(node.init)
    }
  })
  return found
}

function findAttachedImplementation(
  program: ESTree.Program,
  rootName: string,
  memberName: string,
): string | null {
  let implementationName: string | null = null
  visitNodes(program, (node) => {
    if (implementationName || node.type !== 'AssignmentExpression' || node.operator !== '=') {
      return
    }
    const left = isNode(node.left) ? node.left : null
    if (!left || left.type !== 'MemberExpression') {
      return
    }
    if (propertyName(left.object) !== rootName || propertyName(left.property) !== memberName) {
      return
    }
    implementationName = propertyName(node.right)
  })
  return implementationName
}

function collectBindings(root: unknown): Map<string, NodeLike> {
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

function returnedExpression(body: unknown): NodeLike | null {
  let result: NodeLike | null = null
  visitNodes(body, (node, ancestors) => {
    if (result || node.type !== 'ReturnStatement') {
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
      result = unwrapExpression(node.argument)
    }
  })
  return result
}

function findHostOpening(implementation: NodeLike): NodeLike | null {
  const expression =
    implementation.type === 'ArrowFunctionExpression' && implementation.body
      ? unwrapExpression(implementation.body)
      : returnedExpression(implementation.body)
  if (!expression) {
    return null
  }

  let host: NodeLike | null = null
  visitNodes(expression, (node) => {
    if (host || node.type !== 'JSXOpeningElement') {
      return
    }
    const name = jsxName(node.name)
    if (!name || CONTROL_FLOW_COMPONENTS.has(name)) {
      return
    }
    if (name === 'Dynamic' || /^[a-z]/.test(name) || staticSlotName(node)) {
      host = node
    }
  })
  return host
}

function collectImports(program: ESTree.Program): Map<string, ImportBinding> {
  const imports = new Map<string, ImportBinding>()
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') {
      continue
    }
    for (const specifier of statement.specifiers) {
      if (specifier.local.type !== 'Identifier') {
        continue
      }
      let importedName = specifier.local.name
      if (specifier.type === 'ImportSpecifier') {
        importedName = getIdentifierName(specifier.imported) ?? importedName
      } else if (specifier.type === 'ImportDefaultSpecifier') {
        importedName = 'default'
      }
      imports.set(specifier.local.name, { importedName, source: statement.source.value })
    }
  }
  return imports
}

function resolveFile(baseDirectory: string, source: string): string | null {
  const absolute = path.resolve(baseDirectory, source)
  for (const candidate of [
    absolute,
    `${absolute}.tsx`,
    `${absolute}.ts`,
    path.join(absolute, 'index.tsx'),
    path.join(absolute, 'index.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate
    }
  }
  return null
}

function isConditional(ancestors: readonly NodeLike[]): boolean {
  return ancestors.some((ancestor) => {
    if (ancestor.type === 'ConditionalExpression') {
      return true
    }
    if (ancestor.type !== 'JSXElement') {
      return false
    }
    const opening = isNode(ancestor.openingElement) ? ancestor.openingElement : null
    return opening ? jsxName(opening.name) === 'Show' : false
  })
}

function objectPropertyExpression(property: NodeLike): unknown {
  if (property.kind === 'get' && isNode(property.value)) {
    return returnedExpression(property.value.body)
  }
  return property.value
}

function resolveObjectExpressions(
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
    seen.add(current.name)
    return resolveObjectExpressions(bound, bindings, seen)
  }
  if (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression') {
    const unwrappedBody = unwrapExpression(current.body)
    const body =
      unwrappedBody?.type === 'BlockStatement' ? returnedExpression(unwrappedBody) : unwrappedBody
    return resolveObjectExpressions(body, bindings, seen)
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

function knownSpreadAttributes(
  expression: unknown,
  bindings: ReadonlyMap<string, NodeLike>,
  seen = new Set<string>(),
): RuntimeAttributeApi[] {
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
      return []
    }
    seen.add(current.name)
    return knownSpreadAttributes(bound, bindings, seen)
  }
  const textName = (() => {
    if (current.type === 'CallExpression' && isNode(current.callee)) {
      if (current.callee.type === 'MemberExpression') {
        return propertyName(current.callee.property)
      }
      return null
    }
    if (current.type === 'MemberExpression') {
      return propertyName(current.property)
    }
    return null
  })()

  const names =
    textName === 'ariaAttrs'
      ? [
          'aria-describedby',
          'aria-disabled',
          'aria-invalid',
          'aria-labelledby',
          'aria-readonly',
          'aria-required',
        ]
      : textName === 'dataAttrs'
        ? ['data-closed', 'data-disabled', 'data-expanded']
        : textName === 'triggerProps'
          ? [
              'aria-controls',
              'aria-disabled',
              'aria-expanded',
              'aria-haspopup',
              'data-closed',
              'data-disabled',
              'data-expanded',
            ]
          : []
  const attributes: RuntimeAttributeApi[] = names.map((name) => ({
    name,
    kind: name.startsWith('aria-') ? 'aria' : 'data',
    value: name.startsWith('data-')
      ? { kind: 'presence' as const }
      : BOOLEAN_ARIA_ATTRIBUTES.has(name)
        ? { kind: 'boolean' as const }
        : { kind: 'dynamic' as const },
    description: descriptionFor(name),
  }))
  if (current.type === 'CallExpression') {
    const args = Array.isArray(current.arguments) ? current.arguments : []
    for (const argument of args) {
      for (const attribute of knownSpreadAttributes(argument, bindings, new Set(seen))) {
        if (!attributes.some((candidate) => candidate.name === attribute.name)) {
          attributes.push(attribute)
        }
      }
    }
  }
  return attributes
}

function mergeValue(
  left: RuntimeAttributeValueApi,
  right: RuntimeAttributeValueApi,
): RuntimeAttributeValueApi {
  if (left.kind === right.kind) {
    if (left.kind === 'literal' && right.kind === 'literal') {
      if (left.value === right.value) {
        return left
      }
      return { kind: 'enum', values: [left.value, right.value].sort() }
    }
    if (left.kind === 'enum' && right.kind === 'enum') {
      return { kind: 'enum', values: [...new Set([...left.values, ...right.values])].sort() }
    }
    return left
  }
  const values = [left, right].flatMap((value) =>
    value.kind === 'literal' ? [value.value] : value.kind === 'enum' ? value.values : [],
  )
  return values.length > 0
    ? { kind: 'enum', values: [...new Set(values)].sort() }
    : { kind: 'dynamic' }
}

function addAttribute(map: Map<string, RuntimeAttributeApi>, attribute: RuntimeAttributeApi): void {
  const existing = map.get(attribute.name)
  if (!existing) {
    map.set(attribute.name, attribute)
    return
  }
  map.set(attribute.name, { ...existing, value: mergeValue(existing.value, attribute.value) })
}

function staticSlotName(opening: NodeLike): string | null {
  const attributes = Array.isArray(opening.attributes) ? opening.attributes : []
  for (const attribute of attributes) {
    if (!isNode(attribute) || attribute.type !== 'JSXAttribute') {
      continue
    }
    const name = getJsxAttributeName(attribute)
    if (name !== 'data-slot' && name !== 'slotName' && name !== 'rootSlot') {
      continue
    }
    const values = uniqueStrings(collectStaticValues(attributeExpression(attribute))).filter(
      Boolean,
    )
    if (values.length > 0) {
      return values[0]!
    }
  }
  return null
}

function renderedElement(opening: NodeLike, defaultElement?: string): string | undefined {
  const name = jsxName(opening.name)
  if (!name) {
    return defaultElement
  }
  if (/^[a-z]/.test(name)) {
    return name
  }
  if (name !== 'Dynamic') {
    return defaultElement
  }
  const attributes = Array.isArray(opening.attributes) ? opening.attributes : []
  const component = attributes.find(
    (attribute) =>
      isNode(attribute) &&
      attribute.type === 'JSXAttribute' &&
      getJsxAttributeName(attribute) === 'component',
  )
  if (isNode(component)) {
    const values = uniqueStrings(collectStaticValues(attributeExpression(component))).filter(
      Boolean,
    )
    if (values.length === 1) {
      return values[0]
    }
  }
  return defaultElement
}

function isVariantRecipeNode(ancestors: readonly NodeLike[]): boolean {
  return ancestors.some(
    (ancestor) =>
      ancestor.type === 'Property' &&
      (propertyName(ancestor.key) === 'variants' ||
        propertyName(ancestor.key) === 'compoundVariants'),
  )
}

function nearestRecipeTarget(
  ancestors: readonly NodeLike[],
  publicSlotNames: ReadonlySet<string>,
  rootTarget: string,
): string {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index]!
    if (ancestor.type !== 'Property') {
      continue
    }
    const name = propertyName(ancestor.key)
    if (name && publicSlotNames.has(name)) {
      return name
    }
  }
  return rootTarget
}

export class RuntimeExtractor {
  readonly projectRoot: string
  readonly diagnostics: string[] = []

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async extractRuntimeMetadata(options: RuntimeExtractionOptions): Promise<RuntimeExtraction> {
    const absolutePath = path.isAbsolute(options.sourcePath)
      ? options.sourcePath
      : path.resolve(this.projectRoot, options.sourcePath)
    return this.extractFromImplementation(absolutePath, options, new Set())
  }

  private static async extractRecipeCssVariables(
    absolutePath: string,
    implementation: NodeLike,
    imports: ReadonlyMap<string, ImportBinding>,
    options: RuntimeExtractionOptions,
  ): Promise<CssVariableApi[]> {
    const variables = new Map<string, CssVariableApi>()
    const recipeBindings = new Set<string>()
    let rootTarget = options.targetFallback

    visitNodes(implementation, (node) => {
      if (node.type !== 'CallExpression' || propertyName(node.callee) !== 'createStyles') {
        return
      }
      const args = Array.isArray(node.arguments) ? node.arguments : []
      const recipeName = propertyName(unwrapExpression(args[0]))
      if (recipeName && imports.has(recipeName)) {
        recipeBindings.add(recipeName)
      }
      for (const object of resolveObjectExpressions(args[2], collectBindings(implementation))) {
        const properties = Array.isArray(object.properties) ? object.properties : []
        const rootSlotProperty = properties.find(
          (property) =>
            isNode(property) &&
            property.type === 'Property' &&
            propertyName(property.key) === 'rootSlot',
        )
        if (isNode(rootSlotProperty)) {
          const value = uniqueStrings(
            collectStaticValues(objectPropertyExpression(rootSlotProperty)),
          ).find(Boolean)
          if (value) {
            rootTarget = value
          }
        }
      }
    })

    for (const recipeName of recipeBindings) {
      const binding = imports.get(recipeName)
      const recipePath = binding ? resolveFile(path.dirname(absolutePath), binding.source) : null
      if (!recipePath) {
        continue
      }
      const source = readFileSync(recipePath, 'utf8')
      const parsed = await parseTypeScript(
        recipePath,
        source,
        recipePath.endsWith('.tsx') ? 'tsx' : 'ts',
      )
      const recipe = findImplementation(parsed.program, binding!.importedName)
      if (!recipe) {
        continue
      }

      visitNodes(recipe, (node, ancestors) => {
        const conditional = isVariantRecipeNode(ancestors)
        if (node.type === 'Property') {
          const name = propertyName(node.key)
          if (name?.startsWith('--')) {
            variables.set(`${rootTarget}:${name}`, {
              name,
              target: rootTarget,
              description: `Custom property declared by the component recipe on the ${rootTarget} target.`,
              ...(conditional ? { condition: 'Variant-dependent' } : {}),
            })
          }
        }
        if (node.type !== 'Literal' || typeof node.value !== 'string') {
          return
        }
        const target = nearestRecipeTarget(ancestors, options.publicSlotNames, rootTarget)
        for (const match of node.value.matchAll(/\[(--[a-zA-Z0-9-]+):/g)) {
          const name = match[1]!
          variables.set(`${target}:${name}`, {
            name,
            target,
            description: `Custom property declared by the component recipe on the ${target} target.`,
            ...(conditional ? { condition: 'Variant-dependent' } : {}),
          })
        }
      })
    }

    return [...variables.values()]
  }

  private async resolveImportedImplementation(
    importerPath: string,
    binding: ImportBinding,
  ): Promise<{ sourcePath: string; implementationName: string } | null> {
    let sourcePath = resolveFile(path.dirname(importerPath), binding.source)
    if (!sourcePath) {
      return null
    }
    let implementationName = binding.importedName

    for (let depth = 0; depth < 4; depth += 1) {
      const source = readFileSync(sourcePath, 'utf8')
      const parsed = await parseTypeScript(
        sourcePath,
        source,
        sourcePath.endsWith('.tsx') ? 'tsx' : 'ts',
      )
      const [rootName, memberName] = implementationName.split('.')
      if (rootName && memberName) {
        const attachedName = findAttachedImplementation(parsed.program, rootName, memberName)
        if (attachedName) {
          if (findImplementation(parsed.program, attachedName)) {
            return { sourcePath, implementationName: attachedName }
          }
          const imported = collectImports(parsed.program).get(attachedName)
          if (imported) {
            return this.resolveImportedImplementation(sourcePath, imported)
          }
        }
      } else if (findImplementation(parsed.program, implementationName)) {
        return { sourcePath, implementationName }
      }

      let next: { source: string; name: string } | null = null
      for (const statement of parsed.program.body) {
        if (
          statement.type !== 'ExportNamedDeclaration' ||
          typeof statement.source?.value !== 'string'
        ) {
          continue
        }
        for (const specifier of statement.specifiers) {
          if (getIdentifierName(specifier.exported) === rootName) {
            next = {
              source: statement.source.value,
              name: `${getIdentifierName(specifier.local) ?? rootName}${memberName ? `.${memberName}` : ''}`,
            }
          }
        }
      }
      if (!next) {
        const exportAll = parsed.program.body.find(
          (statement) =>
            statement.type === 'ExportAllDeclaration' && typeof statement.source.value === 'string',
        )
        if (
          exportAll?.type === 'ExportAllDeclaration' &&
          typeof exportAll.source.value === 'string'
        ) {
          next = { source: exportAll.source.value, name: implementationName }
        }
      }
      if (!next) {
        return null
      }
      const resolved = resolveFile(path.dirname(sourcePath), next.source)
      if (!resolved) {
        return null
      }
      sourcePath = resolved
      implementationName = next.name
    }
    return null
  }

  private async extractFromImplementation(
    absolutePath: string,
    options: RuntimeExtractionOptions,
    visited: Set<string>,
  ): Promise<RuntimeExtraction> {
    const visitKey = `${absolutePath}:${options.implementationName}:${options.targetFallback}:${options.allowHostFallback !== false}`
    if (visited.has(visitKey) || !existsSync(absolutePath)) {
      return { targets: [], cssVariables: [] }
    }
    visited.add(visitKey)

    const content = readFileSync(absolutePath, 'utf8')
    const parsed = await parseTypeScript(
      absolutePath,
      content,
      absolutePath.endsWith('.tsx') ? 'tsx' : 'ts',
    )
    const implementation = findImplementation(parsed.program, options.implementationName)
    if (!implementation) {
      this.diagnostics.push(
        `${path.relative(this.projectRoot, absolutePath)}: implementation ${options.implementationName} was not found`,
      )
      return { targets: [], cssVariables: [] }
    }

    const bindings = new Map([
      ...collectBindings(parsed.program),
      ...collectBindings(implementation),
    ])
    const imports = collectImports(parsed.program)
    const host = findHostOpening(implementation)
    const targets = new Map<
      string,
      RuntimeTargetApi & { attributeMap: Map<string, RuntimeAttributeApi> }
    >()
    const cssVariables = new Map<string, CssVariableApi>()
    const delegated: Array<{
      name: string
      binding: ImportBinding
      hostTargetName?: string
      attributes?: RuntimeAttributeApi[]
    }> = []
    const localDelegates = new Map<string, string | undefined>()

    for (const variable of await RuntimeExtractor.extractRecipeCssVariables(
      absolutePath,
      implementation,
      imports,
      options,
    )) {
      cssVariables.set(`${variable.target}:${variable.name}`, variable)
    }

    const targetFor = (
      name: string,
      publicSlot: string | undefined,
      selectorSlot: string | undefined,
      opening: NodeLike,
      conditional: boolean,
    ) => {
      let target = targets.get(name)
      if (!target) {
        const element = renderedElement(opening, options.defaultElement)
        target = {
          name,
          ...(publicSlot ? { slot: publicSlot } : {}),
          ...(selectorSlot ? { selector: `[data-slot="${selectorSlot}"]` } : {}),
          ...(element ? { element } : {}),
          ...(conditional ? { condition: 'Conditional' } : {}),
          attributes: [],
          attributeMap: new Map(),
        }
        targets.set(name, target)
      }
      return target
    }

    visitNodes(implementation, (node, ancestors) => {
      if (node.type !== 'JSXOpeningElement') {
        return
      }
      const tagName = jsxName(node.name)
      const declaredSlot = staticSlotName(node)
      const slot = declaredSlot
      const publicSlot = slot && options.publicSlotNames.has(slot) ? slot : undefined
      const usesHostFallback = !publicSlot && node === host && options.allowHostFallback !== false
      const targetName = publicSlot ?? (usesHostFallback ? options.targetFallback : null)

      if (tagName && /^[A-Z]/.test(tagName) && tagName !== 'Dynamic') {
        const simpleName = tagName.split('.')[0]!
        const memberName = tagName.split('.')[1]
        const inferredTarget = memberName
          ? `${memberName[0]?.toLowerCase() ?? ''}${memberName.slice(1)}`
          : undefined
        const delegateTarget =
          targetName ??
          (inferredTarget && options.publicSlotNames.has(inferredTarget)
            ? inferredTarget
            : options.delegateRootTargets?.[simpleName])
        const binding = imports.get(simpleName)
        if (binding && !CONTROL_FLOW_COMPONENTS.has(simpleName)) {
          delegated.push({
            name: tagName,
            binding: {
              ...binding,
              importedName: memberName
                ? `${binding.importedName}.${memberName}`
                : binding.importedName,
            },
            ...(delegateTarget ? { hostTargetName: delegateTarget } : {}),
          })
        } else if (
          !CONTROL_FLOW_COMPONENTS.has(simpleName) &&
          simpleName !== options.implementationName &&
          findImplementation(parsed.program, simpleName)
        ) {
          const localTarget = `${simpleName[0]?.toLowerCase() ?? ''}${simpleName.slice(1)}`
          localDelegates.set(
            simpleName,
            options.publicSlotNames.has(localTarget) ? localTarget : delegateTarget,
          )
        }
      }

      if (!targetName) {
        return
      }

      const conditional = isConditional(ancestors)
      const target = targetFor(
        targetName,
        publicSlot ?? (options.publicSlotNames.has(targetName) ? targetName : undefined),
        slot ?? undefined,
        node,
        conditional,
      )
      const attributes = Array.isArray(node.attributes) ? node.attributes : []
      for (const attribute of attributes) {
        if (!isNode(attribute)) {
          continue
        }
        if (attribute.type === 'JSXAttribute') {
          const name = getJsxAttributeName(attribute)
          if (!name) {
            continue
          }
          const runtimeAttribute = createAttribute(name, attributeExpression(attribute))
          if (runtimeAttribute) {
            addAttribute(target.attributeMap, runtimeAttribute)
          }
          if (name === 'style') {
            for (const object of resolveObjectExpressions(
              attributeExpression(attribute),
              bindings,
            )) {
              const properties = Array.isArray(object.properties) ? object.properties : []
              for (const property of properties) {
                if (!isNode(property) || property.type !== 'Property') {
                  continue
                }
                const variableName = propertyName(property.key)
                if (variableName?.startsWith('--')) {
                  cssVariables.set(`${targetName}:${variableName}`, {
                    name: variableName,
                    target: targetName,
                    description: `Custom property declared on the ${targetName} target.`,
                    ...(conditional ? { condition: 'Conditional' } : {}),
                  })
                }
              }
            }
          }
          continue
        }
        if (attribute.type !== 'JSXSpreadAttribute') {
          continue
        }
        for (const object of resolveObjectExpressions(attribute.argument, bindings)) {
          const properties = Array.isArray(object.properties) ? object.properties : []
          for (const property of properties) {
            if (!isNode(property) || property.type !== 'Property') {
              continue
            }
            const name = propertyName(property.key)
            if (!name) {
              continue
            }
            const runtimeAttribute = createAttribute(name, objectPropertyExpression(property))
            if (runtimeAttribute) {
              addAttribute(target.attributeMap, runtimeAttribute)
            }
          }
        }
        for (const runtimeAttribute of knownSpreadAttributes(attribute.argument, bindings)) {
          addAttribute(target.attributeMap, runtimeAttribute)
        }
      }
    })

    const returned =
      implementation.type === 'ArrowFunctionExpression' && implementation.body
        ? unwrapExpression(implementation.body)
        : returnedExpression(implementation.body)
    if (
      returned?.type === 'CallExpression' &&
      propertyName(returned.callee) === 'createComponent'
    ) {
      const args = Array.isArray(returned.arguments) ? returned.arguments : []
      const component = unwrapExpression(args[0])
      const componentName = propertyName(component)
      const binding = componentName ? imports.get(componentName) : undefined
      if (componentName && binding) {
        const attributes = (args[1] ? resolveObjectExpressions(args[1], bindings) : []).flatMap(
          (object) => {
            const properties = Array.isArray(object.properties) ? object.properties : []
            return properties.flatMap((property) => {
              if (!isNode(property) || property.type !== 'Property') {
                return []
              }
              const name = propertyName(property.key)
              const attribute = name
                ? createAttribute(name, objectPropertyExpression(property))
                : null
              return attribute ? [attribute] : []
            })
          },
        )
        delegated.push({
          name: componentName,
          binding,
          hostTargetName: options.targetFallback,
          attributes,
        })
      }
    }

    for (const [implementationName, delegateTarget] of localDelegates) {
      const effectiveDelegateTarget =
        delegateTarget ??
        (targets.size === 0 && localDelegates.size === 1 && delegated.length === 0
          ? options.targetFallback
          : undefined)
      const nested = await this.extractFromImplementation(
        absolutePath,
        {
          ...options,
          implementationName,
          targetFallback: effectiveDelegateTarget ?? options.targetFallback,
          allowHostFallback: effectiveDelegateTarget !== undefined,
        },
        visited,
      )
      for (const nestedTarget of nested.targets) {
        if (!effectiveDelegateTarget && nestedTarget.name === 'root') {
          continue
        }
        const targetName =
          effectiveDelegateTarget && nestedTarget.name === 'root'
            ? effectiveDelegateTarget
            : nestedTarget.name
        const target = targets.get(targetName) ?? {
          ...nestedTarget,
          name: targetName,
          ...(targetName === effectiveDelegateTarget
            ? {
                slot: options.publicSlotNames.has(targetName) ? targetName : undefined,
                selector: `[data-slot="${targetName}"]`,
              }
            : {}),
          attributeMap: new Map<string, RuntimeAttributeApi>(),
        }
        for (const attribute of nestedTarget.attributes) {
          addAttribute(target.attributeMap, attribute)
        }
        targets.set(targetName, target)
      }
      for (const variable of nested.cssVariables) {
        cssVariables.set(`${variable.target}:${variable.name}`, variable)
      }
    }

    for (const delegate of delegated) {
      const resolved = await this.resolveImportedImplementation(absolutePath, delegate.binding)
      if (!resolved) {
        continue
      }
      const effectiveHostTargetName =
        delegate.hostTargetName ??
        (targets.size === 0 && delegated.length === 1 && localDelegates.size === 0
          ? options.targetFallback
          : undefined)
      const nested = await this.extractFromImplementation(
        resolved.sourcePath,
        {
          ...options,
          sourcePath: resolved.sourcePath,
          implementationName: resolved.implementationName,
          targetFallback: effectiveHostTargetName ?? options.targetFallback,
          allowHostFallback: effectiveHostTargetName !== undefined,
        },
        visited,
      )
      for (const nestedTarget of nested.targets) {
        if (!effectiveHostTargetName && nestedTarget.name === 'root') {
          continue
        }
        const targetName =
          effectiveHostTargetName && nestedTarget.name === 'root'
            ? effectiveHostTargetName
            : nestedTarget.name
        const target = targets.get(targetName) ?? {
          ...nestedTarget,
          name: targetName,
          ...(targetName === effectiveHostTargetName
            ? {
                slot: options.publicSlotNames.has(targetName) ? targetName : undefined,
                selector: `[data-slot="${targetName}"]`,
              }
            : {}),
          attributeMap: new Map<string, RuntimeAttributeApi>(),
        }
        for (const attribute of nestedTarget.attributes) {
          addAttribute(target.attributeMap, attribute)
        }
        for (const attribute of delegate.attributes ?? []) {
          addAttribute(target.attributeMap, attribute)
        }
        targets.set(targetName, target)
      }
      for (const variable of nested.cssVariables) {
        cssVariables.set(`${variable.target}:${variable.name}`, variable)
      }
    }

    const normalizedTargets = [...targets.values()].map(({ attributeMap, ...target }) =>
      Object.assign(target, {
        attributes: [...attributeMap.values()].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      }),
    )

    return {
      targets: normalizedTargets,
      cssVariables: [...cssVariables.values()].sort((left, right) => {
        const targetOrder = left.target.localeCompare(right.target)
        return targetOrder === 0 ? left.name.localeCompare(right.name) : targetOrder
      }),
    }
  }
}
