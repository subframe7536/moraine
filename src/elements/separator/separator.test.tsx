import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider'
import { createTheme } from '../../theme'
import { defaultTheme } from '../../theme/default-theme'

import { Separator } from './separator'

describe('Separator', () => {
  test('renders unstyled when provider is absent', () => {
    const screen = render(() => <Separator />)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.className).toBe('')
  })

  test('renders a single root element with default semantics and horizontal orientation', () => {
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <Separator />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('DIV')
    expect(root?.children).toHaveLength(0)
    expect(root?.hasAttribute('data-orientation')).toBe(false)
    expect(root?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.className).toContain('h-px')
    expect(root?.className).toContain('w-full')
  })

  test('updates orientation semantics and classes reactively', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <Separator orientation={orientation()} />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    expect(root.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root.className).toContain('h-px')

    setOrientation('vertical')

    expect(root.hasAttribute('data-orientation')).toBe(false)
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('w-px')
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

  test('uses root color inheritance for the line', () => {
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <Separator class="text-primary" />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('text-primary')
    expect(root?.className).not.toContain('border-primary')
  })

  test('applies root class and style overrides', () => {
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <Separator class="root-override" style={{ width: '200px' }} />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
    expect(root?.style.width).toBe('200px')
  })

  test('keeps direct root styling while ignoring legacy slot maps', () => {
    const screen = render(() => <Separator class="custom-root" style={{ width: '200px' }} />)
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.className).toContain('custom-root')
    expect(root?.className).not.toContain('ignored-root')
    expect(root?.style.width).toBe('200px')
    expect(root?.hasAttribute('classes')).toBe(false)
    expect(root?.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the separator', () => {
    const [design, setDesign] = createSignal(createTheme({ separator: { base: { root: 'p-2' } } }))
    const screen = render(() => (
      <MoraineProvider theme={design()}>
        <Separator />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    expect(root.className).toContain('p-2')

    setDesign(createTheme({ separator: { base: { root: 'p-4' } } }))

    expect(screen.getByRole('separator')).toBe(root)
    expect(root.className).toContain('p-4')
    expect(root.className).not.toContain('p-2')
  })

  test('keeps the root element stable when orientation changes', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => (
      <MoraineProvider theme={defaultTheme}>
        <Separator orientation={orientation()} />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    setOrientation('vertical')

    expect(screen.getByRole('separator')).toBe(root)
    expect(root.className).toContain('bg-border')
  })

  test('decorative mode uses presentational semantics', () => {
    const screen = render(() => <Separator decorative orientation="vertical" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.getAttribute('aria-hidden')).toBe('true')
  })
})
