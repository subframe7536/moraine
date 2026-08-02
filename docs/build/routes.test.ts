// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import type { DocsPageContext } from './core/paths'
import { createDocsRouteInfo, docsRoutePath, scanDocsRoutes } from './routes'

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'moraine-docs-routes-'))
}

async function writeProjectFile(projectRoot: string, filePath: string, content: string) {
  const absolutePath = path.join(projectRoot, filePath)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content, 'utf8')
}

function pageSource(title: string, order: number, badge?: string): string {
  return `---
title: ${title}
description: ${title} page description.
sidebar:
  order: ${order}${badge ? `\n  badge: ${badge}` : ''}
search:
  tags: [${title.toLowerCase()}, docs]
---
`
}

describe('docs route metadata', () => {
  test('scans mdx pages into metadata and logical provider paths', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(
        projectRoot,
        'docs/pages/_api-index.json',
        JSON.stringify({ components: [{ key: 'button', name: 'Button' }] }),
      )
      await writeProjectFile(projectRoot, 'docs/pages/introduction.mdx', pageSource('Intro', 10))
      await writeProjectFile(
        projectRoot,
        'docs/pages/general/button/button.mdx',
        pageSource('Button', 20, 'New'),
      )

      expect(scanDocsRoutes(projectRoot)).toMatchObject([
        { info: { key: 'introduction', title: 'Intro' }, routePath: 'index.tsx' },
        {
          info: { key: 'button', group: 'general', api: 'button', badge: 'New' },
          routePath: path.join('(general)', 'button.tsx'),
        },
      ])
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('rejects duplicate sidebar orders within a group', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(projectRoot, 'docs/pages/_api-index.json', '{"components":[]}')
      await writeProjectFile(
        projectRoot,
        'docs/pages/general/button/button.mdx',
        pageSource('Button', 10),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/general/input/input.mdx',
        pageSource('Input', 10),
      )

      expect(() => scanDocsRoutes(projectRoot)).toThrow('duplicate sidebar.order 10')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('builds route metadata and path independently for provider callbacks', () => {
    expect(
      createDocsRouteInfo(
        'button',
        'general',
        {
          title: 'Button',
          description: 'Button description.',
          sidebar: { order: 1 },
          search: { tags: ['button'] },
        },
        new Set(['button']),
      ),
    ).toEqual({
      key: 'button',
      title: 'Button',
      description: 'Button description.',
      order: 1,
      tags: ['button'],
      group: 'general',
      api: 'button',
    })
    const page: DocsPageContext = {
      absolutePath: '/tmp/docs/pages/introduction.mdx',
      docsRoot: '/tmp/docs',
      pagesRoot: '/tmp/docs/pages',
      relativePath: 'introduction.mdx',
      pageKey: 'introduction',
      runtimeImportPath: './pages/introduction.mdx',
    }
    expect(docsRoutePath(page)).toBe('index.tsx')
  })
})
