import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { buildDemoPagesModuleCode, scanDemoPages } from './demo-pages'

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'flint-ui-demo-pages-'))
}

describe('scanDemoPages', () => {
  test('collects page key/group from docs/pages tree', async () => {
    const projectRoot = await createTempProject()
    await mkdir(path.join(projectRoot, 'docs/pages/form'), { recursive: true })
    await mkdir(path.join(projectRoot, 'docs/pages/overlay'), { recursive: true })

    await writeFile(
      path.join(projectRoot, 'docs/pages/intro.tsx'),
      'export default () => null',
      'utf8',
    )
    await writeFile(
      path.join(projectRoot, 'docs/pages/form/input-number-demos.tsx'),
      'export default () => null',
      'utf8',
    )
    await writeFile(
      path.join(projectRoot, 'docs/pages/overlay/toast-demos.tsx'),
      'export default () => null',
      'utf8',
    )

    const pages = await scanDemoPages(projectRoot)

    expect(pages).toEqual([
      { key: 'intro', importPath: './pages/intro' },
      { key: 'input-number', group: 'form', importPath: './pages/form/input-number-demos' },
      { key: 'toast', group: 'overlay', importPath: './pages/overlay/toast-demos' },
    ])

    await rm(projectRoot, { recursive: true, force: true })
  })
})

describe('buildDemoPagesModuleCode', () => {
  test('emits lazy demoMap and pages exports', () => {
    const code = buildDemoPagesModuleCode([
      { key: 'intro', importPath: './pages/intro' },
      { key: 'input', group: 'form', importPath: './pages/form/input-demos' },
    ])

    expect(code).toContain("import { lazy } from 'solid-js'")
    expect(code).toContain('export const demoMap')
    expect(code).toContain("'intro': lazy(() => import('./pages/intro'))")
    expect(code).toContain("'input': lazy(() => import('./pages/form/input-demos'))")
    expect(code).toContain('export const pages')
    expect(code).toContain("{ key: 'intro' }")
    expect(code).toContain("{ key: 'input', group: 'form' }")
  })
})
