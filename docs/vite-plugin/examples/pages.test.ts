import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { buildExamplePageEntries, buildExamplePagesModuleCode, scanExamplePages } from './pages'

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'moraine-example-pages-'))
}

describe('scanExamplePages', () => {
  test('collects page key/group from docs/pages markdown tree', async () => {
    const projectRoot = await createTempProject()
    await mkdir(path.join(projectRoot, 'docs/pages/form/input-number'), { recursive: true })
    await mkdir(path.join(projectRoot, 'docs/pages/overlay/toast'), { recursive: true })

    await writeFile(path.join(projectRoot, 'docs/pages/intro.md'), '# Intro', 'utf8')
    await writeFile(
      path.join(projectRoot, 'docs/pages/form/input-number/input-number.md'),
      ':::docs-header\nstatus: NEW\n:::\n\n# InputNumber',
      'utf8',
    )
    await writeFile(
      path.join(projectRoot, 'docs/pages/overlay/toast/toast.md'),
      ':::docs-header\nstatus: unrelease\n:::\n\n# Toast',
      'utf8',
    )

    expect(await scanExamplePages(projectRoot)).toEqual([
      { key: 'intro', importPath: './pages/intro.md' },
      {
        key: 'input-number',
        group: 'form',
        status: 'new',
        importPath: './pages/form/input-number/input-number.md',
      },
      {
        key: 'toast',
        group: 'overlay',
        status: 'unreleased',
        importPath: './pages/overlay/toast/toast.md',
      },
    ])

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('reads status from first docs-header block only', async () => {
    const projectRoot = await createTempProject()
    await mkdir(path.join(projectRoot, 'docs/pages/form/input'), { recursive: true })

    await writeFile(
      path.join(projectRoot, 'docs/pages/form/input/input.md'),
      [
        ':::docs-header',
        'status: update',
        ':::',
        '',
        ':::docs-header',
        'status: new',
        ':::',
      ].join('\n'),
      'utf8',
    )

    expect(await scanExamplePages(projectRoot)).toEqual([
      {
        key: 'input',
        group: 'form',
        status: 'update',
        importPath: './pages/form/input/input.md',
      },
    ])

    await rm(projectRoot, { recursive: true, force: true })
  })
})

describe('buildExamplePagesModuleCode', () => {
  test('emits lazy exampleMap and pages exports', () => {
    const code = buildExamplePagesModuleCode([
      { key: 'intro', label: 'Intro', importPath: './pages/intro.md' },
      {
        key: 'input',
        group: 'form',
        label: 'Input',
        status: 'update',
        importPath: './pages/form/input.md',
      },
    ])

    expect(code).toContain("import { lazy } from 'solid-js'")
    expect(code).toContain('export const exampleMap')
    expect(code).toContain("'intro': lazy(() => import('./pages/intro.md'))")
    expect(code).toContain("'input': lazy(() => import('./pages/form/input.md'))")
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
          importPath: './pages/form/multi-select/multi-select.md',
        },
        { key: 'typescript', importPath: './pages/typescript.md' },
        { key: 'style-setup', importPath: './pages/style-setup.md' },
      ],
      new Map([['multi-select', 'MultiSelect']]),
    )

    expect(pages).toEqual([
      {
        key: 'multi-select',
        group: 'form',
        label: 'MultiSelect',
        status: 'new',
        importPath: './pages/form/multi-select/multi-select.md',
      },
      {
        key: 'typescript',
        label: 'TypeScript',
        importPath: './pages/typescript.md',
      },
      {
        key: 'style-setup',
        label: 'Style Setup',
        importPath: './pages/style-setup.md',
      },
    ])
  })
})
