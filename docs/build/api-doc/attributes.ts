import { readFileSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'

import { ARIA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions'

import type { ApiAttributeDoc, ComponentAttributeDoc } from './types'

function getJsxAttributeName(name: ts.JsxAttributeName): string | null {
  if (ts.isIdentifier(name) || ts.isJsxNamespacedName(name)) {
    return name.getText()
  }
  return null
}

function getJsxAttributeStaticValue(attribute: ts.JsxAttribute): string | null {
  const initializer = attribute.initializer
  if (!initializer) {
    return ''
  }
  if (ts.isStringLiteral(initializer)) {
    return initializer.text
  }
  if (
    ts.isJsxExpression(initializer) &&
    initializer.expression &&
    ts.isStringLiteralLike(initializer.expression)
  ) {
    return initializer.expression.text
  }
  return null
}

function getJsxAttributes(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
): ts.JsxAttribute[] {
  return node.attributes.properties.filter(ts.isJsxAttribute)
}

function getJsxTagName(tagName: ts.JsxTagNameExpression): string | null {
  if (ts.isIdentifier(tagName)) {
    return tagName.text
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    return tagName.name.text
  }
  return null
}

function resolveLocalImportPath(importerPath: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) {
    return null
  }

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
    } catch {
      // Try the next source candidate.
    }
  }

  return null
}

function resolveReadableSourcePath(projectRoot: string, sourcePath: string): string | null {
  const absoluteSourcePath = path.join(projectRoot, sourcePath)
  const implementationBasePath = absoluteSourcePath.replace(/\.d\.(cts|mts|ts)$/, '')
  const candidates = [
    absoluteSourcePath,
    `${implementationBasePath}.tsx`,
    `${implementationBasePath}.ts`,
    `${implementationBasePath}.jsx`,
    `${implementationBasePath}.js`,
  ]

  for (const candidate of candidates) {
    try {
      readFileSync(candidate, 'utf8')
      return candidate
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

function getAttributeType(name: string): string {
  if (name === 'role' || name === 'aria-current' || name === 'aria-live') {
    return 'string'
  }
  if (name === 'data-slot' || name === 'data-size' || name === 'data-variant') {
    return 'string'
  }
  if (name.startsWith('data-')) {
    return 'string | undefined'
  }
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

export function extractSourceAttributeReference(
  projectRoot: string,
  sourcePath: string | undefined,
): ComponentAttributeDoc {
  if (!sourcePath) {
    return { aria: [], data: [], slots: [] }
  }

  const ariaNames = new Set<string>()
  const dataNames = new Set<string>()
  const slotReferenceByName = new Map<
    string,
    {
      cssVariables: Set<string>
      dataAttributes: Set<string>
      ariaAttributes: Set<string>
    }
  >()
  const visited = new Set<string>()

  const getSlotReference = (slotName: string) => {
    let reference = slotReferenceByName.get(slotName)
    if (!reference) {
      reference = {
        cssVariables: new Set<string>(),
        dataAttributes: new Set<string>(),
        ariaAttributes: new Set<string>(),
      }
      slotReferenceByName.set(slotName, reference)
    }
    return reference
  }

  const collectFromSource = (absoluteSourcePath: string) => {
    if (visited.has(absoluteSourcePath)) {
      return
    }
    visited.add(absoluteSourcePath)

    let sourceCode = ''
    try {
      sourceCode = readFileSync(absoluteSourcePath, 'utf8')
    } catch {
      return
    }

    const sourceFile = ts.createSourceFile(
      absoluteSourcePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const localComponentImports = new Map<string, string>()
    const usedLocalComponents = new Set<string>()

    for (const statement of sourceFile.statements) {
      if (ts.isExportDeclaration(statement)) {
        const moduleSpecifier = statement.moduleSpecifier
        if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
          const resolvedPath = resolveLocalImportPath(absoluteSourcePath, moduleSpecifier.text)
          if (resolvedPath) {
            collectFromSource(resolvedPath)
          }
        }
        continue
      }

      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        continue
      }
      const resolvedPath = resolveLocalImportPath(
        absoluteSourcePath,
        statement.moduleSpecifier.text,
      )
      if (!resolvedPath) {
        continue
      }

      const clause = statement.importClause
      if (clause?.name) {
        localComponentImports.set(clause.name.text, resolvedPath)
      }

      const namedBindings = clause?.namedBindings
      if (!namedBindings || !ts.isNamedImports(namedBindings)) {
        continue
      }

      for (const element of namedBindings.elements) {
        localComponentImports.set(element.name.text, resolvedPath)
      }
    }

    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const attributes = getJsxAttributes(node)
        const slotAttribute = attributes.find((attribute) => {
          const name = getJsxAttributeName(attribute.name)
          return name === 'data-slot' || name === 'slotName'
        })
        const slotName = slotAttribute ? getJsxAttributeStaticValue(slotAttribute) : null

        for (const attribute of attributes) {
          const name = getJsxAttributeName(attribute.name)
          if (!name) {
            continue
          }

          if (name === 'role' || name.startsWith('aria-')) {
            ariaNames.add(name)
            if (slotName) {
              getSlotReference(slotName).ariaAttributes.add(name)
            }
            continue
          }

          if (name.startsWith('data-')) {
            dataNames.add(name)
            if (slotName && name !== 'data-slot') {
              getSlotReference(slotName).dataAttributes.add(name)
            }
          }
        }

        if (slotName) {
          const slotReference = getSlotReference(slotName)
          for (const match of node.getText(sourceFile).matchAll(/--[A-Za-z_][\w-]*/g)) {
            slotReference.cssVariables.add(match[0])
          }
        }

        const tagName = getJsxTagName(node.tagName)
        if (tagName && /^[A-Z]/.test(tagName)) {
          usedLocalComponents.add(tagName)
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    for (const componentName of usedLocalComponents) {
      const importedPath = localComponentImports.get(componentName)
      if (importedPath) {
        collectFromSource(importedPath)
      }
    }
  }

  const resolvedSourcePath = resolveReadableSourcePath(projectRoot, sourcePath)
  if (!resolvedSourcePath) {
    return { aria: [], data: [], slots: [] }
  }

  collectFromSource(resolvedSourcePath)

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
