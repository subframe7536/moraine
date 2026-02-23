import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Kbd } from './kbd'
import type { KbdProps } from './kbd'

describe('Kbd', () => {
  test('renders kbd root with content', () => {
    const screen = render(() => <Kbd>Ctrl</Kbd>)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('KBD')
    expect(root?.textContent).toBe('Ctrl')
  })

  test('applies size classes: xs/sm/md/lg/xl', () => {
    const xs = render(() => <Kbd size="xs">X</Kbd>)
    const sm = render(() => <Kbd size="sm">S</Kbd>)
    const md = render(() => <Kbd size="md">M</Kbd>)
    const lg = render(() => <Kbd size="lg">L</Kbd>)
    const xl = render(() => <Kbd size="xl">XL</Kbd>)

    expect(xs.container.querySelector('[data-slot="root"]')?.className).toContain('h-2')
    expect(sm.container.querySelector('[data-slot="root"]')?.className).toContain('h-3')
    expect(md.container.querySelector('[data-slot="root"]')?.className).toContain('h-4')
    expect(lg.container.querySelector('[data-slot="root"]')?.className).toContain('h-5')
    expect(xl.container.querySelector('[data-slot="root"]')?.className).toContain('h-6')
  })

  test('supports default/outline/invert variants with outline as default', () => {
    const outlineByDefault = render(() => <Kbd>K</Kbd>)
    const asDefault = render(() => <Kbd variant="default">K</Kbd>)
    const asOutline = render(() => <Kbd variant="outline">K</Kbd>)
    const asInvert = render(() => <Kbd variant="invert">K</Kbd>)

    expect(outlineByDefault.container.querySelector('[data-slot="root"]')?.className).toContain(
      'border',
    )
    expect(asDefault.container.querySelector('[data-slot="root"]')?.className).toContain(
      'bg-muted/70',
    )
    expect(asOutline.container.querySelector('[data-slot="root"]')?.className).toContain('border')
    expect(asInvert.container.querySelector('[data-slot="root"]')?.className).toContain(
      'bg-muted-foreground',
    )
  })

  test('rejects invalid size in type contract', () => {
    // @ts-expect-error size must be a declared Kbd size
    const props: KbdProps = { size: 'invalid' }
    expect(props).toBeDefined()
  })

  test('applies classes.root override', () => {
    const screen = render(() => (
      <Kbd
        classes={{
          root: 'root-override',
        }}
      >
        K
      </Kbd>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
  })

  test('keeps explicit data-slot support', () => {
    const screen = render(() => <Kbd data-slot="kbd">K</Kbd>)
    const root = screen.container.querySelector('[data-slot="root"]')
    const explicitSlotRoot = screen.container.querySelector('[data-slot="kbd"]')

    expect(root).toBeNull()
    expect(explicitSlotRoot?.tagName).toBe('KBD')
  })
})
