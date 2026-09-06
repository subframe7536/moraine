import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'

import { Separator } from './separator.tsx'

const officialDesign = createDesign()

describe('Separator', () => {
  test('renders unstyled when provider is absent', () => {
    const screen = render(() => <Separator size="lg" type="dashed" />)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.className).toBe('')
  })

  test('renders a single root element with default semantics and horizontal orientation', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Separator />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('DIV')
    expect(root?.children).toHaveLength(0)
    expect(root?.getAttribute('data-orientation')).toBe('horizontal')
    expect(root?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.className).toContain('border-t')
    expect(root?.className).toContain('w-full')
  })

  test('updates orientation semantics and classes reactively', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Separator orientation={orientation()} />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    expect(root.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root.className).toContain('border-t')

    setOrientation('vertical')

    expect(root.getAttribute('data-orientation')).toBe('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('border-s')
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
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Separator type={type} />
      </MoraineProvider>
    ))
    expect(screen.getByRole('separator').className).toContain(expectedClass)
  })

  test.each([
    ['sm', 'border-2'],
    ['md', 'border-3'],
    ['lg', 'border-4'],
  ] as const)('applies %s size variant to the root line', (size, expectedClass) => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Separator size={size} />
      </MoraineProvider>
    ))
    expect(screen.getByRole('separator').className).toContain(expectedClass)
  })

  test('uses root color inheritance for the line', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Separator class="text-primary" />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('text-primary')
    expect(root?.className).toContain('border-current')
    expect(root?.className).not.toContain('border-primary')
  })

  test('evaluates orientation once per render when used for semantics and classes', () => {
    const reads = { orientation: 0 }
    const [orientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        {createComponent(Separator, {
          get orientation() {
            reads.orientation += 1
            return orientation()
          },
        })}
      </MoraineProvider>
    ))

    expect(screen.getByRole('separator').getAttribute('data-orientation')).toBe('horizontal')
    expect(reads.orientation).toBe(1)
  })

  test('applies root class and style overrides', () => {
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Separator class="root-override" style={{ width: '200px' }} />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
    expect(root?.style.width).toBe('200px')
  })

  test('keeps direct root styling while ignoring legacy slot maps', () => {
    const screen = render(() => (
      <Separator
        class="custom-root"
        style={{ width: '200px' }}
        classes={{ root: 'ignored-root' }}
        styles={{ root: { width: '100px' } }}
      />
    ))
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.className).toContain('custom-root')
    expect(root?.className).not.toContain('ignored-root')
    expect(root?.style.width).toBe('200px')
    expect(root?.hasAttribute('classes')).toBe(false)
    expect(root?.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the separator', () => {
    const [design, setDesign] = createSignal(
      createDesign({ preset: false, separator: { base: { root: 'p-2' } } }),
    )
    const screen = render(() => (
      <MoraineProvider design={design()}>
        <Separator />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    expect(root.className).toContain('p-2')

    setDesign(createDesign({ preset: false, separator: { base: { root: 'p-4' } } }))

    expect(screen.getByRole('separator')).toBe(root)
    expect(root.className).toContain('p-4')
    expect(root.className).not.toContain('p-2')
  })

  test('keeps the root element stable when orientation changes', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => (
      <MoraineProvider design={officialDesign}>
        <Separator orientation={orientation()} />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    setOrientation('vertical')

    expect(screen.getByRole('separator')).toBe(root)
    expect(root.className).toContain('border-s')
  })

  test('decorative mode uses presentational semantics', () => {
    const screen = render(() => <Separator decorative orientation="vertical" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.getAttribute('aria-hidden')).toBe('true')
  })
})
