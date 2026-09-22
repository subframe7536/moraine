import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { RecipeExtractor } from './recipe'

const roots: string[] = []

async function fixture(files: Record<string, string>) {
  const root = await mkdtemp(path.join(tmpdir(), 'moraine-recipe-'))
  roots.push(root)
  await Promise.all(
    Object.entries(files).map(async ([name, source]) => {
      const target = path.join(root, name)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, source, 'utf8')
    }),
  )
  return new RecipeExtractor(root)
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('RecipeExtractor', () => {
  test('extracts composed slots, variants, data attributes, and CSS variables', async () => {
    const extractor = await fixture({
      'shared.recipe.ts': `
export const SHARED_BASE = { root: '', trigger: '' }
export const sharedDataAttributes = {
  root: (state) => createDataAttributes({ 'data-disabled': state.disabled })
}
`,
      'demo.recipe.ts': `
import { SHARED_BASE, sharedDataAttributes } from './shared.recipe.ts'
export const demoDataAttributes = {
  ...sharedDataAttributes,
  trigger: sharedDataAttributes.root,
  content: (state) => createDataAttributes({
    'data-expanded': state.expanded,
    'data-slot': state.slot,
    'data-moraine-private': state.private,
    'data-test-id': state.test,
  }),
}
export const demoCssVariables = {
  content: (state) => createCssVariables({ '--mo-demo-height': state.height }),
}
export const demoRecipe = defineRecipe('demo', {
  base: { ...SHARED_BASE, content: '', root: 'override' },
  defaultVariants: { size: 'md', selected: false },
  variants: {
    size: { sm: {}, md: {}, 2: {} },
    selected: { true: {}, false: {} },
  },
})
`,
    })

    const result = await extractor.extract('demo.recipe.ts', 'Demo')
    expect(result.slots).toEqual(['root', 'trigger', 'content'])
    expect(result.variants).toEqual([
      {
        name: 'size',
        values: ['sm', 'md', 2],
        default: { kind: 'literal', value: 'md' },
      },
      {
        name: 'selected',
        values: [true, false],
        default: { kind: 'literal', value: false },
      },
    ])
    expect(result.dataAttributes).toEqual([
      { target: 'root', attributes: ['data-disabled'] },
      { target: 'trigger', attributes: ['data-disabled'] },
      { target: 'content', attributes: ['data-expanded'] },
    ])
    expect(result.cssVariables).toEqual([{ target: 'content', variables: ['--mo-demo-height'] }])
  })

  test('rejects duplicate targets and unsupported contract calls', async () => {
    const duplicates = await fixture({
      'demo.recipe.ts': `
export const demoDataAttributes = {
  root: (state) => createDataAttributes({ 'data-disabled': state.disabled }),
  root: (state) => createDataAttributes({ 'data-loading': state.loading }),
}
export const demoRecipe = defineRecipe('demo', { base: { root: '' } })
`,
    })
    await expect(duplicates.extract('demo.recipe.ts', 'Demo')).rejects.toThrow(
      'Duplicate demoDataAttributes targets key "root"',
    )

    const unsupported = await fixture({
      'demo.recipe.ts': `
export const demoDataAttributes = { root: (state) => makeAttrs(state) }
export const demoRecipe = defineRecipe('demo', { base: { root: '' } })
`,
    })
    await expect(unsupported.extract('demo.recipe.ts', 'Demo')).rejects.toThrow(
      'Unsupported demoDataAttributes.root syntax',
    )
  })

  test('fails when recipe metadata depends on a non-recipe module', async () => {
    const extractor = await fixture({
      'opaque.ts': `export const SIZES = { sm: {}, md: {} }`,
      'demo.recipe.ts': `
import { SIZES } from './opaque.ts'
export const demoRecipe = defineRecipe('demo', {
  base: { root: '' },
  variants: { size: SIZES },
})
`,
    })
    await expect(extractor.extract('demo.recipe.ts', 'Demo')).rejects.toThrow(
      'API metadata dependencies must originate from .recipe.ts files',
    )
  })
})
