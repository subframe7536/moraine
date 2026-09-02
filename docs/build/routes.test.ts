// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test, vi } from 'vitest'

import { resolveDocsPageContext } from './core/paths'
import { createDocsRouteInfo, scanDocsRoutes } from './routes'

vi.mock('virtual:routes', () => ({
  routeInfo: {
    '/button': {
      key: 'button',
      title: 'Button',
      description: 'Button description.',
      order: 1,
      tags: ['button'],
      sections: [
        { id: 'usage', label: 'Usage', level: 2 },
        null,
        { id: '', label: 'Missing ID', level: 2 },
        { id: 'invalid-level', label: 'Invalid level', level: 7 },
      ],
    },
    '/input': {
      key: 'input',
      title: 'Input',
      description: 'Input description.',
      order: 2,
      tags: ['input'],
      sections: [null, { id: 'label', label: 'Label', level: '2' }],
    },
  },
}))

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
  test('retains valid pages while dropping malformed optional section entries', async () => {
    const { getDocsPages } = await import('../routes/docs-route')

    expect(getDocsPages()).toMatchObject([
      {
        key: 'button',
        path: '/button',
        sections: [{ id: 'usage', label: 'Usage', level: 2 }],
      },
      {
        key: 'input',
        path: '/input',
        sections: [],
      },
    ])
  })

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
          routePath: path.posix.join('(general)', 'button', 'index.tsx'),
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

  test('includes non-empty document sections without changing other metadata', () => {
    expect(
      createDocsRouteInfo(
        'button',
        'general',
        {
          title: 'Button',
          description: 'Button description.',
          sidebar: { order: 1, badge: 'New' },
          search: { tags: ['button'] },
        },
        new Set(['button']),
        [
          { id: 'usage', label: 'Usage', level: 2 },
          { id: 'usage-1', label: 'Usage', level: 2 },
        ],
      ),
    ).toEqual({
      key: 'button',
      title: 'Button',
      description: 'Button description.',
      order: 1,
      tags: ['button'],
      group: 'general',
      badge: 'New',
      api: 'button',
      sections: [
        { id: 'usage', label: 'Usage', level: 2 },
        { id: 'usage-1', label: 'Usage', level: 2 },
      ],
    })
  })

  test('omits empty document sections from route metadata', () => {
    expect(
      createDocsRouteInfo(
        'button',
        undefined,
        {
          title: 'Button',
          description: 'Button description.',
          sidebar: { order: 1 },
          search: { tags: ['button'] },
        },
        new Set(),
        [],
      ),
    ).not.toHaveProperty('sections')
  })
})
