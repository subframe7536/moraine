import { readFileSync } from 'node:fs'
import path from 'node:path'

import { parseSync } from 'vite'

import { ARIA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions'

import type { ApiAttributeDoc, ComponentAttributeDoc } from './types'

type AstNode = Record<string, any>

function getName(node: AstNode | undefined): string | null {
  if (!node) return null
  if (node.type === 'Identifier' || node.type === 'JSXIdentifier' || node.type === 'Literal') {
    return String(node.name ?? node.value)
  }
  if (node.type === 'JSXNamespacedName') {
    const namespace = getName(node.namespace)
    const name = getName(node.name)
    return namespace && name ? `${namespace}:${name}` : name
  }
  if (node.type === 'JSXMemberExpression') return getName(node.property)
  return null
}

function getStaticValue(attribute: AstNode): string | null {
  const value = attribute.value
  if (!value) return ''
  if (value.type === 'Literal') return String(value.value)
  const expression = value.expression
  if (expression?.type === 'Literal') return String(expression.value)
  return null
}

function resolveLocalImportPath(importerPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null

  const basePath = path.resolve(path.dirname(importerPath), specifier)
  const candidates = [
    `${basePath}.tsx`,
    `${basePath}.ts`,
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.ts'),
  ]

  for (const candidate of candidates) {
    try {
      readFileSync(candidate, 'utf8')
      return candidate
    } catch {}
  }

  return null
}

function resolveReadableSourcePath(projectRoot: string, sourcePath: string): string | null {
  const absoluteSourcePath = path.join(projectRoot, sourcePath)
  const candidates = [absoluteSourcePath, absoluteSourcePath.replace(/\.d\.ts$/, '.tsx')]
  for (const candidate of candidates) {
    try {
      readFileSync(candidate, 'utf8')
      return candidate
    } catch {}
  }
  return null
}

function getAttributeType(name: string): string {
  if (name === 'role' || name === 'aria-current' || name === 'aria-live') return 'string'
  if (name === 'data-slot' || name === 'data-size' || name === 'data-variant') return 'string'
  if (name.startsWith('data-')) return 'string | undefined'
  return 'boolean | string | undefined'
}

function createAttributeDoc(name: string): ApiAttributeDoc {
  const isAria = name === 'role' || name.startsWith('aria-')
  const descriptions = isAria ? ARIA_ATTRIBUTE_DESCRIPTIONS : DATA_ATTRIBUTE_DESCRIPTIONS
  return {
    name,
    required: false,
    type: getAttributeType(name),
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

function walk(node: unknown, visit: (node: AstNode) => void): void {
  if (!node || typeof node !== 'object') return
  const astNode = node as AstNode
  visit(astNode)
  for (const value of Object.values(astNode)) {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, visit)
    } else {
      walk(value, visit)
    }
  }
}

export function extractSourceAttributeReference(
  projectRoot: string,
  sourcePath: string | undefined,
): ComponentAttributeDoc {
  if (!sourcePath) return { aria: [], data: [], slots: [] }

  const ariaNames = new Set<string>()
  const dataNames = new Set<string>()
  const slotReferenceByName = new Map<
    string,
    { cssVariables: Set<string>; dataAttributes: Set<string>; ariaAttributes: Set<string> }
  >()
  const visited = new Set<string>()

  const getSlotReference = (slotName: string) => {
    let reference = slotReferenceByName.get(slotName)
    if (!reference) {
      reference = { cssVariables: new Set(), dataAttributes: new Set(), ariaAttributes: new Set() }
      slotReferenceByName.set(slotName, reference)
    }
    return reference
  }

  const collectFromSource = (absoluteSourcePath: string) => {
    if (visited.has(absoluteSourcePath)) return
    visited.add(absoluteSourcePath)

    let sourceCode = ''
    try {
      sourceCode = readFileSync(absoluteSourcePath, 'utf8')
    } catch {
      return
    }

    const parsed = parseSync(absoluteSourcePath, sourceCode, {
      lang: absoluteSourcePath.endsWith('x') ? 'tsx' : 'ts',
      sourceType: 'module',
    })
    const localComponentImports = new Map<string, string>()
    const usedLocalComponents = new Set<string>()

    for (const statement of parsed.program.body as AstNode[]) {
      if (statement.type === 'ExportNamedDeclaration' && statement.source?.value) {
        const resolvedPath = resolveLocalImportPath(
          absoluteSourcePath,
          String(statement.source.value),
        )
        if (resolvedPath) collectFromSource(resolvedPath)
      }
      if (statement.type !== 'ImportDeclaration' || !statement.source?.value) continue
      const resolvedPath = resolveLocalImportPath(
        absoluteSourcePath,
        String(statement.source.value),
      )
      if (!resolvedPath) continue
      for (const specifier of statement.specifiers ?? []) {
        const localName = getName(specifier.local)
        if (localName) localComponentImports.set(localName, resolvedPath)
      }
    }

    walk(parsed.program, (node) => {
      if (node.type === 'JSXOpeningElement' || node.type === 'JSXOpeningFragment') {
        const tagName = getName(node.name)
        if (tagName && localComponentImports.has(tagName)) usedLocalComponents.add(tagName)
        const attributes = (node.attributes ?? []).filter(
          (attr: AstNode) => attr.type === 'JSXAttribute',
        )
        const slotAttribute = attributes.find((attribute: AstNode) => {
          const name = getName(attribute.name)
          return name === 'data-slot' || name === 'slotName'
        })
        const slotName = slotAttribute ? getStaticValue(slotAttribute) : null
        if (slotName) getSlotReference(slotName)

        for (const attribute of attributes) {
          const name = getName(attribute.name)
          if (!name) continue
          if (name === 'role' || name.startsWith('aria-')) {
            ariaNames.add(name)
            if (slotName) getSlotReference(slotName).ariaAttributes.add(name)
            continue
          }
          if (name.startsWith('data-')) {
            dataNames.add(name)
            if (slotName && name !== 'data-slot')
              getSlotReference(slotName).dataAttributes.add(name)
          }
        }
      }

      if (node.type === 'Property' || node.type === 'PropertyDefinition') {
        const name = getName(node.key)
        if (name?.startsWith('--')) getSlotReference('root').cssVariables.add(name)
      }
    })

    for (const componentName of usedLocalComponents) {
      const importPath = localComponentImports.get(componentName)
      if (importPath) collectFromSource(importPath)
    }
  }

  const initialPath = resolveReadableSourcePath(projectRoot, sourcePath)
  if (initialPath) collectFromSource(initialPath)

  return {
    aria: [...ariaNames].sort().map(createAttributeDoc),
    data: [...dataNames].sort().map(createAttributeDoc),
    slots: [...slotReferenceByName.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, reference]) => ({
        name,
        cssVariables: [...reference.cssVariables].sort().map(createCssVariableDoc),
        dataAttributes: [...reference.dataAttributes].sort().map(createAttributeDoc),
        ariaAttributes: [...reference.ariaAttributes].sort().map(createAttributeDoc),
      })),
  }
}
