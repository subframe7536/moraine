// @vitest-environment node

import { describe, expect, test, vi } from 'vitest'

import { createDocsMdxOptions } from './page'

const BUTTON_API_DOC = {
  component: {
    key: 'button',
    name: 'Button',
    category: 'General',
    polymorphic: false,
  },
  slots: [],
  props: {
    own: [
      {
        name: 'variant',
        required: false,
        type: 'string',
      },
    ],
    inherited: [],
  },
}

vi.mock('../api-doc/load.ts', () => ({
  loadApiDocIndex: () => ({ components: [BUTTON_API_DOC.component] }),
  loadComponentApiDoc: (_projectRoot: string, key: string) =>
    key === 'button' ? BUTTON_API_DOC : null,
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
        source: '# Button',
        code: 'function MDXContent() {}',
        component: 'MDXContent',
        frontmatter: FRONTMATTER,
        routeConfig: {},
        data: { __moraineOnThisPageEntries: [{ id: 'button', label: 'Button', level: 1 }] },
      },
      {
        path: '(general)/button/index.tsx',
        routeId: '/button',
        sourcePath: 'pages/(general)/button/index.mdx',
        moduleId: '/tmp/button.mdx.solid-file-router.tsx',
      },
    )

    expect(extension?.routeConfig?.info).toMatchObject({
      key: 'button',
      title: 'Button',
      order: 10,
      group: 'general',
      sections: [
        { id: 'button', label: 'Button', level: 1 },
        { id: 'api-reference', label: 'API', level: 1 },
        { id: 'api-props', label: 'Props', level: 2 },
      ],
    })
    expect(extension?.routeConfig?.metadata).toEqual({
      title: 'Button | Moraine',
      description: 'Button description.',
      canonical: 'https://ui.subf.dev/button',
      meta: [
        { property: 'og:title', content: 'Button | Moraine' },
        { property: 'og:description', content: 'Button description.' },
        { property: 'og:url', content: 'https://ui.subf.dev/button' },
        { name: 'twitter:title', content: 'Button | Moraine' },
        { name: 'twitter:description', content: 'Button description.' },
      ],
    })
    expect(extension?.mdxContent).toContain('<components.Markdown')
    expect(extension?.mdxContent).toContain('<MDXContent {...props} />')
    expect(extension?.mdxContent).toContain('metadata={')
  })

  test('adds generated API sections after MDX headings', async () => {
    const options = createDocsMdxOptions('/tmp/moraine-project')
    const extension = await options.extendLoad?.(
      {
        source: '## Usage',
        code: 'function MDXContent() {}',
        component: 'MDXContent',
        frontmatter: FRONTMATTER,
        routeConfig: {},
        data: { __moraineOnThisPageEntries: [{ id: 'usage', label: 'Usage', level: 1 }] },
      },
      {
        path: '(general)/button/index.tsx',
        routeId: '/button',
        sourcePath: 'pages/(general)/button/index.mdx',
        moduleId: '/tmp/button.mdx.solid-file-router.tsx',
      },
    )

    expect(extension?.routeConfig?.info).toMatchObject({
      sections: [
        { id: 'usage', label: 'Usage', level: 1 },
        { id: 'api-reference', label: 'API', level: 1 },
        { id: 'api-props', label: 'Props', level: 2 },
      ],
    })
  })

  test('preserves MDX heading metadata for pages without an API document', async () => {
    const options = createDocsMdxOptions('/tmp/moraine-project')
    const extension = await options.extendLoad?.(
      {
        source: '## Usage',
        code: 'function MDXContent() {}',
        component: 'MDXContent',
        frontmatter: FRONTMATTER,
        routeConfig: {},
        data: { __moraineOnThisPageEntries: [{ id: 'usage', label: 'Usage', level: 1 }] },
      },
      {
        path: '(form)/input/index.tsx',
        routeId: '/input',
        sourcePath: 'pages/(form)/input/index.mdx',
        moduleId: '/tmp/input.mdx.solid-file-router.tsx',
      },
    )

    expect(extension?.routeConfig?.info).toMatchObject({
      key: 'input',
      sections: [{ id: 'usage', label: 'Usage', level: 1 }],
    })
  })
})
