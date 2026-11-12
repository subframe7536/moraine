import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Card } from './card'

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot="card${name ? `-${name}` : ''}"]`) as HTMLElement | null

describe('Card', () => {
  test('renders every public part with its default element and no inferred semantics', () => {
    const { container } = render(() => (
      <Card>
        <Card.Header>
          <Card.Title>Title</Card.Title>
          <Card.Description>Description</Card.Description>
          <Card.Action>Action</Card.Action>
        </Card.Header>
        <Card.Body>Body</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    ))

    for (const name of ['', 'header', 'title', 'description', 'action', 'body', 'footer']) {
      expect(slot(container, name)).not.toBeNull()
    }
    expect(slot(container, '')?.tagName).toBe('DIV')
    expect(slot(container, 'title')?.tagName).toBe('DIV')
    expect(slot(container, 'description')?.tagName).toBe('P')
    expect(slot(container, '')?.hasAttribute('role')).toBe(false)
    expect(slot(container, '')?.hasAttribute('aria-labelledby')).toBe(false)
    expect(slot(container, '')?.hasAttribute('aria-describedby')).toBe(false)
  })

  test('applies family overrides alongside local part class and style', () => {
    const { container } = render(() => (
      <Card
        classes={{ header: 'header-family', body: 'body-override' }}
        styles={{ footer: { color: 'red' }, header: { color: 'red' } }}
      >
        <Card.Header class="header-local" style={{ color: 'blue' }} />
        <Card.Body />
        <Card.Footer />
      </Card>
    ))
    expect(slot(container, 'header')?.className).toContain('header-family')
    expect(slot(container, 'header')?.className).toContain('header-local')
    expect(slot(container, 'header')?.style.color).toBe('blue')
    expect(slot(container, 'body')?.className).toContain('body-override')
    expect(slot(container, 'footer')?.style.color).toBe('red')
  })

  test('keeps child parts mounted when the root size changes', () => {
    const [size, setSize] = createSignal<'sm' | 'lg'>('sm')
    const { container } = render(() => (
      <Card size={size()}>
        <Card.Header>
          <Card.Title>Title</Card.Title>
        </Card.Header>
        <Card.Body>Body</Card.Body>
      </Card>
    ))
    const title = slot(container, 'title')
    setSize('lg')
    expect(slot(container, 'title')).toBe(title)
    expect(slot(container, 'body')?.textContent).toBe('Body')
  })

  test('supports polymorphic elements and direct full-width media', () => {
    const { container } = render(() => (
      <Card as="article">
        <img alt="Landscape" />
        <Card.Header>
          <Card.Title as="h2">Title</Card.Title>
        </Card.Header>
        <Card.Footer as="nav">Links</Card.Footer>
      </Card>
    ))
    expect(slot(container, '')?.tagName).toBe('ARTICLE')
    expect(slot(container, '')?.firstElementChild?.tagName).toBe('IMG')
    expect(slot(container, 'title')?.tagName).toBe('H2')
    expect(slot(container, 'footer')?.tagName).toBe('NAV')
  })

  test('requires Card for parts', () => {
    expect(() => render(() => <Card.Body />)).toThrow('useCardContext')
  })
})
