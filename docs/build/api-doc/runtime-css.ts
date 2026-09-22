import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { parseTypeScript } from './ast'
import {
  collectBindings,
  objectPropertyExpression,
  propertyName,
  resolveObjectExpressions,
  visitNodes,
} from './runtime-target'
import type { ImportBinding, NodeLike, RuntimeExtractionOptions } from './runtime-target'
import { analyzeStaticValues, isNode, uniqueStaticStrings } from './runtime-value'
import type { CssVariableApi } from './types'

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

function findImplementation(root: unknown, name: string): NodeLike | null {
  let found: NodeLike | null = null
  visitNodes(root, (node) => {
    if (found) {
      return
    }
    if (node.type === 'FunctionDeclaration' && propertyName(node.id) === name) {
      found = node
      return
    }
    if (node.type === 'VariableDeclarator' && propertyName(node.id) === name) {
      const value = node.init
      if (isNode(value)) {
        found = value
      }
    }
  })
  return found
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

export async function extractRecipeCssVariables(
  absolutePath: string,
  implementation: NodeLike,
  imports: ReadonlyMap<string, ImportBinding>,
  options: RuntimeExtractionOptions,
): Promise<CssVariableApi[]> {
  const variables = new Map<string, CssVariableApi>()
  const recipeBindings = new Set<string>()
  const bindings = collectBindings(implementation)
  let rootTarget = options.targetFallback

  visitNodes(implementation, (node) => {
    if (node.type !== 'CallExpression' || propertyName(node.callee) !== 'createStyles') {
      return
    }
    const args = Array.isArray(node.arguments) ? node.arguments : []
    const recipeName = propertyName(args[0])
    if (recipeName && imports.has(recipeName)) {
      recipeBindings.add(recipeName)
    }
    for (const object of resolveObjectExpressions(args[2], bindings)) {
      const properties = Array.isArray(object.properties) ? object.properties : []
      const rootSlotProperty = properties.find(
        (property) =>
          isNode(property) &&
          property.type === 'Property' &&
          propertyName(property.key) === 'rootSlot',
      )
      if (isNode(rootSlotProperty)) {
        const analysis = analyzeStaticValues(objectPropertyExpression(rootSlotProperty))
        const value = !analysis.dynamic
          ? uniqueStaticStrings(analysis.values).find(Boolean)
          : undefined
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
