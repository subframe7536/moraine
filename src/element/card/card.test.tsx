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
    expect(container.querySelector('[data-action], [data-no-footer]')).toBeNull()
  })

  test('uses outline and medium density by default', () => {
    const { container } = render(() => (
      <Card>
        <Card.Header>
          <Card.Title>Title</Card.Title>
        </Card.Header>
        <Card.Body>Body</Card.Body>
      </Card>
    ))
    expect(slot(container, '')?.className).toContain('border-border')
    expect(slot(container, 'header')?.className).toContain('px-4')
    expect(slot(container, 'title')?.className).toContain('text-base')
    expect(slot(container, 'body')?.className).toContain('px-4')
  })

  test.each(['outline', 'subtle', 'none'] as const)('resolves %s surface', (variant) => {
    const { container } = render(() => (
      <Card variant={variant}>
        <Card.Header>Header</Card.Header>
        <Card.Body>Body</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    ))
    const rootClasses = slot(container, '')?.className ?? ''
    const headerClasses = slot(container, 'header')?.className ?? ''
    const footerClasses = slot(container, 'footer')?.className ?? ''
    expect(rootClasses).toContain('border-border')
    expect(rootClasses).toContain('rounded-xl')
    expect(rootClasses).toContain('bg-card')
    expect(headerClasses).not.toMatch(/border-b|bg-muted/)
    if (variant === 'none') {
      expect(footerClasses).not.toContain('border-t')
    } else {
      expect(footerClasses).toContain('border-t')
      expect(footerClasses.includes('bg-muted/50')).toBe(variant === 'subtle')
    }
  })

  test.each([
    ['sm', '3', 'text-sm'],
    ['md', '4', 'text-base'],
    ['lg', '5', 'text-lg'],
  ] as const)('%s density applies to child parts', (size, spacing, titleSize) => {
    const { container } = render(() => (
      <Card size={size}>
        <Card.Header>
          <Card.Title>Title</Card.Title>
        </Card.Header>
        <Card.Body />
        <Card.Footer />
      </Card>
    ))
    expect(slot(container, '')?.className).toContain(`gap-${spacing}`)
    expect(slot(container, 'header')?.className).toContain(`px-${spacing}`)
    expect(slot(container, 'title')?.className).toContain(titleSize)
    expect(slot(container, 'body')?.className).toContain(`px-${spacing}`)
    expect(slot(container, 'footer')?.className).toContain(`p-${spacing}`)
  })

  test('applies family overrides before local part class and style', () => {
    const { container } = render(() => (
      <Card
        classes={{ header: 'p-8', body: 'body-override' }}
        styles={{ footer: { color: 'red' }, header: { color: 'red' } }}
      >
        <Card.Header class="p-2" style={{ color: 'blue' }} />
        <Card.Body />
        <Card.Footer />
      </Card>
    ))
    expect(slot(container, 'header')?.className).toContain('p-2')
    expect(slot(container, 'header')?.className).not.toContain('p-8')
    expect(slot(container, 'header')?.style.color).toBe('blue')
    expect(slot(container, 'body')?.className).toContain('body-override')
    expect(slot(container, 'footer')?.style.color).toBe('red')
  })

  test('updates child density when the root size changes', () => {
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
    expect(title?.className).toContain('text-sm')
    setSize('lg')
    expect(slot(container, 'title')).toBe(title)
    expect(title?.className).toContain('text-lg')
    expect(slot(container, 'body')?.className).toContain('px-5')
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
