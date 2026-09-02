import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { ARIA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions'

import { getIdentifierName, nodeText, parseTypeScript, walkAst } from './ast'
import type { ApiAttributeDoc, SlotDefinitionDoc, SlotDoc } from './types'

interface SlotMetadata {
  cssVariables: Set<string>
  dataAttributes: Set<string>
  ariaAttributes: Set<string>
}

interface RawSlotAnalysis {
  slots: Map<string, SlotMetadata>
  primarySlot?: string
}

interface ImportBinding {
  importedName: string
  specifier: string
}

interface ModuleInfo {
  filePath: string
  source: Awaited<ReturnType<typeof parseTypeScript>>
  declarations: Map<string, ESTree.Node>
  variables: Map<string, ESTree.VariableDeclarator>
  imports: Map<string, ImportBinding>
  localAliases: Map<string, string>
  members: Map<string, string>
  reexports: Map<string, { importedName: string; specifier: string }>
  exportStars: string[]
}

interface SymbolReference {
  filePath: string
  name: string
}

function getJsxAttributeName(name: ESTree.JSXAttributeName): string | null {
  if (name.type === 'JSXIdentifier') {
    return name.name
  }
  if (name.type === 'JSXNamespacedName') {
    return `${name.namespace.name}:${name.name.name}`
  }
  return null
}

function getJsxAttributes(node: ESTree.JSXOpeningElement): ESTree.JSXAttribute[] {
  return node.attributes.filter(
    (attribute): attribute is ESTree.JSXAttribute => attribute.type === 'JSXAttribute',
  )
}

function unwrapExpression(expression: ESTree.Expression | null): ESTree.Expression | null {
  let current = expression
  while (
    current &&
    (current.type === 'TSAsExpression' ||
      current.type === 'TSTypeAssertion' ||
      current.type === 'TSNonNullExpression')
  ) {
    current = current.expression
  }
  return current
}

function getStaticStringValues(attribute: ESTree.JSXAttribute): string[] {
  if (!attribute.value) {
    return []
  }
  if (attribute.value.type === 'Literal' && typeof attribute.value.value === 'string') {
    return [attribute.value.value]
  }
  if (attribute.value.type !== 'JSXExpressionContainer') {
    return []
  }

  const collect = (expression: ESTree.Expression | null): string[] => {
    const current = unwrapExpression(expression)
    if (!current) {
      return []
    }
    if (current.type === 'Literal' && typeof current.value === 'string') {
      return [current.value]
    }
    if (current.type === 'ConditionalExpression') {
      return [...collect(current.consequent), ...collect(current.alternate)]
    }
    if (
      current.type === 'LogicalExpression' &&
      (current.operator === '||' || current.operator === '??')
    ) {
      return [...collect(current.left), ...collect(current.right)]
    }
    return []
  }

  return [...new Set(collect(attribute.value.expression as ESTree.Expression | null))]
}

function isSlotAttributeName(name: string): boolean {
  return (
    name === 'data-slot' ||
    name === 'slotName' ||
    name === 'rootSlot' ||
    name.endsWith('Slot') ||
    name.endsWith('SlotName')
  )
}

function getSlotCandidates(node: ESTree.JSXOpeningElement): string[] {
  const values: string[] = []
  for (const attribute of getJsxAttributes(node)) {
    const name = getJsxAttributeName(attribute.name)
    if (name && isSlotAttributeName(name)) {
      values.push(...getStaticStringValues(attribute))
    }
  }
  return [...new Set(values)]
}

function getJsxComponentName(name: ESTree.JSXElementName): string | null {
  if (name.type === 'JSXIdentifier') {
    return /^[A-Z]/.test(name.name) ? name.name : null
  }
  if (name.type === 'JSXMemberExpression') {
    const object = getJsxComponentName(name.object)
    return object ? `${object}.${name.property.name}` : null
  }
  return null
}

function getBindingNames(node: ESTree.Node): string[] {
  if (node.type === 'Identifier') {
    return [node.name]
  }
  if (node.type === 'AssignmentPattern') {
    return getBindingNames(node.left)
  }
  if (node.type === 'RestElement') {
    return getBindingNames(node.argument)
  }
  if (node.type === 'ArrayPattern') {
    return node.elements.flatMap((element) => (element ? getBindingNames(element) : []))
  }
  if (node.type === 'ObjectPattern') {
    return node.properties.flatMap((property) =>
      property.type === 'Property'
        ? getBindingNames(property.value)
        : getBindingNames(property.argument),
    )
  }
  return []
}

function resolveLocalImportPath(importerPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) {
    return null
  }

  const basePath = path.resolve(path.dirname(importerPath), specifier)
  const candidates = /\.(?:tsx?|jsx?)$/.test(basePath)
    ? [basePath]
    : [
        `${basePath}.tsx`,
        `${basePath}.ts`,
        `${basePath}.jsx`,
        `${basePath}.js`,
        path.join(basePath, 'index.tsx'),
        path.join(basePath, 'index.ts'),
        path.join(basePath, 'index.jsx'),
        path.join(basePath, 'index.js'),
      ]

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function resolveReadableSourcePath(projectRoot: string, sourcePath: string): string | null {
  const absoluteSourcePath = path.resolve(projectRoot, sourcePath)
  const implementationBasePath = absoluteSourcePath.replace(/\.d\.(?:cts|mts|ts)$/, '')
  const candidates = [
    absoluteSourcePath,
    `${implementationBasePath}.tsx`,
    `${implementationBasePath}.ts`,
    `${implementationBasePath}.jsx`,
    `${implementationBasePath}.js`,
  ]
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function createSlotMetadata(): SlotMetadata {
  return {
    cssVariables: new Set(),
    dataAttributes: new Set(),
    ariaAttributes: new Set(),
  }
}

function mergeSlotMetadata(target: SlotMetadata, source: SlotMetadata): void {
  for (const value of source.cssVariables) {
    target.cssVariables.add(value)
  }
  for (const value of source.dataAttributes) {
    target.dataAttributes.add(value)
  }
  for (const value of source.ariaAttributes) {
    target.ariaAttributes.add(value)
  }
}

function mergeAnalysis(target: Map<string, SlotMetadata>, source: RawSlotAnalysis): void {
  for (const [slotName, metadata] of source.slots) {
    const current = target.get(slotName) ?? createSlotMetadata()
    mergeSlotMetadata(current, metadata)
    target.set(slotName, current)
  }
}

function createAttributeDoc(name: string): ApiAttributeDoc {
  const isAria = name === 'role' || name.startsWith('aria-')
  const descriptions = isAria ? ARIA_ATTRIBUTE_DESCRIPTIONS : DATA_ATTRIBUTE_DESCRIPTIONS
  const type =
    name === 'role' || name === 'aria-current' || name === 'aria-live'
      ? 'string'
      : name === 'data-slot' || name === 'data-size' || name === 'data-variant'
        ? 'string'
        : name.startsWith('data-')
          ? 'string | undefined'
          : 'boolean | string | undefined'
  return {
    name,
    required: false,
    type,
    description:
      descriptions[name] ??
      (isAria
        ? 'Accessibility attribute forwarded by the rendered component.'
        : 'State or slot attribute exposed for styling hooks and selectors.'),
  }
}

function createCssVariableDoc(name: string): ApiAttributeDoc {
  return {
    name,
    required: false,
    type: 'string',
    description: 'CSS custom property exposed by this slot.',
  }
}

function indexModule(source: ModuleInfo): void {
  const body = source.source.program.body
  const addDeclaration = (statement: ESTree.Statement): void => {
    if (statement.type === 'FunctionDeclaration' && statement.id) {
      source.declarations.set(statement.id.name, statement)
      return
    }
    if (statement.type !== 'VariableDeclaration') {
      return
    }
    for (const declarator of statement.declarations) {
      for (const name of getBindingNames(declarator.id)) {
        source.variables.set(name, declarator)
      }
    }
  }

  for (const statement of body) {
    if (
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'AssignmentExpression' &&
      statement.expression.operator === '=' &&
      statement.expression.left.type === 'MemberExpression' &&
      !statement.expression.left.computed &&
      statement.expression.left.object.type === 'Identifier' &&
      statement.expression.left.property.type === 'Identifier' &&
      statement.expression.right.type === 'Identifier'
    ) {
      source.members.set(
        `${statement.expression.left.object.name}.${statement.expression.left.property.name}`,
        statement.expression.right.name,
      )
      continue
    }
    if (statement.type === 'ExportNamedDeclaration') {
      if (statement.declaration) {
        addDeclaration(statement.declaration)
      }
      if (statement.source?.value && typeof statement.source.value === 'string') {
        for (const specifier of statement.specifiers) {
          const exported = getIdentifierName(specifier.exported)
          const imported = getIdentifierName(specifier.local)
          if (exported && imported) {
            source.reexports.set(exported, {
              importedName: imported,
              specifier: statement.source.value,
            })
          }
        }
      } else {
        for (const specifier of statement.specifiers) {
          const exported = getIdentifierName(specifier.exported)
          const local = getIdentifierName(specifier.local)
          if (exported && local) {
            source.localAliases.set(exported, local)
          }
        }
      }
      continue
    }
    if (statement.type === 'ExportAllDeclaration') {
      if (typeof statement.source.value === 'string') {
        source.exportStars.push(statement.source.value)
      }
      continue
    }
    if (statement.type === 'ImportDeclaration') {
      if (typeof statement.source.value !== 'string') {
        continue
      }
      const importKind = (statement as unknown as { importKind?: string }).importKind
      if (importKind === 'type') {
        continue
      }
      for (const specifier of statement.specifiers) {
        const specifierKind = (specifier as unknown as { importKind?: string }).importKind
        if (specifierKind === 'type') {
          continue
        }
        const localName = getIdentifierName(specifier.local)
        if (!localName) {
          continue
        }
        const importedName =
          specifier.type === 'ImportSpecifier'
            ? (getIdentifierName(specifier.imported) ?? localName)
            : specifier.type === 'ImportDefaultSpecifier'
              ? 'default'
              : '*'
        source.imports.set(localName, { importedName, specifier: statement.source.value })
      }
      continue
    }
    addDeclaration(statement)
  }
}

function isSimpleAlias(declarator: ESTree.VariableDeclarator): string | null {
  let init = declarator.init
  while (
    init &&
    (init.type === 'TSAsExpression' ||
      init.type === 'TSTypeAssertion' ||
      init.type === 'TSNonNullExpression')
  ) {
    init = init.expression
  }
  return init?.type === 'Identifier' ? init.name : null
}

export class SourceSlotAnalyzer {
  readonly #modules = new Map<string, Promise<ModuleInfo>>()
  readonly #analyses = new Map<string, Promise<RawSlotAnalysis>>()

  constructor(readonly projectRoot: string) {}

  async enrichSlots(
    componentName: string,
    sourcePath: string | undefined,
    definitions: readonly SlotDefinitionDoc[],
  ): Promise<SlotDoc[]> {
    if (!sourcePath || definitions.length === 0) {
      return definitions.map((slot) => SourceSlotAnalyzer.#emptySlotDoc(slot))
    }
    const absoluteSourcePath = resolveReadableSourcePath(this.projectRoot, sourcePath)
    if (!absoluteSourcePath) {
      return definitions.map((slot) => SourceSlotAnalyzer.#emptySlotDoc(slot))
    }
    const analysis = await this.#analyze(
      { filePath: absoluteSourcePath, name: componentName },
      new Set(),
    )
    return definitions.map((slot) => {
      const metadata = createSlotMetadata()
      for (const runtimeSlot of slot.runtimeSlots) {
        const runtimeMetadata = analysis.slots.get(runtimeSlot)
        if (runtimeMetadata) {
          mergeSlotMetadata(metadata, runtimeMetadata)
        }
      }
      return SourceSlotAnalyzer.#slotDoc(slot, metadata)
    })
  }

  static #emptySlotDoc(slot: SlotDefinitionDoc): SlotDoc {
    return SourceSlotAnalyzer.#slotDoc(slot, createSlotMetadata())
  }

  static #slotDoc(slot: SlotDefinitionDoc, metadata: SlotMetadata): SlotDoc {
    return {
      name: slot.name,
      ...(slot.description ? { description: slot.description } : {}),
      cssVariables: [...metadata.cssVariables].sort().map(createCssVariableDoc),
      dataAttributes: [...metadata.dataAttributes].sort().map(createAttributeDoc),
      ariaAttributes: [...metadata.ariaAttributes].sort().map(createAttributeDoc),
    }
  }

  async #loadModule(filePath: string): Promise<ModuleInfo> {
    const existing = this.#modules.get(filePath)
    if (existing) {
      return existing
    }
    const promise = (async () => {
      const sourceCode = readFileSync(filePath, 'utf8')
      const source = await parseTypeScript(
        filePath,
        sourceCode,
        /\.(?:tsx|jsx)$/.test(filePath) ? 'tsx' : 'ts',
      )
      const module: ModuleInfo = {
        filePath,
        source,
        declarations: new Map(),
        variables: new Map(),
        imports: new Map(),
        localAliases: new Map(),
        members: new Map(),
        reexports: new Map(),
        exportStars: [],
      }
      indexModule(module)
      return module
    })()
    this.#modules.set(filePath, promise)
    return promise
  }

  async #resolveSymbol(
    module: ModuleInfo,
    name: string,
    visited: Set<string>,
  ): Promise<SymbolReference | null> {
    const visitKey = `${module.filePath}#${name}`
    if (visited.has(visitKey)) {
      return null
    }
    const nextVisited = new Set(visited)
    nextVisited.add(visitKey)

    const memberAlias = module.members.get(name)
    if (memberAlias) {
      return this.#resolveSymbol(module, memberAlias, nextVisited)
    }
    const memberSeparator = name.indexOf('.')
    if (memberSeparator > 0) {
      const objectName = name.slice(0, memberSeparator)
      const memberPath = name.slice(memberSeparator + 1)
      const objectReference = await this.#resolveSymbol(module, objectName, nextVisited)
      if (objectReference) {
        const objectModule = await this.#loadModule(objectReference.filePath)
        return this.#resolveSymbol(
          objectModule,
          `${objectReference.name}.${memberPath}`,
          nextVisited,
        )
      }
    }

    if (module.declarations.has(name)) {
      return { filePath: module.filePath, name }
    }
    const localAlias = module.localAliases.get(name)
    if (localAlias) {
      return this.#resolveSymbol(module, localAlias, nextVisited)
    }
    const variable = module.variables.get(name)
    if (variable) {
      const alias = isSimpleAlias(variable)
      if (alias) {
        return this.#resolveSymbol(module, alias, nextVisited)
      }
      let init = variable.init
      while (
        init &&
        (init.type === 'TSAsExpression' ||
          init.type === 'TSTypeAssertion' ||
          init.type === 'TSNonNullExpression')
      ) {
        init = init.expression
      }
      if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
        return { filePath: module.filePath, name }
      }
      return { filePath: module.filePath, name }
    }
    const binding = module.imports.get(name)
    if (binding) {
      const importedPath = resolveLocalImportPath(module.filePath, binding.specifier)
      if (!importedPath) {
        return null
      }
      const importedModule = await this.#loadModule(importedPath)
      return this.#resolveSymbol(importedModule, binding.importedName, nextVisited)
    }
    const reexport = module.reexports.get(name)
    if (reexport) {
      const importedPath = resolveLocalImportPath(module.filePath, reexport.specifier)
      if (!importedPath) {
        return null
      }
      const importedModule = await this.#loadModule(importedPath)
      return this.#resolveSymbol(importedModule, reexport.importedName, nextVisited)
    }
    const matches: SymbolReference[] = []
    for (const specifier of module.exportStars) {
      const importedPath = resolveLocalImportPath(module.filePath, specifier)
      if (!importedPath) {
        continue
      }
      const importedModule = await this.#loadModule(importedPath)
      const match = await this.#resolveSymbol(importedModule, name, nextVisited)
      if (match) {
        matches.push(match)
      }
    }
    const uniqueMatches = matches.filter(
      (match, index) =>
        matches.findIndex(
          (candidate) => candidate.filePath === match.filePath && candidate.name === match.name,
        ) === index,
    )
    if (uniqueMatches.length > 1) {
      throw new Error(`Ambiguous local export "${name}" from ${module.filePath}`)
    }
    return uniqueMatches[0] ?? null
  }

  async #analyze(reference: SymbolReference, visiting: Set<string>): Promise<RawSlotAnalysis> {
    const key = `${reference.filePath}#${reference.name}`
    if (visiting.has(key)) {
      return { slots: new Map() }
    }
    const cached = this.#analyses.get(key)
    if (cached) {
      return cached
    }
    const nextVisiting = new Set(visiting)
    nextVisiting.add(key)
    const promise = this.#computeAnalysis(reference, nextVisiting)
    this.#analyses.set(key, promise)
    return promise
  }

  async #computeAnalysis(
    reference: SymbolReference,
    visiting: Set<string>,
  ): Promise<RawSlotAnalysis> {
    const module = await this.#loadModule(reference.filePath)
    const resolved = await this.#resolveSymbol(module, reference.name, new Set())
    if (!resolved) {
      throw new Error(
        `Unable to resolve local component "${reference.name}" from ${reference.filePath}`,
      )
    }
    const resolvedModule = await this.#loadModule(resolved.filePath)
    const declaration =
      resolvedModule.declarations.get(resolved.name) ?? resolvedModule.variables.get(resolved.name)
    if (!declaration) {
      throw new Error(
        `Resolved symbol "${resolved.name}" has no implementation in ${resolved.filePath}`,
      )
    }

    const slots = new Map<string, SlotMetadata>()
    const componentReferences: Array<{
      name: string
      overrideSlots: string[]
    }> = []
    const functionReferences: string[] = []

    walkAst(declaration, (node) => {
      if (node.type === 'JSXOpeningElement') {
        const candidates = getSlotCandidates(node)
        const attributes = getJsxAttributes(node)
        if (candidates.length > 0) {
          for (const slotName of candidates) {
            const metadata = slots.get(slotName) ?? createSlotMetadata()
            for (const attribute of attributes) {
              const name = getJsxAttributeName(attribute.name)
              if (!name || isSlotAttributeName(name)) {
                continue
              }
              if (name === 'role' || name.startsWith('aria-')) {
                metadata.ariaAttributes.add(name)
              } else if (name.startsWith('data-')) {
                metadata.dataAttributes.add(name)
              }
            }
            for (const match of nodeText(resolvedModule.source, node).matchAll(
              /--[A-Za-z_][\w-]*/g,
            )) {
              metadata.cssVariables.add(match[0])
            }
            slots.set(slotName, metadata)
          }
        }
        const componentName = getJsxComponentName(node.name)
        if (componentName) {
          componentReferences.push({ name: componentName, overrideSlots: candidates })
        }
        return
      }
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        functionReferences.push(node.callee.name)
      }
    })

    for (const referenceName of new Set(functionReferences)) {
      const resolvedReference = await this.#resolveSymbol(resolvedModule, referenceName, new Set())
      if (!resolvedReference) {
        continue
      }
      const targetModule = await this.#loadModule(resolvedReference.filePath)
      const target =
        targetModule.declarations.get(resolvedReference.name) ??
        targetModule.variables.get(resolvedReference.name)
      if (!target || !SourceSlotAnalyzer.#containsJsx(target)) {
        continue
      }
      mergeAnalysis(slots, await this.#analyze(resolvedReference, visiting))
    }

    for (const componentReference of componentReferences) {
      const resolvedReference = await this.#resolveSymbol(
        resolvedModule,
        componentReference.name,
        new Set(),
      )
      if (!resolvedReference) {
        SourceSlotAnalyzer.#throwIfUnresolvedLocal(resolvedModule, componentReference.name)
        continue
      }
      const child = await this.#analyze(resolvedReference, visiting)
      if (componentReference.overrideSlots.length > 0) {
        if (child.primarySlot) {
          const childMetadata = child.slots.get(child.primarySlot)
          if (childMetadata) {
            for (const overrideSlot of componentReference.overrideSlots) {
              const metadata = slots.get(overrideSlot) ?? createSlotMetadata()
              mergeSlotMetadata(metadata, childMetadata)
              slots.set(overrideSlot, metadata)
            }
          }
        }
      } else {
        mergeAnalysis(slots, child)
      }
    }

    const primarySlot = slots.has('root')
      ? 'root'
      : slots.size === 1
        ? [...slots.keys()][0]
        : undefined
    return { slots, ...(primarySlot ? { primarySlot } : {}) }
  }

  static #containsJsx(node: ESTree.Node): boolean {
    let found = false
    walkAst(node, (current) => {
      if (current.type === 'JSXOpeningElement') {
        found = true
      }
    })
    return found
  }

  static #throwIfUnresolvedLocal(module: ModuleInfo, name: string): void {
    const binding = module.imports.get(name)
    if (binding?.specifier.startsWith('.')) {
      throw new Error(`Unable to resolve local symbol "${name}" from ${module.filePath}`)
    }
    const reexport = module.reexports.get(name)
    if (reexport?.specifier.startsWith('.')) {
      throw new Error(`Unable to resolve local symbol "${name}" from ${module.filePath}`)
    }
  }
}
