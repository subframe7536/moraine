import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { RuntimeExtractor } from './runtime'

describe('RuntimeExtractor', () => {
  const projectRoot = path.resolve(__dirname, '../../..')
  const extractor = new RuntimeExtractor(projectRoot)

  test('extracts button runtime data and aria attributes', async () => {
    const targets = await extractor.extractRuntimeMetadata(
      'src/elements/button/button.tsx',
      new Set(['root', 'loading', 'leading', 'label', 'trailing']),
      'root',
    )

    const rootTarget = targets.find((t) => t.target === 'root')
    expect(rootTarget).toBeDefined()

    const names = rootTarget?.attributes.map((a) => a.name)
    expect(names).toContain('data-disabled')
    expect(names).toContain('data-loading')
    expect(names).toContain('aria-busy')

    const ariaBusy = rootTarget?.attributes.find((a) => a.name === 'aria-busy')
    expect(ariaBusy?.kind).toBe('aria')
    expect(ariaBusy?.description).toBeDefined()
  })

  test('does not expose internal Collapsible wrapper target', async () => {
    const targets = await extractor.extractRuntimeMetadata(
      'src/elements/collapsible/collapsible.tsx',
      new Set(['root', 'trigger', 'content']),
      'root',
    )

    const targetNames = targets.map((t) => t.target)
    expect(targetNames).not.toContain('contentWrapper')
    expect(targetNames).not.toContain('wrapper')
  })
})
