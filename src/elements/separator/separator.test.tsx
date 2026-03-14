import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Separator as ExportedSeparator } from '../../index'

import { Separator } from './separator'

describe('Separator', () => {
  test('renders default root semantics and horizontal orientation', () => {
    const screen = render(() => <Separator />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const borders = screen.container.querySelectorAll('[data-slot="border"]')

    expect(root?.tagName).toBe('DIV')
    expect(root?.getAttribute('data-orientation')).toBe('horizontal')
    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.className).toContain('flex-row')
    expect(root?.className).toContain('text-muted')
    expect(borders.length).toBe(1)
    expect(borders[0]?.className).toContain('b-t')
  })

  test('renders vertical orientation', () => {
    const screen = render(() => <Separator orientation="vertical" />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const border = screen.container.querySelector('[data-slot="border"]')

    expect(root?.getAttribute('data-orientation')).toBe('vertical')
    expect(root?.getAttribute('aria-orientation')).toBe('vertical')
    expect(root?.className).toContain('flex-col')
    expect(border?.className).toContain('border-s')
  })

  test('applies type variants', () => {
    const solid = render(() => <Separator type="solid" />)
    const dashed = render(() => <Separator type="dashed" />)
    const dotted = render(() => <Separator type="dotted" />)

    expect(solid.container.querySelector('[data-slot="border"]')?.className).toContain(
      'border-solid',
    )
    expect(dashed.container.querySelector('[data-slot="border"]')?.className).toContain(
      'border-dashed',
    )
    expect(dotted.container.querySelector('[data-slot="border"]')?.className).toContain(
      'border-dotted',
    )
  })

  test('applies size variants', () => {
    const xs = render(() => <Separator size="xs" />)
    const sm = render(() => <Separator size="sm" />)
    const md = render(() => <Separator size="md" />)
    const lg = render(() => <Separator size="lg" />)
    const xl = render(() => <Separator size="xl" />)

    expect(xs.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(sm.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(md.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(lg.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(xl.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(xs.container.querySelector('[data-slot="border"]')?.className).toContain('b-1')
    expect(sm.container.querySelector('[data-slot="border"]')?.className).toContain('b-2')
    expect(md.container.querySelector('[data-slot="border"]')?.className).toContain('b-3')
    expect(lg.container.querySelector('[data-slot="border"]')?.className).toContain('b-4')
    expect(xl.container.querySelector('[data-slot="border"]')?.className).toContain('b-5')
  })

  test('uses root color inheritance for border color', () => {
    const screen = render(() => <Separator classes={{ root: 'text-primary' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const border = screen.container.querySelector('[data-slot="border"]')

    expect(root?.className).toContain('text-primary')
    expect(border?.className).toContain('border-current')
    expect(border?.className).not.toContain('border-primary')
  })

  test('renders middle content through children', () => {
    const withText = render(() => <Separator>+1</Separator>)
    expect(withText.container.querySelector('[data-slot="container"]')?.textContent).toBe('+1')

    const withIconLikeNode = render(() => (
      <Separator>
        <span data-testid="icon-content">I</span>
      </Separator>
    ))
    expect(withIconLikeNode.getByTestId('icon-content').textContent).toBe('I')

    const withAvatarLikeNode = render(() => (
      <Separator>
        <span data-testid="avatar-content">A</span>
      </Separator>
    ))
    expect(withAvatarLikeNode.getByTestId('avatar-content').textContent).toBe('A')
  })

  test('decorative mode uses presentational semantics', () => {
    const screen = render(() => <Separator decorative orientation="vertical" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.getAttribute('aria-hidden')).toBe('true')
  })

  test('applies classes overrides for all slots', () => {
    const withChildren = render(() => (
      <Separator
        classes={{
          root: 'root-override',
          border: 'border-override',
          container: 'container-override',
        }}
      >
        <span data-testid="middle-content">L</span>
      </Separator>
    ))

    const root = withChildren.container.querySelector('[data-slot="root"]')
    const borders = withChildren.container.querySelectorAll('[data-slot="border"]')
    const container = withChildren.container.querySelector('[data-slot="container"]')

    expect(root?.className).toContain('root-override')
    expect(borders.length).toBe(2)
    expect(borders[0]?.className).toContain('border-override')
    expect(borders[1]?.className).toContain('border-override')
    expect(container?.className).toContain('container-override')
    expect(withChildren.getByTestId('middle-content').textContent).toBe('L')
  })

  test('applies styles overrides for all slots', () => {
    const withChildren = render(() => (
      <Separator
        styles={
          {
            root: { width: '200px' },
            border: { width: '200px' },
            container: { width: '200px' },
          } as any
        }
      >
        <span data-testid="middle-content">L</span>
      </Separator>
    ))

    const root = withChildren.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const borders = withChildren.container.querySelectorAll('[data-slot="border"]')
    const container = withChildren.container.querySelector(
      '[data-slot="container"]',
    ) as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect((borders[0] as HTMLElement | null)?.style.width).toBe('200px')
    expect((borders[1] as HTMLElement | null)?.style.width).toBe('200px')
    expect(container?.style.width).toBe('200px')
  })

  test('exports separator from root index', () => {
    expect(ExportedSeparator).toBe(Separator)
  })
})
