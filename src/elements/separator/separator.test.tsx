import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { Separator as ExportedSeparator } from '../../index.ts'
import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

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

  test('applies type variants to the root line', () => {
    const solid = render(() => <Separator type="solid" />)
    const dashed = render(() => <Separator type="dashed" />)
    const dotted = render(() => <Separator type="dotted" />)

    expect(solid.getByRole('separator').className).toContain('border-solid')
    expect(dashed.getByRole('separator').className).toContain('border-dashed')
    expect(dotted.getByRole('separator').className).toContain('border-dotted')
  })

  test('applies size variants to the root line', () => {
    const sm = render(() => <Separator size="sm" />)
    const md = render(() => <Separator size="md" />)
    const lg = render(() => <Separator size="lg" />)

    expect(sm.getByRole('separator').className).toContain('b-2')
    expect(md.getByRole('separator').className).toContain('b-3')
    expect(lg.getByRole('separator').className).toContain('b-4')
  })

  test('uses root color inheritance for the line', () => {
    const screen = render(() => <Separator classes={{ root: 'text-primary' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('text-primary')
    expect(root?.className).toContain('border-current')
    expect(root?.className).not.toContain('border-primary')
  })

  test('hydrates the single separator root without reordering nodes', () => {
    const markup = renderSsrFixture(
      '/src/elements/separator/separator.ssr.fixture.tsx',
      'renderSeparatorFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const reads = { orientation: 0 }
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () =>
        createComponent(Separator, {
          get orientation() {
            reads.orientation += 1
            return orientation()
          },
        }),
      container,
    )
    const root = container.querySelector('[data-slot="root"]')!

    expect(root).toBe(serverRoot)
    expect(root.children).toHaveLength(0)
    expect(reads.orientation).toBe(1)

    setOrientation('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('b-s')
    expect(reads.orientation).toBe(2)

    dispose()
    container.remove()
    restoreHydrationState()
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

  test('exports separator from root index', () => {
    expect(ExportedSeparator).toBe(Separator)
  })
})
