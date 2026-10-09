// @vitest-environment node

import { describe, expect, test, vi } from 'vitest'

import type { ComponentApi } from '../api-doc/types.ts'

import { createDocsMdxOptions } from './page.ts'

const BUTTON_API_DOC: ComponentApi = {
  key: 'button',
  name: 'Button',
  kind: 'single',
  parts: [
    {
      id: 'button',
      name: 'Button',
      access: { kind: 'export', name: 'Button' },
      props: [
        {
          name: 'variant',
          optional: true,
          type: 'string',
        },
      ],
    },
  ],
  slots: [],
  dataAttributes: [],
}

vi.mock('../api-doc/load.ts', () => ({
  loadApiDocIndex: () => ({
    components: [
      {
        key: BUTTON_API_DOC.key,
        name: BUTTON_API_DOC.name,
        category: 'element',
      },
    ],
  }),
  loadComponentApiDoc: (sourcePath: string) =>
    /[\\/]button[\\/]/.test(sourcePath) ? BUTTON_API_DOC : null,
}))

const FRONTMATTER = {
  title: 'Button',
  description: 'Button description.',
  sidebar: { order: 10 },
  search: { tags: ['action'] },
}

describe('createDocsMdxOptions', () => {
  test('uses the default MDX route path resolver', () => {
    const projectRoot = '/tmp/moraine-project'
    const options = createDocsMdxOptions(projectRoot)

    expect(options.transformPath).toBeUndefined()
  })

  test('extends the built-in MDX route with docs metadata and layout content', async () => {
    const projectRoot = '/tmp/moraine-project'
    const options = createDocsMdxOptions(projectRoot)
    const extension = await options.extendLoad?.(
      {
        source: '## Usage\n\nUse Button.',
        code: 'function MDXContent() {}',
        component: 'MDXContent',
        frontmatter: FRONTMATTER,
        routeConfig: {},
        data: { __moraineOnThisPageEntries: [{ id: 'button', label: 'Button', level: 1 }] },
      },
      {
        path: 'components/(general)/button/index.tsx',
        routeId: '/components/button',
        sourcePath: 'pages/components/(general)/button/index.mdx',
        moduleId: '/tmp/button.mdx.solid-file-router.tsx',
      },
    )

    expect(extension?.routeConfig?.info).toMatchObject({
      key: 'button',
      title: 'Button',
      order: 10,
      surface: 'components',
      section: 'general',
      markdownPath: '/components/button.md',
      sections: [
        { id: 'button', label: 'Button', level: 1 },
        { id: 'api-reference', label: 'API Reference', level: 1 },
        { id: 'api-props', label: 'Props', level: 2 },
      ],
    })
    expect(extension?.routeConfig?.metadata).toEqual({
      title: 'Button | Moraine',
      description: 'Button description.',
      canonical: 'https://moraine.subf.dev/components/button',
      meta: [
        { property: 'og:title', content: 'Button | Moraine' },
        { property: 'og:description', content: 'Button description.' },
        { property: 'og:url', content: 'https://moraine.subf.dev/components/button' },
        { name: 'twitter:title', content: 'Button | Moraine' },
        { name: 'twitter:description', content: 'Button description.' },
      ],
    })
    expect(extension?.mdxContent).toContain('<components.Markdown')
    expect(extension?.mdxContent).toContain('<MDXContent {...props} />')
    expect(extension?.mdxContent).toContain('metadata={')
    expect(extension?.mdxContent).toContain('markdownPath={"/components/button.md"}')
  })

  test('adds generated API sections after MDX headings', async () => {
    const options = createDocsMdxOptions('/tmp/moraine-project')
    const extension = await options.extendLoad?.(
      {
        source: '## Anatomy\n\n<Anatomy value={{root: {noDom: true}}} />',
        code: 'function MDXContent() {}',
        component: 'MDXContent',
        frontmatter: FRONTMATTER,
        routeConfig: {},
        data: { __moraineOnThisPageEntries: [{ id: 'usage', label: 'Usage', level: 1 }] },
      },
      {
        path: 'components/(general)/button/index.tsx',
        routeId: '/components/button',
        sourcePath: 'pages/components/(general)/button/index.mdx',
        moduleId: '/tmp/button.mdx.solid-file-router.tsx',
      },
    )

    expect(extension?.routeConfig?.info).toMatchObject({
      sections: [
        { id: 'usage', label: 'Usage', level: 1 },
        { id: 'api-reference', label: 'API Reference', level: 1 },
        { id: 'api-props', label: 'Props', level: 2 },
      ],
    })
  })

  test('preserves MDX heading metadata for pages without an API document', async () => {
    const options = createDocsMdxOptions('/tmp/moraine-project')
    const extension = await options.extendLoad?.(
      {
        source: '## Anatomy\n\n<Anatomy value={{root: {noDom: true}}} />',
        code: 'function MDXContent() {}',
        component: 'MDXContent',
        frontmatter: FRONTMATTER,
        routeConfig: {},
        data: { __moraineOnThisPageEntries: [{ id: 'usage', label: 'Usage', level: 1 }] },
      },
      {
        path: 'components/(form)/input/index.tsx',
        routeId: '/components/input',
        sourcePath: 'pages/components/(form)/input/index.mdx',
        moduleId: '/tmp/input.mdx.solid-file-router.tsx',
      },
    )

    expect(extension?.routeConfig?.info).toMatchObject({
      key: 'input',
      sections: [{ id: 'usage', label: 'Usage', level: 1 }],
    })
  })

  test('uses ordinary documentation metadata for Getting Started', async () => {
    const extension = await createDocsMdxOptions('/tmp/moraine-project').extendLoad?.(
      {
        source: '## Install',
        code: 'function MDXContent() {}',
        component: 'MDXContent',
        frontmatter: {
          title: 'Getting Started',
          description: 'Install Moraine.',
          sidebar: { order: 1 },
          search: { tags: ['installation'] },
        },
        routeConfig: {},
        data: {},
      },
      {
        path: 'docs/(overview)/getting-started.tsx',
        routeId: '/docs/getting-started',
        sourcePath: 'pages/docs/(overview)/getting-started.mdx',
        moduleId: '/tmp/start.mdx.solid-file-router.tsx',
      },
    )

    expect(extension?.routeConfig?.info).toMatchObject({
      key: 'getting-started',
      title: 'Getting Started',
    })
    expect(extension?.routeConfig?.metadata).toMatchObject({
      title: 'Getting Started | Moraine',
      canonical: 'https://moraine.subf.dev/docs/getting-started',
    })
  })
})
