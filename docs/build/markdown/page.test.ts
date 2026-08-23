// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { createDocsMdxOptions } from './page.ts'

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
      sections: [{ id: 'button', label: 'Button', level: 1 }],
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
})
