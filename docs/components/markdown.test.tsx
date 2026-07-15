// oxlint-disable class-methods-use-this
import { fireEvent, render } from '@solidjs/testing-library'
import type { Component, JSX } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import type { DocsMdxContentProps } from './markdown'
import { Markdown } from './markdown'

vi.mock('./docs-page-navigation', () => ({ DocsPageNavigation: () => null }))

vi.mock('./mdx-components', () => ({
  createDocsMdxComponents: () => ({
    h1: (props: { id?: string; children?: JSX.Element }) => <h1 {...props} />,
  }),
}))

const EmptyContent = () => <div>Body content</div>
const FRONTMATTER = {
  title: 'Button',
  description: 'Button description.',
  sidebar: { order: 10 },
  search: { tags: ['action'] },
}
const MdxHeadingContent = (props: DocsMdxContentProps) => {
  // oxlint-disable-next-line subf/solid-reactivity -- mirrors generated MDX component setup.
  const Components = props.components as Record<string, unknown>
  const H1 = Components.h1 as Component<{ id?: string; children?: JSX.Element }>
  return <H1 id="title">Title</H1>
}

describe('Markdown', () => {
  test('renders the explicit frontmatter title and description', () => {
    const screen = render(() => (
      <Markdown
        pageKey="button"
        frontmatter={FRONTMATTER}
        Content={EmptyContent}
        examples={{}}
        codeTabs={{}}
      />
    ))

    expect(screen.getByRole('heading', { name: 'Button' })).toBeDefined()
    expect(screen.getByText('Button description.')).toBeDefined()
    expect(screen.queryByRole('link', { name: 'View markdown source' })).toBeNull()
  })

  test('uses api doc defaults and frontmatter display overrides for header', () => {
    const screen = render(() => (
      <Markdown
        pageKey="button"
        frontmatter={{
          ...FRONTMATTER,
          title: 'Custom Button',
          category: 'custom',
          description: 'Custom description.',
        }}
        apiDoc={{
          component: {
            key: 'button',
            name: 'Button',
            category: 'general',
            description: 'Button description.',
            sourcePath: 'src/elements/button/button.tsx',
            polymorphic: false,
          },
          slots: [],
          props: { own: [], inherited: [] },
        }}
        Content={EmptyContent}
        examples={{}}
        codeTabs={{}}
        markdownSource="# Button docs"
      />
    ))

    expect(screen.getByText('Custom Button')).toBeDefined()
    expect(screen.getByText('custom')).toBeDefined()
    expect(screen.getByText('Custom description.')).toBeDefined()
    expect(screen.getByText('button')).toBeDefined()
    expect(screen.getByText('Source Code').closest('a')?.getAttribute('href')).toContain(
      'src/elements/button/button.tsx',
    )
    const markdownLink = screen.getByRole('link', { name: 'View markdown source' })
    expect(markdownLink.getAttribute('href')).toBe('/button.md')
    expect(markdownLink.getAttribute('rel')).toBe('alternate external')
    expect(markdownLink.getAttribute('type')).toBe('text/markdown')
    expect(markdownLink.className).toBe(screen.getByText('Source Code').closest('a')?.className)
    expect(screen.getByRole('button', { name: 'Copy markdown source' })).toBeDefined()
  })

  test('copies markdown source from the header action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const screen = render(() => (
      <Markdown
        pageKey="button"
        frontmatter={FRONTMATTER}
        Content={EmptyContent}
        examples={{}}
        codeTabs={{}}
        markdownSource="# Button docs"
      />
    ))

    await fireEvent.click(screen.getByRole('button', { name: 'Copy markdown source' }))

    expect(writeText).toHaveBeenCalledWith('# Button docs')
    expect(screen.getByText('Copied Markdown')).toBeDefined()

    vi.unstubAllGlobals()
  })

  test('renders api reference from api doc automatically', () => {
    const screen = render(() => (
      <Markdown
        pageKey="button"
        frontmatter={FRONTMATTER}
        apiDoc={{
          component: {
            key: 'button',
            name: 'Button',
            category: 'general',
            polymorphic: false,
          },
          slots: [],
          props: {
            own: [{ name: 'loading', required: false, type: 'boolean | undefined' }],
            inherited: [],
          },
        }}
        Content={EmptyContent}
        examples={{}}
        codeTabs={{}}
      />
    ))

    expect(screen.getByText('Body content')).toBeDefined()
    expect(screen.getByRole('heading', { name: /API Reference/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: /Props/ })).toBeDefined()
    expect(screen.getByText('loading')).toBeDefined()
  })

  test('renders mdx intrinsic component member expressions', () => {
    const screen = render(() => (
      <Markdown
        pageKey="button"
        frontmatter={FRONTMATTER}
        Content={MdxHeadingContent}
        examples={{}}
        codeTabs={{}}
      />
    ))

    expect(screen.getByRole('heading', { name: 'Title' }).getAttribute('id')).toBe('title')
  })
})
