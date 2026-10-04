import { describe, expect, test } from 'vitest'

import { scanDocsPages } from '../routes.ts'
import { createFileFixture } from '../test-util/file-fixture.ts'

import { loadApiRegistry } from './registry.ts'

function page(pathValue: string, parts?: string) {
  return `---
title: Demo
description: Demo component.
api:
  path: ${pathValue}
${parts ? `  parts: ${parts}\n` : ''}search:
  tags: [demo]
sidebar:
  order: 1
---
`
}

function types(name: string, kind: 'single' | 'composite', declarations = '') {
  return `export namespace ${name}T {
  export type Kind = '${kind}'
  export type Slot<T = unknown> = 'root'
  export interface Props {}
  ${declarations}
}`
}

function loadRegistry(root: string) {
  return loadApiRegistry(root, scanDocsPages(root))
}

describe('loadApiRegistry', () => {
  test('loads single and composite registrations from frontmatter', async () => {
    const root = await createFileFixture({
      'docs/pages/components/(general)/demo/index.mdx': page('src/element/demo/demo'),
      'src/element/demo/demo.types.ts': types('Demo', 'single'),
      'src/element/demo/demo.recipe.ts': `export const demoRecipe = defineRecipe('demo', { base: { root: '' } })`,
      'docs/pages/components/(overlay)/panel/index.mdx': page(
        'src/overlay/panel/panel',
        '[Trigger, Content]',
      ),
      'src/overlay/panel/panel.types.ts': types(
        'Panel',
        'composite',
        'export interface TriggerProps {}\nexport interface ContentProps {}',
      ),
      'src/overlay/panel/panel.recipe.ts': `export const panelRecipe = defineRecipe('panel', { base: { root: '' } })`,
    })

    const registry = await loadRegistry(root)
    expect(registry.map((entry) => entry.name)).toEqual(['Demo', 'Panel'])
    expect(registry[1]?.parts.map((part) => part.name)).toEqual([
      'Panel',
      'Panel.Trigger',
      'Panel.Content',
    ])
  })

  test('supports the explicit Form factory exception', async () => {
    const root = await createFileFixture({
      'docs/pages/components/(form)/form/index.mdx': page('src/form/form/form'),
      'src/form/form/form.types.ts': types('Form', 'single', 'export interface FieldProps {}'),
      'src/form/form/form.recipe.ts': `export const formRecipe = defineRecipe('form', { base: { root: '' } })`,
    })
    const [form] = await loadRegistry(root)
    expect(form?.parts.map((part) => part.name)).toEqual(['form.Form', 'form.Field'])
    expect(form?.parts[0]?.access).toEqual({
      kind: 'factory-member',
      factory: 'createForm',
      member: 'Form',
    })
  })

  test.each([
    {
      name: 'missing types',
      files: { 'docs/pages/components/(general)/demo/index.mdx': page('src/element/demo/demo') },
      error: 'Missing types file',
    },
    {
      name: 'missing recipe for styled component',
      files: {
        'docs/pages/components/(general)/demo/index.mdx': page('src/element/demo/demo'),
        'src/element/demo/demo.types.ts': types('Demo', 'single'),
      },
      error: 'Missing recipe file',
    },
    {
      name: 'unknown part',
      files: {
        'docs/pages/components/(overlay)/panel/index.mdx': page(
          'src/overlay/panel/panel',
          '[Trigger]',
        ),
        'src/overlay/panel/panel.types.ts': types('Panel', 'composite'),
        'src/overlay/panel/panel.recipe.ts': `export const panelRecipe = defineRecipe('panel', { base: { root: '' } })`,
      },
      error: 'Unknown part "Trigger"',
    },
  ])('rejects $name', async ({ files, error }) => {
    const root = await createFileFixture(files as unknown as Record<string, string>)
    await expect(loadRegistry(root)).rejects.toThrow(error)
  })

  test('rejects duplicate keys and duplicate component registrations', async () => {
    const shared = {
      'src/element/demo/demo.types.ts': types('Demo', 'single'),
      'src/element/demo/demo.recipe.ts': `export const demoRecipe = defineRecipe('demo', { base: { root: '' } })`,
    }
    const duplicateKeys = await createFileFixture({
      ...shared,
      'docs/pages/components/(general)/demo/index.mdx': page('src/element/demo/demo'),
      'docs/pages/components/(form)/demo/index.mdx': page('src/element/demo/demo'),
    })
    await expect(loadRegistry(duplicateKeys)).rejects.toThrow('Duplicate API page key "demo"')

    const duplicateComponent = await createFileFixture({
      ...shared,
      'docs/pages/components/(general)/demo/index.mdx': page('src/element/demo/demo'),
      'docs/pages/components/(general)/other/index.mdx': page('src/element/demo/demo'),
    })
    await expect(loadRegistry(duplicateComponent)).rejects.toThrow(
      'registered by more than one docs page',
    )
  })
})
