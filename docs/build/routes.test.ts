// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import path from 'pathe'
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
      section: 'action',
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

function pageSource(title: string, order?: number, group = 'Action'): string {
  const sidebar = order !== undefined ? `sidebar:\n  order: ${order}\n` : ''
  return `---\ntitle: ${title}\ndescription: ${title} page description.\ngroup: ${group}\n${sidebar}search:\n  tags: [docs]\n---\n`
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
      ['docs/(styling)/class-merging.mdx', 'docs', 'styling', '/docs/class-merging'],
      ['docs/(guides)/composition.mdx', 'docs', 'guides', '/docs/composition'],
      ['docs/(guides)/virtualization.mdx', 'docs', 'guides', '/docs/virtualization'],
      ['hooks/index.mdx', 'hooks', 'overview', '/hooks'],
      ['hooks/create-slider.mdx', 'hooks', 'hooks', '/hooks/create-slider'],
      ['components/index.mdx', 'components', 'overview', '/components'],
      ['components/button/index.mdx', 'components', 'components', '/components/button'],
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
        'docs/pages/components/button/index.mdx',
        pageSource('Button', undefined, 'Action'),
      )
      expect(scanDocsRoutes(projectRoot)).toMatchObject([
        { info: { surface: 'docs', routePath: '/docs/getting-started' } },
        {
          info: {
            surface: 'components',
            section: 'action',
            routePath: '/components/button',
            api: 'button',
          },
        },
      ])
      await writeProjectFile(
        projectRoot,
        'docs/pages/docs/(overview)/installation.mdx',
        pageSource('Installation', 1),
      )
      expect(() => scanDocsRoutes(projectRoot)).toThrow('duplicate sidebar.order 1')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  test('preserves sections on canonical metadata', () => {
    const page = resolveDocsPageContext('/tmp/docs/pages/components/button/index.mdx')
    const info = createDocsRouteInfo(
      page,
      {
        title: 'Button',
        description: 'Actions.',
        group: 'Action',
        sidebar: { order: 1 },
        search: { tags: ['button'] },
      },
      new Set(['button']),
      [{ id: 'usage', label: 'Usage', level: 2 }],
    )
    expect(info).toMatchObject({
      key: 'button',
      surface: 'components',
      section: 'action',
      routePath: '/components/button',
      markdownPath: '/components/button.md',
      api: 'button',
      sections: [{ id: 'usage' }],
    })
  })

  test('scans repository styling routes preserving sidebar order with class-merging included', () => {
    const scanned = scanDocsRoutes(process.cwd()).filter((r) => r.info.section === 'styling')
    expect(scanned.map((r) => r.info.key)).toEqual([
      'design',
      'customization',
      'theming',
      'icons',
      'animations',
      'class-merging',
    ])
  })

  test('scans repository hooks routes with hooks index first and remainder alphabetically', () => {
    const scanned = scanDocsRoutes(process.cwd()).filter((r) => r.info.surface === 'hooks')
    expect(scanned.map((r) => r.info.key)).toEqual([
      'hooks',
      'create-base-select-search-input',
      'create-controllable-value',
      'create-copy',
      'create-disclosure-state',
      'create-event-listener',
      'create-id',
      'create-media-query',
      'create-selectable-collection-navigation',
      'create-slider',
      'create-transition-presence',
    ])
  })

  test('registers virtualization once as a guide for all route-derived consumers', () => {
    const routes = scanDocsRoutes(process.cwd())
    expect(routes.filter((route) => route.info.key === 'virtualization')).toMatchObject([
      {
        info: {
          surface: 'docs',
          section: 'guides',
          routePath: '/docs/virtualization',
          markdownPath: '/docs/virtualization.md',
          title: 'Virtualization',
        },
      },
    ])
    expect(routes.some((route) => route.info.key === 'create-list-virtualizer')).toBe(false)
  })

  test('scans repository components routes with components index first and remainder alphabetically within sections', () => {
    const scanned = scanDocsRoutes(process.cwd()).filter((r) => r.info.surface === 'components')
    expect(scanned[0]?.info.routePath).toBe('/components')
    const buttons = scanned.filter((r) => r.info.section === 'buttons')
    expect(buttons.map((r) => r.info.title)).toEqual([
      'Button',
      'ButtonGroup',
      'CopyButton',
      'ToggleButton',
    ])
    expect(buttons.map((r) => r.info.order)).toEqual([0, 1, 2, 3])
  })
})
