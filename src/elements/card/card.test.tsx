import { render } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'

import { Card } from './card.tsx'

const officialDesign = createDesign()

describe('Card', () => {
  test('renders unstyled when provider is absent', () => {
    const screen = render(() => (
      <Card header="Header" footer="Footer">
        Body
      </Card>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.className).toBe('')
    const header = screen.container.querySelector('[data-slot="header"]')
    expect(header?.className).toBe('')
    const body = screen.container.querySelector('[data-slot="body"]')
    expect(body?.className).toBe('')
    const footer = screen.container.querySelector('[data-slot="footer"]')
    expect(footer?.className).toBe('')
  })

  test('renders root with the default outline appearance', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Card />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toMatchInlineSnapshot(
      `"text-card-foreground border border-border rounded-xl bg-card flex flex-col shadow-xs relative overflow-hidden [html:not(.dark)_&]:bg-clip-padding"`,
    )
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
      <Card header={false} footer={null}>
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

  test('renders JSX slots in their public locations', () => {
    const screen = render(() =>
      createComponent(Card, {
        title: <span>Cached title</span>,
        footer: <span>Cached footer</span>,
      }),
    )

    expect(screen.getByText('Cached title')).not.toBeNull()
    expect(screen.getByText('Cached footer')).not.toBeNull()
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
})
