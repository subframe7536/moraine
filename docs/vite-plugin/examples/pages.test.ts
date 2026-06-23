// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { buildExamplePageEntries, buildExamplePagesModuleCode, scanExamplePages } from './pages'

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'moraine-example-pages-'))
}

describe('scanExamplePages', () => {
  test('collects page key/group from docs/pages mdx tree', async () => {
    const projectRoot = await createTempProject()
    await mkdir(path.join(projectRoot, 'docs/pages/form/input-number'), { recursive: true })
    await mkdir(path.join(projectRoot, 'docs/pages/overlay/toast'), { recursive: true })

    await writeFile(path.join(projectRoot, 'docs/pages/intro.mdx'), '# Intro', 'utf8')
    await writeFile(
      path.join(projectRoot, 'docs/pages/form/input-number/input-number.mdx'),
      '<DocsHeader status="NEW" />\n\n# InputNumber',
      'utf8',
    )
    await writeFile(
      path.join(projectRoot, 'docs/pages/overlay/toast/toast.mdx'),
      '<DocsHeader status="unrelease" />\n\n# Toast',
      'utf8',
    )

    expect(await scanExamplePages(projectRoot)).toEqual([
      { key: 'intro', importPath: './pages/intro.mdx' },
      {
        key: 'input-number',
        group: 'form',
        status: 'new',
        importPath: './pages/form/input-number/input-number.mdx',
      },
      {
        key: 'toast',
        group: 'overlay',
        status: 'unreleased',
        importPath: './pages/overlay/toast/toast.mdx',
      },
    ])

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('reads status from first DocsHeader component only', async () => {
    const projectRoot = await createTempProject()
    await mkdir(path.join(projectRoot, 'docs/pages/form/input'), { recursive: true })

    await writeFile(
      path.join(projectRoot, 'docs/pages/form/input/input.mdx'),
      ['<DocsHeader status="update" />', '', '<DocsHeader status="new" />'].join('\n'),
      'utf8',
    )

    expect(await scanExamplePages(projectRoot)).toEqual([
      {
        key: 'input',
        group: 'form',
        status: 'update',
        importPath: './pages/form/input/input.mdx',
      },
    ])

    await rm(projectRoot, { recursive: true, force: true })
  })
})

describe('buildExamplePagesModuleCode', () => {
  test('emits lazy exampleMap and pages exports', () => {
    const code = buildExamplePagesModuleCode([
      { key: 'intro', label: 'Intro', importPath: './pages/intro.mdx' },
      {
        key: 'input',
        group: 'form',
        label: 'Input',
        status: 'update',
        importPath: './pages/form/input.mdx',
      },
    ])

    expect(code).toContain("import { lazy } from 'solid-js'")
    expect(code).toContain('export const exampleMap')
    expect(code).toContain("'intro': lazy(() => import('./pages/intro.mdx'))")
    expect(code).toContain("'input': lazy(() => import('./pages/form/input.mdx'))")
    expect(code).toContain('export const pages')
    expect(code).toContain("{ key: 'intro', label: 'Intro' }")
    expect(code).toContain("{ key: 'input', group: 'form', label: 'Input', status: 'update' }")
  })
})

describe('buildExamplePageEntries', () => {
  test('prefers component names, then overrides, then title case labels', () => {
    const pages = buildExamplePageEntries(
      [
        {
          key: 'multi-select',
          group: 'form',
          status: 'new',
          importPath: './pages/form/multi-select/multi-select.mdx',
        },
        { key: 'typescript', importPath: './pages/typescript.mdx' },
        { key: 'style-setup', importPath: './pages/style-setup.mdx' },
      ],
      new Map([['multi-select', 'MultiSelect']]),
    )

    expect(pages).toEqual([
      {
        key: 'multi-select',
        group: 'form',
        label: 'MultiSelect',
        status: 'new',
        importPath: './pages/form/multi-select/multi-select.mdx',
      },
      {
        key: 'typescript',
        label: 'TypeScript',
        importPath: './pages/typescript.mdx',
      },
      {
        key: 'style-setup',
        label: 'Style Setup',
        importPath: './pages/style-setup.mdx',
      },
    ])
  })
})
