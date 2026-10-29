// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { scanDocsPages } from '../routes.ts'
import { createFileFixture } from '../test-util/file-fixture.ts'

import { loadApiRegistry } from './registry.ts'

function page(path: string, parts?: string) {
  return `---
title: Demo
description: Demo page.
group: Action
api:
  path: ${path}
  ${parts ? `parts: ${parts}` : ''}
search:
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
      'docs/pages/components/demo/index.mdx': page('src/components/demo/demo'),
      'src/components/demo/demo.types.ts': types('Demo', 'single'),
      'src/components/demo/demo.recipe.ts': `export const demoRecipe = defineRecipe('demo', { base: { root: '' } })`,
      'docs/pages/components/panel/index.mdx': page(
        'src/components/panel/panel',
        '[Trigger, Content]',
      ),
      'src/components/panel/panel.types.ts': types(
        'Panel',
        'composite',
        'export interface TriggerProps {}\nexport interface ContentProps {}',
      ),
      'src/components/panel/panel.recipe.ts': `export const panelRecipe = defineRecipe('panel', { base: { root: '' } })`,
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
      'docs/pages/components/form/index.mdx': page('src/components/form/form'),
      'src/components/form/form.types.ts': types(
        'Form',
        'single',
        'export interface FieldProps {}',
      ),
      'src/components/form/form.recipe.ts': `export const formRecipe = defineRecipe('form', { base: { root: '' } })`,
    })
    const [form] = await loadRegistry(root)
    expect(form?.parts.map((part) => part.name)).toEqual(['form.Form', 'form.Field'])
    expect(form?.parts[0]?.access).toEqual({
      kind: 'factory-member',
      factory: 'createForm',
      member: 'Form',
    })
  })

  test('registers factory members declared in frontmatter for createTree', async () => {
    const root = await createFileFixture({
      'docs/pages/components/tree/index.mdx': page(
        'src/components/tree/tree',
        '[Item, ItemTrigger]',
      ),
      'src/components/tree/tree.types.ts': types(
        'Tree',
        'composite',
        'export interface ItemProps {}\nexport interface ItemTriggerProps {}',
      ),
      'src/components/tree/tree.recipe.ts': `export const treeRecipe = defineRecipe('tree', { base: { root: '' } })`,
    })
    const [tree] = await loadRegistry(root)
    expect(tree?.parts.map((part) => [part.id, part.name])).toEqual([
      ['tree-tree', 'tree.Tree'],
      ['tree-item', 'tree.Item'],
      ['tree-item-trigger', 'tree.ItemTrigger'],
    ])
    expect(tree?.parts.map((part) => part.access)).toEqual([
      { kind: 'factory-member', factory: 'createTree', member: 'Tree' },
      { kind: 'factory-member', factory: 'createTree', member: 'Item' },
      { kind: 'factory-member', factory: 'createTree', member: 'ItemTrigger' },
    ])
  })

  test('requires declared parts for the createTree composite', async () => {
    const root = await createFileFixture({
      'docs/pages/components/tree/index.mdx': page('src/components/tree/tree'),
      'src/components/tree/tree.types.ts': types('Tree', 'composite'),
      'src/components/tree/tree.recipe.ts': `export const treeRecipe = defineRecipe('tree', { base: { root: '' } })`,
    })
    await expect(loadRegistry(root)).rejects.toThrow('must declare frontmatter.api.parts')
  })

  test.each([
    {
      name: 'missing types',
      files: { 'docs/pages/components/demo/index.mdx': page('src/components/demo/demo') },
      error: 'Missing types file',
    },
    {
      name: 'missing recipe for styled component',
      files: {
        'docs/pages/components/demo/index.mdx': page('src/components/demo/demo'),
        'src/components/demo/demo.types.ts': types('Demo', 'single'),
      },
      error: 'Missing recipe file',
    },
    {
      name: 'unknown part',
      files: {
        'docs/pages/components/panel/index.mdx': page('src/components/panel/panel', '[Trigger]'),
        'src/components/panel/panel.types.ts': types('Panel', 'composite'),
        'src/components/panel/panel.recipe.ts': `export const panelRecipe = defineRecipe('panel', { base: { root: '' } })`,
      },
      error: 'Unknown part "Trigger"',
    },
  ])('rejects $name', async ({ files, error }) => {
    const root = await createFileFixture(files as unknown as Record<string, string>)
    await expect(loadRegistry(root)).rejects.toThrow(error)
  })

  test('rejects duplicate keys and duplicate component registrations', async () => {
    const shared = {
      'src/components/demo/demo.types.ts': types('Demo', 'single'),
      'src/components/demo/demo.recipe.ts': `export const demoRecipe = defineRecipe('demo', { base: { root: '' } })`,
    }
    const duplicateKeys = await createFileFixture({
      ...shared,
      'docs/pages/components/demo/index.mdx': page('src/components/demo/demo'),
      'docs/pages/components/demo.mdx': page('src/components/demo/demo'),
    })
    await expect(loadRegistry(duplicateKeys)).rejects.toThrow('Duplicate API page key "demo"')

    const duplicateComponent = await createFileFixture({
      ...shared,
      'docs/pages/components/demo/index.mdx': page('src/components/demo/demo'),
      'docs/pages/components/other/index.mdx': page('src/components/demo/demo'),
    })
    await expect(loadRegistry(duplicateComponent)).rejects.toThrow(
      'registered by more than one docs page',
    )
  })
})
