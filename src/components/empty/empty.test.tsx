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
  })

  test('updates family presentation without replacing nodes', () => {
    const [classes, setClasses] = createSignal<EmptyT.Classes>({
      media: 'media-slot',
      title: 'title-red',
    })
    const [styles, setStyles] = createSignal<EmptyT.Styles>({
      media: { color: 'red' },
      description: { color: 'red' },
    })
    const { container } = render(() => (
      <Empty classes={classes()} styles={styles()}>
        <Empty.Media class="media-user" style={{ color: 'blue' }} />
        <Empty.Title>Title</Empty.Title>
        <Empty.Description>Description</Empty.Description>
        <Empty.Actions />
      </Empty>
    ))
    const nodes = ['', 'media', 'title', 'description', 'actions'].map((name) =>
      slot(container, name),
    )
    expect(slot(container, 'media')?.className).toContain('media-user')
    expect(slot(container, 'media')?.className).toContain('media-slot')
    expect(slot(container, 'media')?.style.color).toBe('blue')
    expect(slot(container, 'title')?.className).toContain('title-red')
    expect(slot(container, 'description')?.style.color).toBe('red')
    setClasses({ title: 'title-green' })
    setStyles({ description: { color: 'green' } })
    for (const [index, name] of ['', 'media', 'title', 'description', 'actions'].entries()) {
      expect(slot(container, name)).toBe(nodes[index])
    }
    expect(slot(container, 'title')?.className).toContain('title-green')
    expect(slot(container, 'title')?.className).not.toContain('title-red')
    expect(slot(container, 'description')?.style.color).toBe('green')
  })

  test('inherits reactive theme defaults and keeps parts mounted when the theme changes', () => {
    const [theme, setTheme] = createSignal(
      defineTheme({
        empty: {
          base: { root: 'theme-root', title: 'theme-title' },
        },
      }),
    )
    const { container } = render(() => (
      <MoraineProvider theme={theme()}>
        <Empty>
          <Empty.Title>Title</Empty.Title>
          <Empty.Description>Description</Empty.Description>
          <Empty.Actions />
        </Empty>
      </MoraineProvider>
    ))
    const title = slot(container, 'title')
    expect(slot(container, '')?.className).toContain('theme-root')
    expect(title?.className).toContain('theme-title')
    setTheme(defineTheme({ empty: { base: { title: 'updated-theme' } } }))
    expect(slot(container, 'title')).toBe(title)
    expect(title?.className).toContain('updated-theme')
    expect(title?.className).not.toContain('theme-title')
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
