import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Card } from './card'
import type { CardProps } from './card'

describe('Card', () => {
  test('renders root with default outline variant classes', () => {
    const screen = render(() => <Card />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('b-1')
    expect(root?.className).toContain('bg-card')
    expect(root?.className).toContain('shadow-xs/5')
  })

  test('renders body slot only when children exist', () => {
    const emptyScreen = render(() => <Card />)
    const hasNoBody = emptyScreen.container.querySelector('[data-slot="body"]')
    expect(hasNoBody).toBeNull()

    const screen = render(() => <Card>Body content</Card>)
    const body = screen.container.querySelector('[data-slot="body"]')
    expect(body?.textContent).toBe('Body content')
  })

  test('renders header and footer only when provided', () => {
    const emptyScreen = render(() => (
      <Card header={false as unknown as JSX.Element} footer={null as unknown as JSX.Element}>
        Body
      </Card>
    ))

    expect(emptyScreen.container.querySelector('[data-slot="header"]')).toBeNull()
    expect(emptyScreen.container.querySelector('[data-slot="footer"]')).toBeNull()

    const screen = render(() => (
      <Card header="Header content" footer="Footer content">
        Body
      </Card>
    ))
    const header = screen.container.querySelector('[data-slot="header"]')
    const footer = screen.container.querySelector('[data-slot="footer"]')

    expect(header?.textContent).toBe('Header content')
    expect(footer?.textContent).toBe('Footer content')
  })

  test('applies classes.root/classes.header/classes.body/classes.footer overrides', () => {
    const screen = render(() => (
      <Card
        header="Header"
        footer="Footer"
        classes={{
          root: 'root-override',
          header: 'header-override',
          body: 'body-override',
          footer: 'footer-override',
        }}
      >
        Body
      </Card>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const header = screen.container.querySelector('[data-slot="header"]')
    const body = screen.container.querySelector('[data-slot="body"]')
    const footer = screen.container.querySelector('[data-slot="footer"]')

    expect(root?.className).toContain('root-override')
    expect(header?.className).toContain('header-override')
    expect(body?.className).toContain('body-override')
    expect(footer?.className).toContain('footer-override')
  })

  test('applies styles.root/styles.header/styles.body/styles.footer overrides', () => {
    const screen = render(() => (
      <Card
        header="Header"
        footer="Footer"
        styles={{
          root: { width: '200px' },
          header: { width: '200px' },
          body: { width: '200px' },
          footer: { width: '200px' },
        }}
      >
        Body
      </Card>
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const header = screen.container.querySelector('[data-slot="header"]') as HTMLElement | null
    const body = screen.container.querySelector('[data-slot="body"]') as HTMLElement | null
    const footer = screen.container.querySelector('[data-slot="footer"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(header?.style.width).toBe('200px')
    expect(body?.style.width).toBe('200px')
    expect(footer?.style.width).toBe('200px')
  })

  test('rejects invalid variant in type contract', () => {
    // @ts-expect-error variant must be a declared Card variant
    const props: CardProps = { variant: 'invalid' }
    expect(props).toBeDefined()
  })
})
