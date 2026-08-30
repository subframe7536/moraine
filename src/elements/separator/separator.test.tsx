import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Separator } from './separator.tsx'

describe('Separator', () => {
  test('renders a single root element with default semantics and horizontal orientation', () => {
    const screen = render(() => <Separator />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('DIV')
    expect(root?.children).toHaveLength(0)
    expect(root?.getAttribute('data-orientation')).toBe('horizontal')
    expect(root?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.className).toContain('b-t')
    expect(root?.className).toContain('w-full')
  })

  test('updates orientation semantics and classes reactively', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => <Separator orientation={orientation()} />)
    const root = screen.getByRole('separator')

    expect(root.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root.className).toContain('b-t')

    setOrientation('vertical')

    expect(root.getAttribute('data-orientation')).toBe('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('b-s')
    expect(root.className).toContain('h-full')
  })

  test('lets caller attributes override generated separator semantics', () => {
    const screen = render(() => (
      <Separator
        decorative
        orientation="horizontal"
        role="presentation"
        aria-hidden={false}
        aria-orientation="vertical"
        data-orientation="custom"
      />
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('role')).toBe('presentation')
    expect(root?.getAttribute('aria-hidden')).toBe('false')
    expect(root?.getAttribute('aria-orientation')).toBe('vertical')
    expect(root?.getAttribute('data-orientation')).toBe('custom')
  })

  test('remains passive and non-tabbable while forwarding caller pointer events', () => {
    const onPointerDown = vi.fn()
    const screen = render(() => <Separator onPointerDown={onPointerDown} />)
    const root = screen.getByRole('separator')
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })

    root.dispatchEvent(event)

    expect(root.hasAttribute('tabindex')).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })

  test.each([
    ['solid', 'border-solid'],
    ['dashed', 'border-dashed'],
    ['dotted', 'border-dotted'],
  ] as const)('applies %s type variant to the root line', (type, expectedClass) => {
    const screen = render(() => <Separator type={type} />)
    expect(screen.getByRole('separator').className).toContain(expectedClass)
  })

  test.each([
    ['sm', 'b-2'],
    ['md', 'b-3'],
    ['lg', 'b-4'],
  ] as const)('applies %s size variant to the root line', (size, expectedClass) => {
    const screen = render(() => <Separator size={size} />)
    expect(screen.getByRole('separator').className).toContain(expectedClass)
  })

  test('uses root color inheritance for the line', () => {
    const screen = render(() => <Separator classes={{ root: 'text-primary' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('text-primary')
    expect(root?.className).toContain('border-current')
    expect(root?.className).not.toContain('border-primary')
  })

  test('evaluates orientation once per render when used for semantics and classes', () => {
    const reads = { orientation: 0 }
    const [orientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() =>
      createComponent(Separator, {
        get orientation() {
          reads.orientation += 1
          return orientation()
        },
      }),
    )

    expect(screen.getByRole('separator').getAttribute('data-orientation')).toBe('horizontal')
    expect(reads.orientation).toBe(1)
  })

  test('applies root class and style overrides', () => {
    const screen = render(() => (
      <Separator classes={{ root: 'root-override' }} styles={{ root: { width: '200px' } }} />
    ))
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
    expect(root?.style.width).toBe('200px')
  })

  test('keeps the root element stable when orientation changes', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => <Separator orientation={orientation()} />)
    const root = screen.getByRole('separator')

    setOrientation('vertical')

    expect(screen.getByRole('separator')).toBe(root)
    expect(root.className).toContain('b-s')
  })

  test('decorative mode uses presentational semantics', () => {
    const screen = render(() => <Separator decorative orientation="vertical" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.getAttribute('aria-hidden')).toBe('true')
  })
})
