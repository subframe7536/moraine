// @vitest-environment node

import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { createDocsRouteSource, getDocsPrerenderRoutes, scanDocsRoutes } from './routes'

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

describe('docs route generation', () => {
  test('scans mdx pages into short file-router routes with metadata', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(
        projectRoot,
        'docs/pages/_api-index.json',
        JSON.stringify({
          components: [
            { key: 'button', name: 'Button' },
            { key: 'input', name: 'Input' },
          ],
        }),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/introduction.mdx',
        pageSource('Getting Started', 10),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/general/button/button.mdx',
        pageSource('Action Button', 20, 'New'),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/form/input/input.mdx',
        pageSource('Text Input', 10),
      )

      expect(scanDocsRoutes(projectRoot)).toMatchObject([
        {
          info: {
            key: 'introduction',
            title: 'Getting Started',
            description: 'Getting Started page description.',
            order: 10,
            tags: ['getting started', 'docs'],
          },
          routePath: 'index.tsx',
        },
        {
          info: { key: 'input', title: 'Text Input', group: 'form', order: 10, api: 'input' },
          routePath: path.join('(form)', 'input.tsx'),
        },
        {
          info: {
            key: 'button',
            title: 'Action Button',
            group: 'general',
            order: 20,
            badge: 'New',
            api: 'button',
          },
          routePath: path.join('(general)', 'button.tsx'),
        },
      ])
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('creates a virtual route source and returns prerender paths without generated files', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(projectRoot, 'docs/pages/_api-index.json', '{"components":[]}')
      await writeProjectFile(projectRoot, 'docs/pages/introduction.mdx', pageSource('Intro', 10))
      await writeProjectFile(
        projectRoot,
        'docs/pages/general/button/button.mdx',
        pageSource('Button', 10),
      )

      const routeSource = createDocsRouteSource(projectRoot)
      const routes =
        typeof routeSource.scan === 'function'
          ? await routeSource.scan({} as never, path.join(projectRoot, 'docs'))
          : []
      expect(routes).toMatchObject([
        {
          routeId: 'routes/_app.tsx',
          routePath: '_app.tsx',
          sourcePath: 'components/docs-app-layout.tsx',
        },
        {
          routeId: '/',
          routePath: 'index.tsx',
          sourcePath: 'pages/introduction.mdx',
        },
        {
          routeId: '/button',
          routePath: path.join('(general)', 'button.tsx'),
          sourcePath: 'pages/general/button/button.mdx',
        },
        {
          routeId: '404.tsx',
          routePath: '404.tsx',
          sourcePath: 'components/docs-not-found.tsx',
        },
      ])

      const appRoute = await routeSource.load({
        routeId: '/routes/_app.tsx',
        routePath: '_app.tsx',
        sourcePath: path.join(projectRoot, 'docs/components/docs-app-layout.tsx'),
        moduleId: path.join(
          projectRoot,
          'docs/components/docs-app-layout.tsx.solid-file-router.tsx',
        ),
      })
      const buttonRoute = await routeSource.load({
        routeId: '/button',
        routePath: path.join('(general)', 'button.tsx'),
        sourcePath: path.join(projectRoot, 'docs/pages/general/button/button.mdx'),
        moduleId: path.join(
          projectRoot,
          'docs/pages/general/button/button.mdx.solid-file-router.tsx',
        ),
      })
      const notFoundRoute = await routeSource.load({
        routeId: '/404.tsx',
        routePath: '404.tsx',
        sourcePath: path.join(projectRoot, 'docs/components/docs-not-found.tsx'),
        moduleId: path.join(
          projectRoot,
          'docs/components/docs-not-found.tsx.solid-file-router.tsx',
        ),
      })

      expect(appRoute).toContain('DocsAppLayout')
      expect(buttonRoute).toContain("import { lazy } from 'solid-js'")
      expect(buttonRoute).toContain("import { loadDocsPage } from '/components/docs-route-loading'")
      expect(buttonRoute).toContain('key": "button')
      expect(buttonRoute).toContain('component: Page')
      expect(buttonRoute).toContain("lazy(() => loadDocsPage(() => import('./button.mdx')))")
      expect(buttonRoute).not.toContain('<Suspense')
      expect(buttonRoute).not.toContain('fallback=')
      expect(notFoundRoute).toContain('DocsNotFound')
      expect(getDocsPrerenderRoutes(projectRoot)).toEqual(['/', '/button'])
      await expect(access(path.join(projectRoot, 'docs/.generated'))).rejects.toThrow()
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('reuses scanned routes when loading generated modules', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(projectRoot, 'docs/pages/_api-index.json', '{"components":[]}')
      await writeProjectFile(
        projectRoot,
        'docs/pages/general/button/button.mdx',
        pageSource('Button', 10),
      )

      const routeSource = createDocsRouteSource(projectRoot)
      if (typeof routeSource.scan === 'function') {
        await routeSource.scan({} as never, path.join(projectRoot, 'docs'))
      }
      await rm(path.join(projectRoot, 'docs/pages/general/button/button.mdx'), { force: true })

      const buttonRoute = await routeSource.load({
        routeId: '/button',
        routePath: path.join('(general)', 'button.tsx'),
        sourcePath: path.join(projectRoot, 'docs/pages/general/button/button.mdx'),
        moduleId: path.join(
          projectRoot,
          'docs/pages/general/button/button.mdx.solid-file-router.tsx',
        ),
      })

      expect(buttonRoute).toContain('key": "button')
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
        'docs/pages/general/card/card.mdx',
        pageSource('Card', 10),
      )

      expect(() => scanDocsRoutes(projectRoot)).toThrow(
        'duplicate sidebar.order 10 in group general',
      )
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
