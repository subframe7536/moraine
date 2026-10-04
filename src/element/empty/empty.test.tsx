import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme/create-theme'

import { Empty } from './empty'
import type { EmptyT } from './empty.types'

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot="empty${name ? `-${name}` : ''}"]`) as HTMLElement | null

describe('Empty', () => {
  test('renders its parts with default elements and no inferred semantics', () => {
    const { container } = render(() => (
      <Empty>
        <Empty.Media>
          <img alt="Illustration" />
        </Empty.Media>
        <Empty.Title>No projects</Empty.Title>
        <Empty.Description>Create a project to get started.</Empty.Description>
        <Empty.Actions>
          <button>Create project</button>
        </Empty.Actions>
      </Empty>
    ))
    for (const [name, tag] of [
      ['', 'DIV'],
      ['media', 'DIV'],
      ['title', 'DIV'],
      ['description', 'P'],
      ['actions', 'DIV'],
    ] as const) {
      expect(slot(container, name)?.tagName).toBe(tag)
    }
    expect(slot(container, 'media')?.querySelector('img')?.alt).toBe('Illustration')
    expect(slot(container, 'actions')?.querySelector('button')?.textContent).toBe('Create project')
    expect(slot(container, '')?.hasAttribute('role')).toBe(false)
    expect(slot(container, '')?.hasAttribute('aria-labelledby')).toBe(false)
    expect(slot(container, '')?.hasAttribute('aria-describedby')).toBe(false)
    expect(slot(container, '')?.className).toContain('px-6')
    expect(slot(container, '')?.className).toContain('py-8')
    expect(slot(container, 'title')?.className).toContain('text-base')
    expect(slot(container, 'description')?.className).toContain('text-sm')
    expect(slot(container, 'actions')?.className).toContain('gap-3')
  })

  test.each([
    ['sm', 'px-4', 'py-6', '1.5', 'gap-2', 'text-sm', 'text-xs'],
    ['md', 'px-6', 'py-8', '2', 'gap-3', 'text-base', 'text-sm'],
    ['lg', 'px-8', 'py-12', '2.5', 'gap-4', 'text-lg', 'text-base'],
  ] as const)(
    'applies %s density across parts',
    (size, horizontalPadding, verticalPadding, spacing, actionGap, titleSize, descriptionSize) => {
      const { container } = render(() => (
        <Empty size={size}>
          <Empty.Media />
          <Empty.Title>No results</Empty.Title>
          <Empty.Description>Try another search.</Empty.Description>
          <Empty.Actions />
        </Empty>
      ))
      expect(slot(container, '')?.className).toContain(horizontalPadding)
      expect(slot(container, '')?.className).toContain(verticalPadding)
      expect(slot(container, '')?.className).toContain(`gap-${spacing}`)
      expect(slot(container, 'media')?.className).toContain(`not-last:mb-${spacing}`)
      expect(slot(container, 'title')?.className).toContain(titleSize)
      expect(slot(container, 'description')?.className).toContain(descriptionSize)
      expect(slot(container, 'actions')?.className).toContain(actionGap)
      expect(slot(container, 'actions')?.className).toContain(`not-first:mt-${spacing}`)
    },
  )

  test('updates density and family presentation without replacing nodes', () => {
    const [size, setSize] = createSignal<EmptyT.Variant['size']>('sm')
    const [classes, setClasses] = createSignal<EmptyT.Classes>({
      media: 'p-8',
      title: 'text-red-500',
    })
    const [styles, setStyles] = createSignal<EmptyT.Styles>({
      media: { color: 'red' },
      description: { color: 'red' },
    })
    const { container } = render(() => (
      <Empty size={size()} classes={classes()} styles={styles()}>
        <Empty.Media class="p-2" style={{ color: 'blue' }} />
        <Empty.Title>Title</Empty.Title>
        <Empty.Description>Description</Empty.Description>
        <Empty.Actions />
      </Empty>
    ))
    const nodes = ['', 'media', 'title', 'description', 'actions'].map((name) =>
      slot(container, name),
    )
    expect(slot(container, 'media')?.className).toContain('p-2')
    expect(slot(container, 'media')?.className).not.toContain('p-8')
    expect(slot(container, 'media')?.style.color).toBe('blue')
    expect(slot(container, 'title')?.className).toContain('text-red-500')
    expect(slot(container, 'description')?.style.color).toBe('red')
    setSize('lg')
    setClasses({ title: 'text-green-500' })
    setStyles({ description: { color: 'green' } })
    for (const [index, name] of ['', 'media', 'title', 'description', 'actions'].entries()) {
      expect(slot(container, name)).toBe(nodes[index])
    }
    expect(slot(container, '')?.className).toContain('px-8')
    expect(slot(container, '')?.className).toContain('py-12')
    expect(slot(container, 'title')?.className).toContain('text-lg')
    expect(slot(container, 'title')?.className).toContain('text-green-500')
    expect(slot(container, 'title')?.className).not.toContain('text-red-500')
    expect(slot(container, 'description')?.style.color).toBe('green')
    expect(slot(container, 'actions')?.className).toContain('gap-4')
  })

  test('inherits reactive theme defaults and lets explicit size override them', () => {
    const [theme, setTheme] = createSignal(
      defineTheme({
        empty: {
          defaultVariants: { size: 'sm' },
          base: { root: 'theme-root', title: 'theme-title' },
        },
      }),
    )
    const [size, setSize] = createSignal<EmptyT.Variant['size']>()
    const { container } = render(() => (
      <MoraineProvider theme={theme()}>
        <Empty size={size()}>
          <Empty.Title>Title</Empty.Title>
          <Empty.Description>Description</Empty.Description>
          <Empty.Actions />
        </Empty>
      </MoraineProvider>
    ))
    const title = slot(container, 'title')
    expect(slot(container, '')?.className).toContain('theme-root')
    expect(slot(container, '')?.className).toContain('px-4')
    expect(slot(container, '')?.className).toContain('py-6')
    expect(title?.className).toContain('theme-title')
    expect(title?.className).toContain('text-sm')
    setSize('lg')
    expect(title?.className).toContain('text-lg')
    expect(slot(container, '')?.className).toContain('px-8')
    expect(slot(container, '')?.className).toContain('py-12')
    setTheme(
      defineTheme({ empty: { defaultVariants: { size: 'md' }, base: { title: 'updated-theme' } } }),
    )
    expect(title?.className).toContain('text-lg')
    expect(title?.className).toContain('updated-theme')
    expect(title?.className).not.toContain('theme-title')
    setSize(undefined)
    expect(slot(container, 'title')).toBe(title)
    expect(title?.className).toContain('text-base')
    expect(slot(container, 'description')?.className).toContain('text-sm')
    expect(slot(container, 'actions')?.className).toContain('gap-3')
  })

  test('forwards native props to polymorphic elements', () => {
    const { container } = render(() => (
      <Empty as="section" aria-label="Projects" id="projects">
        <Empty.Media as="figure" />
        <Empty.Title as="h2">No projects</Empty.Title>
        <Empty.Description as="div" />
        <Empty.Actions as="nav" aria-label="Project actions" />
      </Empty>
    ))
    expect(slot(container, '')?.tagName).toBe('SECTION')
    expect(slot(container, '')?.id).toBe('projects')
    expect(slot(container, '')?.getAttribute('aria-label')).toBe('Projects')
    expect(slot(container, 'media')?.tagName).toBe('FIGURE')
    expect(slot(container, 'title')?.tagName).toBe('H2')
    expect(slot(container, 'description')?.tagName).toBe('DIV')
    expect(slot(container, 'actions')?.tagName).toBe('NAV')
    expect(slot(container, 'actions')?.getAttribute('aria-label')).toBe('Project actions')
  })

  test('requires Empty for parts', () => {
    expect(() => render(() => <Empty.Media />)).toThrow('useEmptyContext')
  })
})
