// @vitest-environment node

import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const projectRoot = path.resolve(__dirname, '../../..')

function collectFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name)
    return entry.isDirectory() ? collectFiles(target) : [target]
  })
}

describe('API documentation architecture guardrails', () => {
  test('production generator code contains no implementation or runtime discovery path', () => {
    const root = path.join(projectRoot, 'docs/build/api-doc')
    const sources = collectFiles(root).filter(
      (file) => file.endsWith('.ts') && !file.endsWith('.test.ts'),
    )
    const combined = sources.map((file) => readFileSync(file, 'utf8')).join('\n')

    expect(combined).not.toMatch(/\.tsx\b/)
    expect(combined).not.toContain('src/index.ts')
    expect(combined).not.toMatch(/createProgram|TypeChecker|ts\.Program/)
  })

  test('component implementations do not declare public data attributes', () => {
    const sourceRoots = ['element', 'form', 'navigation', 'overlay'].map((domain) =>
      path.join(projectRoot, 'src', domain),
    )
    const violations: string[] = []
    for (const root of sourceRoots) {
      for (const file of collectFiles(root)) {
        if (
          !file.endsWith('.tsx') ||
          file.endsWith('.test.tsx') ||
          file.endsWith('.fixture.tsx') ||
          file.endsWith('.ssr.test.tsx')
        ) {
          continue
        }
        const source = readFileSync(file, 'utf8')
        if (
          /\bdata-(?!slot\b|moraine-|test-)[a-z0-9-]+\s*=/u.test(source) ||
          /get\s+['"]data-(?!slot['"]|moraine-|test-)[a-z0-9-]+['"]\s*\(/u.test(source) ||
          /['"]data-(?!slot['"]|moraine-|test-)[a-z0-9-]+['"]\s*:/u.test(source)
        ) {
          violations.push(`${path.relative(projectRoot, file)} declares a public data attribute`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
