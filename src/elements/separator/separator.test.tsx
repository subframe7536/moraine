import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { Separator } from './separator'

describe('Separator', () => {
  test('renders component defaults when provider is absent', () => {
    const screen = render(() => <Separator />)
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')
    expect(root?.className).not.toBe('')
  })

  test('renders a single root element with default semantics and horizontal orientation', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Separator />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('DIV')
    expect(root?.children).toHaveLength(0)
    expect(root?.getAttribute('data-orientation')).toBe('horizontal')
    expect(root?.getAttribute('data-slot')).toBe('root')
    expect(root?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.className).toContain('h-px')
    expect(root?.className).toContain('w-full')
  })

  test('updates orientation semantics and classes reactively', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => (
      <MoraineProvider>
        <Separator orientation={orientation()} />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    expect(root.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root.className).toContain('h-px')

    setOrientation('vertical')

    expect(root.getAttribute('data-orientation')).toBe('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('w-px')
    expect(root.className).toContain('h-full')
  })

  test('forwards native attributes while retaining separator semantics', () => {
    const screen = render(() => (
      <Separator
        id="section-break"
        title="Section break"
        orientation="horizontal"
        role="presentation"
        aria-hidden={false}
        aria-orientation="vertical"
        data-orientation="custom"
      />
    ))
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.id).toBe('section-break')
    expect(root?.title).toBe('Section break')
    expect(root?.getAttribute('aria-hidden')).toBe('false')
    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root?.getAttribute('data-orientation')).toBe('horizontal')
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
      <MoraineProvider>
        <Separator class="text-primary" />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('text-primary')
    expect(root?.className).not.toContain('border-primary')
  })

  test('applies root class and style overrides', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Separator class="root-override" style={{ width: '200px' }} />
      </MoraineProvider>
    ))
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
    expect(root?.style.width).toBe('200px')
  })

  test('replaces Design root styling without remounting the separator', () => {
    const [design, setDesign] = createSignal(defineTheme({ separator: { base: { root: 'p-2' } } }))
    const screen = render(() => (
      <MoraineProvider theme={design()}>
        <Separator />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    expect(root.className).toContain('p-2')

    setDesign(defineTheme({ separator: { base: { root: 'p-4' } } }))

    expect(screen.getByRole('separator')).toBe(root)
    expect(root.className).toContain('p-4')
    expect(root.className).not.toContain('p-2')
  })

  test('keeps the root element stable when orientation changes', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => (
      <MoraineProvider>
        <Separator orientation={orientation()} />
      </MoraineProvider>
    ))
    const root = screen.getByRole('separator')

    setOrientation('vertical')

    expect(screen.getByRole('separator')).toBe(root)
    expect(root.className).toContain('bg-border')
  })
})
