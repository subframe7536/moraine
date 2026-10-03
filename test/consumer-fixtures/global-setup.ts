import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { parse } from 'vite'
import type { ESTree } from 'vite'

import type { RecipeConfig } from '../../src/theme/recipe'

import { ensureBuild, PROJECT_ROOT } from './helpers'

export async function setup(): Promise<void> {
  ensureBuild()
  const distDir = join(PROJECT_ROOT, 'dist')
  const outputPath = join(PROJECT_ROOT, 'node_modules/.cache/moraine/class-tokens.json')
  const tokens = new Set<string>()

  function collect(value: unknown): void {
    if (typeof value === 'string') {
      for (const token of value.split(/\s+/).filter(Boolean)) {
        tokens.add(token)
      }
    } else if (Array.isArray(value)) {
      value.forEach(collect)
    }
  }

  function collectSlots(value: Record<string, unknown>): void {
    for (const [key, classes] of Object.entries(value)) {
      if (!key.startsWith('--') && key !== 'variants') {
        collect(classes)
      }
    }
  }

  function collectExpression(node: ESTree.Node | null): void {
    if (!node) {
      return
    }
    switch (node.type) {
      case 'Literal':
        collect(node.value)
        break
      case 'JSXExpressionContainer':
        collectExpression(node.expression)
        break
      case 'ConditionalExpression':
        collectExpression(node.consequent)
        collectExpression(node.alternate)
        break
      case 'LogicalExpression':
        collectExpression(node.right)
        break
      case 'ArrayExpression':
        node.elements.forEach(collectExpression)
        break
      default:
        break
    }
  }

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk)
    } else if (typeof value === 'object' && value !== null && 'type' in value) {
      const node = value as ESTree.Node
      if (
        node.type === 'JSXAttribute' &&
        node.name.type === 'JSXIdentifier' &&
        node.name.name === 'class'
      ) {
        collectExpression(node.value)
      } else if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'cn'
      ) {
        node.arguments.forEach(collectExpression)
      }
      Object.values(node).forEach(walk)
    }
  }

  // Resolve recipe imports and expanded variant groups from the actual distribution.
  for (const name of readdirSync(distDir, { recursive: true, encoding: 'utf8' })) {
    const path = join(distDir, name)
    if (/\.(?:recipe|class)\.mjs$/.test(name)) {
      const module = (await import(pathToFileURL(path).href)) as Record<string, unknown>
      for (const [key, value] of Object.entries(module)) {
        if (typeof value === 'object' && value !== null && 'config' in value) {
          const config = value.config as RecipeConfig<
            Record<string, unknown>,
            Record<string, string | number | boolean>
          >
          collectSlots(config.base)
          for (const values of Object.values(config.variants ?? {})) {
            for (const slots of Object.values(values ?? {})) {
              if (slots) {
                collectSlots(slots)
              }
            }
          }
          for (const slots of config.compoundVariants ?? []) {
            collectSlots(slots)
          }
        } else if (key.endsWith('_CLASS')) {
          collect(value)
        }
      }
    } else if (name.endsWith('.jsx') && !/\.(?:recipe|class)\.jsx$/.test(name)) {
      // Direct JSX classes and cn() branches are not part of recipe exports.
      const parsed = await parse(path, readFileSync(path, 'utf8'), { lang: 'jsx' })
      if (parsed.errors.length > 0) {
        const message = parsed.errors.map((error) => error.message).join('\n')
        throw new Error(`Failed to collect classes from ${path}:\n${message}`)
      }
      walk(parsed.program)
    }
  }

  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify([...tokens].sort(), null, 2)}\n`)
  console.log(`Collected ${tokens.size} class tokens in ${outputPath}`)
}
