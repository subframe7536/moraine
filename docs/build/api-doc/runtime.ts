import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { ARIA_ATTRIBUTE_DESCRIPTIONS, DATA_ATTRIBUTE_DESCRIPTIONS } from '../markdown/descriptions'

import { nodeText, parseTypeScript, walkAst } from './ast'
import type { RuntimeAttributeApi, RuntimeTargetApi } from './types'

function unwrapExpression(expression: ESTree.Expression | null): ESTree.Expression | null {
  let current = expression
  while (
    current &&
    (current.type === 'TSAsExpression' ||
      current.type === 'TSTypeAssertion' ||
      current.type === 'TSNonNullExpression' ||
      current.type === 'ParenthesizedExpression')
  ) {
    current = current.expression
  }
  return current
}

function getStaticStringValues(attribute: ESTree.JSXAttribute): string[] {
  if (!attribute.value) {
    return ['']
  }
  if (attribute.value.type === 'Literal') {
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
    if (current.type === 'Literal') {
      return [String(current.value)]
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

function getJsxAttributeName(name: ESTree.JSXAttributeName): string | null {
  if (name.type === 'JSXIdentifier') {
    return name.name
  }
  if (name.type === 'JSXNamespacedName') {
    return `${name.namespace.name}:${name.name.name}`
  }
  return null
}

const INTERNAL_TARGETS = new Set([
  'wrapper',
  'contentWrapper',
  'positioner',
  'portal',
  'inner',
  'measurer',
  'sentinel',
  'dummy',
])

export class RuntimeExtractor {
  readonly projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async extractRuntimeMetadata(
    sourcePath: string,
    publicSlotNames: ReadonlySet<string>,
    targetFallback: string = 'root',
  ): Promise<RuntimeTargetApi[]> {
    const absolutePath = path.isAbsolute(sourcePath)
      ? sourcePath
      : path.resolve(this.projectRoot, sourcePath)

    if (!existsSync(absolutePath)) {
      return []
    }

    const content = readFileSync(absolutePath, 'utf8')
    const parsed = await parseTypeScript(
      absolutePath,
      content,
      absolutePath.endsWith('.tsx') ? 'tsx' : 'ts',
    )

    const targetAttributesMap = new Map<string, Map<string, RuntimeAttributeApi>>()

    const getTargetMap = (target: string): Map<string, RuntimeAttributeApi> => {
      let map = targetAttributesMap.get(target)
      if (!map) {
        map = new Map()
        targetAttributesMap.set(target, map)
      }
      return map
    }

    // 1. Scan JSX elements for attributes
    walkAst(parsed.program, (node) => {
      if (node.type !== 'JSXOpeningElement') {
        return
      }

      const attributes = node.attributes.filter(
        (a): a is ESTree.JSXAttribute => a.type === 'JSXAttribute',
      )

      // Find slot name from data-slot or slotName
      let targetName = targetFallback
      for (const attr of attributes) {
        const name = getJsxAttributeName(attr.name)
        if (name && isSlotAttributeName(name)) {
          const values = getStaticStringValues(attr)
          if (values.length > 0 && values[0]) {
            targetName = values[0]
            break
          }
        }
      }

      // Ignore internal targets
      if (INTERNAL_TARGETS.has(targetName)) {
        return
      }

      // Only retain targets that match public slots or the root/fallback
      if (
        publicSlotNames.size > 0 &&
        !publicSlotNames.has(targetName) &&
        targetName !== 'root' &&
        targetName !== targetFallback
      ) {
        return
      }

      const targetMap = getTargetMap(targetName)

      for (const attr of attributes) {
        const name = getJsxAttributeName(attr.name)
        if (!name || isSlotAttributeName(name)) {
          continue
        }

        if (name === 'role') {
          const values = getStaticStringValues(attr)
          targetMap.set(name, {
            name,
            kind: 'role',
            ...(values.length > 0 ? { values } : {}),
            description: ARIA_ATTRIBUTE_DESCRIPTIONS.role ?? 'Defines the semantic role.',
          })
        } else if (name.startsWith('aria-')) {
          const values = getStaticStringValues(attr).filter((v) => v === 'true' || v === 'false')
          targetMap.set(name, {
            name,
            kind: 'aria',
            ...(values.length > 0 ? { values } : {}),
            description:
              ARIA_ATTRIBUTE_DESCRIPTIONS[name] ??
              'Accessibility attribute forwarded by the rendered component.',
          })
        } else if (name.startsWith('data-')) {
          // Ignore private data-attributes used internally for measurements or testing
          if (name.startsWith('data-moraine-') || name.startsWith('data-test-')) {
            continue
          }
          const rawValues = getStaticStringValues(attr)
          const validValues = rawValues.filter((v) => v !== '' && v !== 'undefined' && v !== 'null')
          targetMap.set(name, {
            name,
            kind: 'data',
            ...(validValues.length > 0 ? { values: validValues } : {}),
            description:
              DATA_ATTRIBUTE_DESCRIPTIONS[name] ??
              'State or slot attribute exposed for styling hooks and selectors.',
          })
        }
      }

      // Check for CSS variables in node text
      const elementText = nodeText(parsed, node)
      for (const match of elementText.matchAll(/--[A-Za-z_][\w-]*/g)) {
        const varName = match[0]
        targetMap.set(varName, {
          name: varName,
          kind: 'css',
          description: 'CSS custom property exposed by this element.',
        })
      }
    })

    // 2. Format result sorted deterministically
    const result: RuntimeTargetApi[] = []
    const sortedTargetNames = [...targetAttributesMap.keys()].sort()

    for (const target of sortedTargetNames) {
      const map = targetAttributesMap.get(target)!
      if (map.size === 0) {
        continue
      }

      const attributes = [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
      result.push({
        target,
        attributes,
      })
    }

    return result
  }
}
