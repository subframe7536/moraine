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
      await writeProjectFile(projectRoot, 'docs/pages/introduction.mdx', '# Intro\n')
      await writeProjectFile(
        projectRoot,
        'docs/pages/general/button/button.mdx',
        '<DocsHeader status="new" />\n',
      )
      await writeProjectFile(projectRoot, 'docs/pages/form/input/input.mdx', '# Input\n')

      expect(scanDocsRoutes(projectRoot)).toMatchObject([
        {
          info: { key: 'introduction', title: 'Introduction' },
          routePath: 'index.tsx',
        },
        {
          info: { key: 'input', title: 'Input', group: 'form', api: 'input' },
          routePath: path.join('(form)', 'input.tsx'),
        },
        {
          info: {
            key: 'button',
            title: 'Button',
            group: 'general',
            status: 'new',
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
      await writeProjectFile(projectRoot, 'docs/pages/introduction.mdx', '# Intro\n')
      await writeProjectFile(projectRoot, 'docs/pages/general/button/button.mdx', '# Button\n')

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
      expect(buttonRoute).toContain("import { Suspense, lazy } from 'solid-js'")
      expect(buttonRoute).toContain('key": "button')
      expect(buttonRoute).toContain('import.meta.env.SSR')
      expect(notFoundRoute).toContain('DocsNotFound')
      expect(getDocsPrerenderRoutes(projectRoot)).toEqual(['/', '/button'])
      await expect(access(path.join(projectRoot, 'docs/.generated'))).rejects.toThrow()
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
