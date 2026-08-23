// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { resolveDocsPageContext } from './core/paths.ts'
import { createDocsRouteInfo, scanDocsRoutes } from './routes.ts'

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
      await writeProjectFile(projectRoot, 'docs/pages/index.mdx', pageSource('Intro', 10))
      await writeProjectFile(
        projectRoot,
        'docs/pages/(general)/button/index.mdx',
        pageSource('Button', 20, 'New'),
      )

      expect(scanDocsRoutes(projectRoot)).toMatchObject([
        { info: { key: 'introduction', title: 'Intro' }, routePath: 'index.tsx' },
        {
          info: { key: 'button', group: 'general', api: 'button', badge: 'New' },
          routePath: path.join('(general)', 'button', 'index.tsx'),
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
        'docs/pages/(general)/button/index.mdx',
        pageSource('Button', 10),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/(general)/input/index.mdx',
        pageSource('Input', 10),
      )

      expect(() => scanDocsRoutes(projectRoot)).toThrow('duplicate sidebar.order 10')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('resolves root index pages and pathless groups like the file router', () => {
    expect(resolveDocsPageContext('/tmp/docs/pages/index.mdx')).toMatchObject({
      pageKey: 'introduction',
      group: undefined,
      relativePath: 'index.mdx',
    })
    expect(resolveDocsPageContext('/tmp/docs/pages/(general)/button/index.mdx')).toMatchObject({
      pageKey: 'button',
      group: 'general',
      relativePath: '(general)/button/index.mdx',
    })
  })

  test('builds route metadata independently from provider paths', () => {
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
  })
})
