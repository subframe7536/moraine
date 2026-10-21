import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { ScrollArea } from './scroll-area'
import type { ScrollAreaT } from './scroll-area.types'

function setDimensions(
  element: HTMLElement,
  dimensions: Partial<
    Record<'clientHeight' | 'scrollHeight' | 'clientWidth' | 'scrollWidth', number>
  >,
): void {
  for (const [name, value] of Object.entries(dimensions)) {
    Object.defineProperty(element, name, { configurable: true, value })
  }
}

function expectEdges(element: HTMLElement, start: boolean, end: boolean): void {
  expect(element.hasAttribute('data-shadow-start')).toBe(start)
  expect(element.hasAttribute('data-shadow-end')).toBe(end)
}

afterEach(() => vi.unstubAllGlobals())

describe('ScrollArea', () => {
  test('renders native, keyboard-focusable scrolling without shadows by default', () => {
    const onScroll = vi.fn()
    const ref = vi.fn()
    const screen = render(() => (
      <ScrollArea ref={ref} onScroll={onScroll} role="region" aria-label="Activity">
        <button>Open activity</button>
      </ScrollArea>
    ))
    const root = screen.getByRole('region', { name: 'Activity' })
    expect(root.tabIndex).toBe(0)
    expect(root.children).toHaveLength(1)
    expect(root.contains(screen.getByRole('button'))).toBe(true)
    expect(ref).toHaveBeenCalledWith(root)
    expect(root.className).toContain('overflow-y-auto')
    expect(root.className).not.toContain('mask-image')
    setDimensions(root, { clientHeight: 100, scrollHeight: 300 })
    root.scrollTop = 50
    fireEvent.scroll(root)
    expect(onScroll).toHaveBeenCalledTimes(1)
    expectEdges(root, false, false)
  })

  test('leaves the tab order when content fits and restores it when content overflows', async () => {
    const screen = render(() => (
      <ScrollArea role="region" aria-label="Activity">
        Content
      </ScrollArea>
    ))
    const root = screen.getByRole('region', { name: 'Activity' })
    setDimensions(root, { clientHeight: 100, scrollHeight: 100 })
    fireEvent(window, new Event('resize'))
    await waitFor(() => expect(root.tabIndex).toBe(-1))

    setDimensions(root, { scrollHeight: 300 })
    fireEvent(window, new Event('resize'))
    await waitFor(() => expect(root.tabIndex).toBe(0))
  })

  test('tracks vertical boundaries, suppresses duplicate notifications, and clears fitting content', async () => {
    const onVisibilityChange = vi.fn()
    const screen = render(() => <ScrollArea shadow onVisibilityChange={onVisibilityChange} />)
    const root = screen.container.firstElementChild as HTMLElement
    setDimensions(root, { clientHeight: 100, scrollHeight: 300 })
    await waitFor(() => expectEdges(root, false, true))
    expect(onVisibilityChange).toHaveBeenLastCalledWith('bottom')

    root.scrollTop = 50
    fireEvent.scroll(root)
    expectEdges(root, true, true)
    expect(onVisibilityChange).toHaveBeenLastCalledWith('both')
    fireEvent.scroll(root)
    expect(onVisibilityChange).toHaveBeenCalledTimes(2)

    root.scrollTop = 199.5
    fireEvent.scroll(root)
    expectEdges(root, true, false)
    expect(onVisibilityChange).toHaveBeenLastCalledWith('top')

    root.scrollTop = 0
    setDimensions(root, { scrollHeight: 100 })
    fireEvent.scroll(root)
    expectEdges(root, false, false)
    expect(onVisibilityChange).toHaveBeenLastCalledWith('none')
  })

  test.each(['ltr', 'rtl'] as const)(
    'tracks physical horizontal edges in %s content',
    async (direction) => {
      const screen = render(() => (
        <ScrollArea shadow orientation="horizontal" style={{ direction }} />
      ))
      const root = screen.container.firstElementChild as HTMLElement
      setDimensions(root, { clientWidth: 100, scrollWidth: 300 })
      await waitFor(() => expectEdges(root, direction === 'rtl', direction === 'ltr'))

      root.scrollLeft = direction === 'rtl' ? -100 : 100
      fireEvent.scroll(root)
      expectEdges(root, true, true)

      root.scrollLeft = direction === 'rtl' ? -200 : 200
      fireEvent.scroll(root)
      expectEdges(root, direction === 'ltr', direction === 'rtl')

      root.scrollLeft = direction === 'rtl' ? -250 : -50
      fireEvent.scroll(root)
      expectEdges(root, false, true)
    },
  )

  test('updates axis, offset, shadow size, visibility, and shadow opt-out without replacing children', async () => {
    const [shadow, setShadow] = createSignal(true)
    const [orientation, setOrientation] = createSignal<'vertical' | 'horizontal'>('vertical')
    const [offset, setOffset] = createSignal(10)
    const [shadowSize, setShadowSize] = createSignal(40)
    const [visibility, setVisibility] = createSignal<ScrollAreaT.Visibility>('auto')
    const screen = render(() => (
      <ScrollArea
        shadow={shadow()}
        orientation={orientation()}
        offset={offset()}
        shadowSize={shadowSize()}
        visibility={visibility()}
        hideScrollbar
      >
        <input aria-label="Draft" />
      </ScrollArea>
    ))
    const root = screen.container.firstElementChild as HTMLElement
    const input = screen.getByRole('textbox') as HTMLInputElement
    input.value = 'Retained draft'
    setDimensions(root, {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 100,
      scrollWidth: 300,
    })
    root.scrollTop = 5
    await waitFor(() => expectEdges(root, false, true))
    setOffset(0)
    await waitFor(() => expectEdges(root, true, true))

    setOrientation('horizontal')
    await waitFor(() => expectEdges(root, false, true))
    expect(root.className).toContain('overflow-x-auto')
    expect(root.className).toContain('[scrollbar-width:none]')
    setShadowSize(24)
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('24px')

    setVisibility('both')
    expectEdges(root, true, true)
    setVisibility('left')
    expectEdges(root, true, false)
    setVisibility('none')
    expectEdges(root, false, false)
    setVisibility('both')
    setShadow(false)
    expectEdges(root, false, false)
    expect(root.className).not.toContain('mask-image')
    setVisibility('auto')
    setShadow(true)
    await waitFor(() => expectEdges(root, false, true))
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input.value).toBe('Retained draft')
  })

  test('remeasures on content and viewport changes and releases observers on unmount', async () => {
    let resize: ResizeObserverCallback | undefined
    const disconnect = vi.fn()
    const observe = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback
        }
        observe = observe
        disconnect = disconnect
      },
    )
    const [text, setText] = createSignal('Short content')
    const onVisibilityChange = vi.fn()
    const screen = render(() => (
      <ScrollArea shadow onVisibilityChange={onVisibilityChange}>
        <p>{text()}</p>
      </ScrollArea>
    ))
    const root = screen.container.firstElementChild as HTMLElement
    setDimensions(root, { clientHeight: 100, scrollHeight: 100 })
    await Promise.resolve()
    expectEdges(root, false, false)
    expect(observe).toHaveBeenCalledWith(root)
    expect(observe).toHaveBeenCalledWith(screen.getByText('Short content'))

    setDimensions(root, { scrollHeight: 300 })
    setText('Long content')
    await waitFor(() => expectEdges(root, false, true))

    setDimensions(root, { clientHeight: 300 })
    resize?.([], {} as ResizeObserver)
    expectEdges(root, false, false)
    setDimensions(root, { clientHeight: 100 })
    fireEvent(window, new Event('resize'))
    expectEdges(root, false, true)

    screen.unmount()
    onVisibilityChange.mockClear()
    setDimensions(root, { scrollHeight: 100 })
    resize?.([], {} as ResizeObserver)
    fireEvent.scroll(root)
    fireEvent(window, new Event('resize'))
    expect(onVisibilityChange).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()
  })

  test('uses theme defaults and root overrides without ResizeObserver support', async () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const theme = defineTheme({
      scrollArea: {
        defaultVariants: { shadow: true },
        base: {
          root: 'rounded-lg',
          '--scroll-area-shadow-size': '18px',
          '--scroll-area-shadow-start': 'transparent, black 12px',
          '--scroll-area-shadow-end': 'black calc(100% - 12px), transparent',
        },
      },
    })
    const [shadowSize, setShadowSize] = createSignal<number>()
    const [styles, setStyles] = createSignal<ScrollAreaT.Styles>({ root: { height: '100px' } })
    const [style, setStyle] = createSignal<ScrollAreaT.Props['style']>({ width: '200px' })
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <ScrollArea
          shadowSize={shadowSize()}
          tabIndex={-1}
          class="custom-root"
          styles={styles()}
          style={style()}
        />
      </MoraineProvider>
    ))
    const root = screen.container.firstElementChild as HTMLElement
    setDimensions(root, { clientHeight: 100, scrollHeight: 300 })
    await waitFor(() => expectEdges(root, false, true))
    expect(root.tabIndex).toBe(-1)
    expect(root.className).toContain('rounded-lg')
    expect(root.className).toContain('custom-root')
    expect(root.style.height).toBe('100px')
    expect(root.style.width).toBe('200px')
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('18px')
    expect(root.style.getPropertyValue('--scroll-area-direction')).toBe('to bottom')
    expect(root.style.getPropertyValue('--scroll-area-shadow-start')).toBe(
      'transparent, black 12px',
    )
    expect(root.style.getPropertyValue('--scroll-area-shadow-end')).toBe(
      'black calc(100% - 12px), transparent',
    )
    setShadowSize(24)
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('24px')
    setStyles({ root: { height: '100px', '--scroll-area-shadow-size': '30px' } })
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('30px')
    setStyle({ width: '200px', '--scroll-area-shadow-size': '36px' })
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('36px')
    setShadowSize(16)
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('36px')
    setStyle({ width: '200px' })
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('30px')
    setStyles({ root: { height: '100px' } })
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('16px')
    setShadowSize(undefined)
    expect(root.style.getPropertyValue('--scroll-area-shadow-size')).toBe('18px')
  })
})
