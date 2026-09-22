import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { ARIA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions'

import { getIdentifierName, parseTypeScript } from './ast'
import { extractRecipeCssVariables } from './runtime-css'
import {
  addAttribute,
  attributeExpression,
  collectBindings,
  getJsxAttributeName,
  jsxName,
  mergeTarget,
  objectPropertyExpression,
  propertyName,
  renderedElement,
  resolveObjectExpressions,
  returnedExpression,
  staticSlotName,
  visitNodes,
} from './runtime-target'
import type {
  ImportBinding,
  NodeLike,
  RuntimeExtractionOptions,
  RuntimeTargetState,
} from './runtime-target'
import {
  analyzeStaticValues,
  BOOLEAN_ARIA_ATTRIBUTES,
  classifyRuntimeValue,
  isNode,
  unwrapExpression,
} from './runtime-value'
import type { CssVariableApi, RuntimeAttributeApi, RuntimeTargetApi } from './types'

export type { RuntimeExtractionOptions } from './runtime-target'

export interface RuntimeExtraction {
  targets: RuntimeTargetApi[]
  cssVariables: CssVariableApi[]
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
  const analysis = analyzeStaticValues(expression)
  if (!analysis.dynamic && analysis.values.length === 0) {
    return null
  }
  return {
    name,
    kind,
    value: classifyRuntimeValue(name, expression),
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

function findHostOpening(
  implementation: NodeLike,
  bindings: ReadonlyMap<string, NodeLike>,
): NodeLike | null {
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
    if (name === 'Dynamic' || /^[a-z]/.test(name) || staticSlotName(node, bindings)) {
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

function knownSpreadAttributes(
  expression: unknown,
  bindings: ReadonlyMap<string, NodeLike>,
  hasPopperContentContract = false,
  popperContentAttributes: readonly RuntimeAttributeApi[] = [],
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
    return knownSpreadAttributes(
      bound,
      bindings,
      hasPopperContentContract,
      popperContentAttributes,
      seen,
    )
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
          : textName === 'contentProps' && hasPopperContentContract
            ? ['data-closed', 'data-expanded']
            : []
  const attributeMap = new Map<string, RuntimeAttributeApi>()
  for (const name of names) {
    addAttribute(attributeMap, {
      name,
      kind: name === 'role' ? 'role' : name.startsWith('aria-') ? 'aria' : 'data',
      value: name.startsWith('data-')
        ? { kind: 'presence' }
        : BOOLEAN_ARIA_ATTRIBUTES.has(name)
          ? { kind: 'boolean' }
          : { kind: 'dynamic' },
      description: descriptionFor(name),
    })
  }
  if (textName === 'contentProps' && hasPopperContentContract) {
    for (const attribute of popperContentAttributes) {
      attributeMap.set(attribute.name, attribute)
    }
  }
  if (current.type === 'CallExpression') {
    const args = Array.isArray(current.arguments) ? current.arguments : []
    for (const argument of args) {
      for (const attribute of knownSpreadAttributes(
        argument,
        bindings,
        hasPopperContentContract,
        popperContentAttributes,
        new Set(seen),
      )) {
        addAttribute(attributeMap, attribute)
      }
    }
  }
  return [...attributeMap.values()]
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
    const host = findHostOpening(implementation, bindings)
    const targets = new Map<string, RuntimeTargetState>()
    const cssVariables = new Map<string, CssVariableApi>()
    const delegated: Array<{
      name: string
      binding: ImportBinding
      hostTargetName?: string
      attributes?: RuntimeAttributeApi[]
      conditional?: boolean
    }> = []
    const localDelegates = new Map<string, string | undefined>()

    for (const variable of await extractRecipeCssVariables(
      absolutePath,
      implementation,
      imports,
      options,
    )) {
      cssVariables.set(`${variable.target}:${variable.name}`, variable)
    }

    const openings: Array<{ node: NodeLike; ancestors: readonly NodeLike[] }> = []
    visitNodes(implementation, (node, ancestors) => {
      if (node.type === 'JSXOpeningElement') {
        openings.push({ node, ancestors })
      }
    })
    const explicitPublicTargets = new Set(
      openings.flatMap(({ node }) => {
        const slot = staticSlotName(node, bindings)
        return slot && options.publicSlotNames.has(slot) ? [slot] : []
      }),
    )

    // PopperContent's render callback forwards this repository-local contentProps contract
    // onto the consumer-owned public content host.
    const popperContentAttributes = new Map<string, RuntimeAttributeApi>()
    let hasPopperContentContract = false
    for (const { node } of openings) {
      const tagName = jsxName(node.name)
      const simpleName = tagName?.split('.')[0]
      const binding = simpleName ? imports.get(simpleName) : undefined
      if (binding?.importedName !== 'PopperContent' || !binding.source.includes('popper')) {
        continue
      }
      hasPopperContentContract = true
      const attributes = Array.isArray(node.attributes) ? node.attributes : []
      for (const attribute of attributes) {
        if (!isNode(attribute)) {
          continue
        }
        if (attribute.type === 'JSXAttribute') {
          const name = getJsxAttributeName(attribute)
          const runtimeAttribute = name
            ? createAttribute(name, attributeExpression(attribute))
            : null
          if (runtimeAttribute) {
            popperContentAttributes.set(runtimeAttribute.name, runtimeAttribute)
          }
          continue
        }
        if (attribute.type === 'JSXSpreadAttribute') {
          for (const object of resolveObjectExpressions(attribute.argument, bindings)) {
            const properties = Array.isArray(object.properties) ? object.properties : []
            for (const property of properties) {
              if (!isNode(property) || property.type !== 'Property') {
                continue
              }
              const name = propertyName(property.key)
              const runtimeAttribute = name
                ? createAttribute(name, objectPropertyExpression(property))
                : null
              if (runtimeAttribute) {
                popperContentAttributes.set(runtimeAttribute.name, runtimeAttribute)
              }
            }
          }
        }
      }
    }

    for (const { node, ancestors } of openings) {
      const tagName = jsxName(node.name)
      const declaredSlot = staticSlotName(node, bindings)
      const slot = declaredSlot
      const publicSlot = slot && options.publicSlotNames.has(slot) ? slot : undefined
      const usesHostFallback =
        !publicSlot &&
        node === host &&
        options.allowHostFallback !== false &&
        !explicitPublicTargets.has(options.targetFallback)
      const targetName = publicSlot ?? (usesHostFallback ? options.targetFallback : null)
      const conditional = isConditional(ancestors)

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
            ...(conditional ? { conditional: true } : {}),
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
        continue
      }

      const repositoryBinding = tagName ? imports.get(tagName.split('.')[0]!) : undefined
      const element =
        renderedElement(node, bindings, options.defaultElement) ??
        (repositoryBinding && !repositoryBinding.source.startsWith('.')
          ? options.defaultElement
          : undefined)
      const physicalHost = tagName === 'Dynamic' || Boolean(tagName && /^[a-z]/.test(tagName))
      const incoming: RuntimeTargetState = {
        name: targetName,
        ...(publicSlot || options.publicSlotNames.has(targetName)
          ? { slot: publicSlot ?? targetName }
          : {}),
        ...(slot ? { selector: `[data-slot="${slot}"]` } : {}),
        ...(element ? { element } : {}),
        ...(conditional ? { condition: 'Conditional' } : {}),
        attributes: [],
        attributeMap: new Map(),
        ...(physicalHost ? { physicalIdentity: `${absolutePath}:${node.start}` } : {}),
        ...(usesHostFallback && slot && slot !== targetName ? { selectorAlias: true } : {}),
      }
      const target = mergeTarget(targets.get(targetName), incoming, {
        name: targetName,
        ...(publicSlot || options.publicSlotNames.has(targetName)
          ? { publicSlot: publicSlot ?? targetName }
          : {}),
        ...(slot ? { publicSelector: `[data-slot="${slot}"]` } : {}),
        diagnostics: this.diagnostics,
        diagnosticContext: path.relative(this.projectRoot, absolutePath),
      })
      targets.set(targetName, target)
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
        for (const runtimeAttribute of knownSpreadAttributes(
          attribute.argument,
          bindings,
          hasPopperContentContract,
          [...popperContentAttributes.values()],
        )) {
          addAttribute(target.attributeMap, runtimeAttribute)
        }
      }
    }

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
        (options.allowHostFallback !== false &&
        targets.size === 0 &&
        localDelegates.size === 1 &&
        delegated.length === 0
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
        const existing = targets.get(targetName)
        const nestedState: RuntimeTargetState = {
          ...nestedTarget,
          name: targetName,
          attributeMap: new Map(
            nestedTarget.attributes.map((attribute) => [attribute.name, attribute]),
          ),
          physicalIdentity: `${absolutePath}:${implementationName}:${nestedTarget.name}`,
          ...(effectiveDelegateTarget &&
          (nestedTarget.name !== targetName ||
            nestedTarget.selector?.match(/^\[data-slot="([^"]+)"\]$/)?.[1] !== targetName)
            ? { selectorAlias: true }
            : {}),
        }
        targets.set(
          targetName,
          mergeTarget(existing, nestedState, {
            name: targetName,
            ...(existing?.slot || options.publicSlotNames.has(targetName)
              ? { publicSlot: existing?.slot ?? targetName }
              : {}),
            ...(existing?.selector ? { publicSelector: existing.selector } : {}),
            preferIncomingPhysical: true,
            diagnostics: this.diagnostics,
            diagnosticContext: path.relative(this.projectRoot, absolutePath),
          }),
        )
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
        (options.allowHostFallback !== false &&
        targets.size === 0 &&
        delegated.length === 1 &&
        localDelegates.size === 0
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
        const existing = targets.get(targetName)
        const nestedState: RuntimeTargetState = {
          ...nestedTarget,
          name: targetName,
          ...(delegate.conditional ? { condition: 'Conditional' } : {}),
          attributeMap: new Map(
            nestedTarget.attributes.map((attribute) => [attribute.name, attribute]),
          ),
          physicalIdentity: `${resolved.sourcePath}:${resolved.implementationName}:${nestedTarget.name}`,
          ...(effectiveHostTargetName &&
          (nestedTarget.name !== targetName ||
            nestedTarget.selector?.match(/^\[data-slot="([^"]+)"\]$/)?.[1] !== targetName)
            ? { selectorAlias: true }
            : {}),
        }
        for (const attribute of delegate.attributes ?? []) {
          addAttribute(nestedState.attributeMap, attribute)
        }
        targets.set(
          targetName,
          mergeTarget(existing, nestedState, {
            name: targetName,
            ...(existing?.slot || options.publicSlotNames.has(targetName)
              ? { publicSlot: existing?.slot ?? targetName }
              : {}),
            ...(existing?.selector ? { publicSelector: existing.selector } : {}),
            preferIncomingPhysical: true,
            diagnostics: this.diagnostics,
            diagnosticContext: path.relative(this.projectRoot, absolutePath),
          }),
        )
      }
      for (const variable of nested.cssVariables) {
        cssVariables.set(`${variable.target}:${variable.name}`, variable)
      }
    }

    const normalizedTargets = [...targets.values()].map(
      ({
        attributeMap,
        physicalIdentity: _physicalIdentity,
        selectorAlias: _selectorAlias,
        ...target
      }) =>
        Object.assign(target, {
          attributes: [...attributeMap.values()].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        }),
    )

    for (const target of normalizedTargets) {
      const selectorSlot = target.selector?.match(/^\[data-slot="([^"]+)"\]$/)?.[1]
      if (target.slot && selectorSlot && target.slot !== selectorSlot) {
        const state = targets.get(target.name)
        if (state?.selectorAlias) {
          delete target.selector
        } else {
          this.diagnostics.push(
            `${path.relative(this.projectRoot, absolutePath)}: target ${target.name} has public slot ${target.slot} but selector ${target.selector}`,
          )
        }
      }
    }

    return {
      targets: normalizedTargets,
      cssVariables: [...cssVariables.values()].sort((left, right) => {
        const targetOrder = left.target.localeCompare(right.target)
        return targetOrder === 0 ? left.name.localeCompare(right.name) : targetOrder
      }),
    }
  }
}
