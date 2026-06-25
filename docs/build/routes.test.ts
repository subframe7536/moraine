// @vitest-environment node

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { getDocsPrerenderRoutes, scanDocsRoutes, writeGeneratedRoutes } from './routes'

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

  test('writes generated routes and returns prerender paths', async () => {
    const projectRoot = await createTempProject()

    try {
      await writeProjectFile(projectRoot, 'docs/pages/_api-index.json', '{"components":[]}')
      await writeProjectFile(projectRoot, 'docs/pages/introduction.mdx', '# Intro\n')
      await writeProjectFile(projectRoot, 'docs/pages/general/button/button.mdx', '# Button\n')

      const routes = writeGeneratedRoutes(projectRoot)
      expect(routes.map((route) => route.info.key)).toEqual(['introduction', 'button'])

      const appRoute = await readFile(
        path.join(projectRoot, 'docs/.generated/pages/_app.tsx'),
        'utf8',
      )
      const buttonRoute = await readFile(
        path.join(projectRoot, 'docs/.generated/pages/(general)/button.tsx'),
        'utf8',
      )

      expect(appRoute).toContain('DocsAppLayout')
      expect(buttonRoute).toContain("import { Suspense, lazy } from 'solid-js'")
      expect(buttonRoute).toContain("key\": \"button")
      expect(buttonRoute).toContain('import.meta.env.SSR')
      expect(getDocsPrerenderRoutes(projectRoot)).toEqual(['/', '/button'])
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
