// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test, vi } from 'vitest'

import { resolveDocsPageContext } from './core/paths.ts'
import { createDocsRouteInfo, scanDocsRoutes } from './routes.ts'

vi.mock('virtual:routes', () => ({
  routeInfo: {
    '/': {},
    '/docs/getting-started': {
      key: 'getting-started',
      surface: 'docs',
      section: 'overview',
      routePath: '/docs/getting-started',
      markdownPath: '/docs/getting-started.md',
      title: 'Getting Started',
      description: 'Setup.',
      order: 1,
      tags: ['installation'],
    },
    '/components/button': {
      key: 'button',
      surface: 'components',
      section: 'general',
      routePath: '/components/button',
      markdownPath: '/components/button.md',
      title: 'Button',
      description: 'Button description.',
      order: 1,
      tags: ['button'],
      sections: [
        { id: 'usage', label: 'Usage', level: 2 },
        null,
        { id: '', label: 'Missing ID', level: 2 },
      ],
    },
  },
}))

function pageSource(title: string, order: number): string {
  return `---\ntitle: ${title}\ndescription: ${title} page description.\nsidebar:\n  order: ${order}\nsearch:\n  tags: [docs]\n---\n`
}

async function writeProjectFile(projectRoot: string, relative: string, content: string) {
  const file = path.join(projectRoot, relative)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, content)
}

describe('docs route metadata', () => {
  test('resolves canonical paths for both surfaces and pathless groups', () => {
    const cases = [
      ['docs/(overview)/getting-started.mdx', 'docs', 'overview', '/docs/getting-started'],
      ['docs/(styling)/design.mdx', 'docs', 'styling', '/docs/design'],
      ['docs/(guides)/composition.mdx', 'docs', 'guides', '/docs/composition'],
      ['docs/utils/class-merging.mdx', 'docs', 'utils', '/docs/utils/class-merging'],
      ['components/index.mdx', 'components', 'overview', '/components'],
      ['components/(general)/button/index.mdx', 'components', 'general', '/components/button'],
    ] as const
    for (const [relative, surface, section, routePath] of cases) {
      expect(resolveDocsPageContext(`/tmp/docs/pages/${relative}`)).toMatchObject({
        surface,
        section,
        routePath,
        markdownPath: `${routePath}.md`,
      })
    }
    expect(() => resolveDocsPageContext('/tmp/docs/pages/index.mdx')).toThrow(
      'reserved for the landing route',
    )
  })

  test('filters malformed sections and sorts pages across surfaces', async () => {
    const { getDocsPages } = await import('../routes/docs-route.ts')
    expect(getDocsPages()).toMatchObject([
      { path: '/docs/getting-started', surface: 'docs', sections: [] },
      {
        path: '/components/button',
        surface: 'components',
        sections: [{ id: 'usage', label: 'Usage', level: 2 }],
      },
    ])
  })

  test('scans pages and rejects duplicate order within one section', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-docs-routes-'))
    try {
      await writeProjectFile(
        projectRoot,
        'docs/pages/_api-index.json',
        '{"components":[{"key":"button","name":"Button"}]}',
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/docs/(overview)/getting-started.mdx',
        pageSource('Getting Started', 1),
      )
      await writeProjectFile(
        projectRoot,
        'docs/pages/components/(general)/button/index.mdx',
        pageSource('Button', 1),
      )
      expect(scanDocsRoutes(projectRoot)).toMatchObject([
        { info: { surface: 'docs', routePath: '/docs/getting-started' } },
        {
          info: {
            surface: 'components',
            section: 'general',
            routePath: '/components/button',
            api: 'button',
          },
        },
      ])
      await writeProjectFile(
        projectRoot,
        'docs/pages/components/(general)/badge/index.mdx',
        pageSource('Badge', 1),
      )
      expect(() => scanDocsRoutes(projectRoot)).toThrow('duplicate sidebar.order 1')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('preserves sections on canonical metadata', () => {
    const page = resolveDocsPageContext('/tmp/docs/pages/components/(general)/button/index.mdx')
    const info = createDocsRouteInfo(
      page,
      {
        title: 'Button',
        description: 'Actions.',
        sidebar: { order: 1 },
        search: { tags: ['button'] },
      },
      new Set(['button']),
      [{ id: 'usage', label: 'Usage', level: 2 }],
    )
    expect(info).toMatchObject({
      key: 'button',
      surface: 'components',
      section: 'general',
      routePath: '/components/button',
      markdownPath: '/components/button.md',
      api: 'button',
      sections: [{ id: 'usage' }],
    })
  })
})
