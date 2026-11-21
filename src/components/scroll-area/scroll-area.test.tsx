import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createRoot, createSignal } from 'solid-js'
import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { ScrollArea } from './scroll-area'
import type { ScrollAreaT } from './scroll-area.types'

type Dimension = 'clientHeight' | 'scrollHeight' | 'clientWidth' | 'scrollWidth'

function define(element: HTMLElement, values: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(values)) {
    Object.defineProperty(element, name, { configurable: true, value })
  }
}

function setDimensions(element: HTMLElement, dimensions: Partial<Record<Dimension, number>>): void {
  define(element, dimensions)
}

function parts(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('[data-slot="scroll-area"]')!
  return {
    root,
    viewport: root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!,
    content: root.querySelector<HTMLElement>('[data-slot="scroll-area-content"]')!,
    scrollbar: (orientation: 'vertical' | 'horizontal') =>
      root.querySelector<HTMLElement>(
        `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`,
      ),
  }
}

function edges(root: HTMLElement, axis: ScrollAreaT.Axis): [boolean, boolean] {
  return [
    root.hasAttribute(`data-overflow-${axis}-start`),
    root.hasAttribute(`data-overflow-${axis}-end`),
  ]
}

/** Replaces ResizeObserver; the returned function notifies every observer. */
function stubResizeObserver() {
  const callbacks = new Set<ResizeObserverCallback>()
  const observe = vi.fn()
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        callbacks.add(callback)
      }
      observe = observe
      disconnect = disconnect
    },
  )
  return {
    observe,
    disconnect,
    resize: () => {
      for (const callback of callbacks) {
        callback([], {} as ResizeObserver)
      }
    },
  }
}

function pointer(type: string, init: MouseEventInit & { pointerId?: number }): Event {
  const EventCtor = globalThis.PointerEvent ?? MouseEvent
  return new EventCtor(type, { bubbles: true, cancelable: true, button: 0, ...init })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('ScrollArea', () => {
  test('renders a focusable viewport inside the root and forwards refs and scroll events', () => {
    const onScroll = vi.fn()
    const ref = vi.fn()
    const viewportRef = vi.fn()
    const screen = render(() => (
      <ScrollArea
        ref={ref}
        viewportRef={viewportRef}
        onScroll={onScroll}
        role="region"
        aria-label="Activity"
      >
        <button>Open activity</button>
      </ScrollArea>
    ))
    const root = screen.getByRole('region', { name: 'Activity' })
    const { viewport, content, scrollbar } = parts(screen.container)
    expect(ref).toHaveBeenCalledWith(root)
    expect(viewportRef).toHaveBeenCalledWith(viewport)
    expect(viewport.tabIndex).toBe(0)
    expect(content.contains(screen.getByRole('button'))).toBe(true)
    expect(scrollbar('vertical')?.getAttribute('aria-hidden')).toBe('true')
    expect(scrollbar('horizontal')).toBeNull()

    setDimensions(viewport, { clientHeight: 100, scrollHeight: 300 })
    viewport.scrollTop = 50
    fireEvent.scroll(viewport)
    expect(onScroll).toHaveBeenCalledTimes(1)
    expect(root.hasAttribute('data-overflow-y')).toBe(true)
  })

  test('leaves the tab order when content fits and restores it when content overflows', async () => {
    const { resize } = stubResizeObserver()
    const screen = render(() => <ScrollArea>Content</ScrollArea>)
    const { viewport } = parts(screen.container)
    expect(viewport.tabIndex).toBe(0)
    setDimensions(viewport, { clientHeight: 100, scrollHeight: 100 })
    await waitFor(() => expect(viewport.tabIndex).toBe(-1))

    setDimensions(viewport, { scrollHeight: 300 })
    resize()
    expect(viewport.tabIndex).toBe(0)
  })

  test('measures a viewport that binds before it joins the document', async () => {
    const element = createRoot((dispose) => {
      onTestFinished(dispose)
      return <ScrollArea />
    }) as HTMLElement
    document.body.append(element)
    onTestFinished(() => element.remove())
    const { root, viewport } = parts(document.body)
    setDimensions(viewport, { clientHeight: 100, scrollHeight: 300 })
    await waitFor(() => expect(edges(root, 'y')).toEqual([false, true]))
    viewport.scrollTop = 200
    fireEvent.scroll(viewport)
    expect(edges(root, 'y')).toEqual([true, false])
  })

  test('reports overflowing edges, distances, and reached edges without shadows', async () => {
    const onOverflowChange = vi.fn()
    const onTopReached = vi.fn()
    const onBottomReached = vi.fn()
    const screen = render(() => (
      <ScrollArea
        scrollThreshold={10}
        onOverflowChange={onOverflowChange}
        onTopReached={onTopReached}
        onBottomReached={onBottomReached}
      />
    ))
    const { root, viewport } = parts(screen.container)
    setDimensions(viewport, { clientHeight: 100, scrollHeight: 300 })
    await waitFor(() => expect(edges(root, 'y')).toEqual([false, true]))
    expect(onOverflowChange).toHaveBeenLastCalledWith({
      x: { start: false, end: false },
      y: { start: false, end: true },
    })
    expect(root.style.getPropertyValue('--scroll-area-overflow-y-end')).toBe('200px')

    viewport.scrollTop = 5
    fireEvent.scroll(viewport)
    expect(edges(root, 'y')).toEqual([false, true])
    expect(root.style.getPropertyValue('--scroll-area-overflow-y-start')).toBe('5px')

    viewport.scrollTop = 50
    fireEvent.scroll(viewport)
    fireEvent.scroll(viewport)
    expect(edges(root, 'y')).toEqual([true, true])
    expect(onOverflowChange).toHaveBeenCalledTimes(2)

    viewport.scrollTop = 195
    fireEvent.scroll(viewport)
    expect(edges(root, 'y')).toEqual([true, false])
    expect(onBottomReached).toHaveBeenCalledTimes(1)

    viewport.scrollTop = 0
    fireEvent.scroll(viewport)
    expect(onTopReached).toHaveBeenCalledTimes(1)

    // Content that stops overflowing does not count as reaching an edge.
    setDimensions(viewport, { scrollHeight: 100 })
    fireEvent.scroll(viewport)
    expect(edges(root, 'y')).toEqual([false, false])
    expect(root.hasAttribute('data-overflow-y')).toBe(false)
    expect(onBottomReached).toHaveBeenCalledTimes(1)
  })

  test.each(['ltr', 'rtl'] as const)(
    'tracks logical horizontal edges in %s content',
    async (direction) => {
      const onLeftReached = vi.fn()
      const onRightReached = vi.fn()
      const screen = render(() => (
        <ScrollArea
          orientation="horizontal"
          styles={{ viewport: { direction } }}
          onLeftReached={onLeftReached}
          onRightReached={onRightReached}
        />
      ))
      const { root, viewport } = parts(screen.container)
      setDimensions(viewport, { clientWidth: 100, scrollWidth: 300 })
      await waitFor(() => expect(edges(root, 'x')).toEqual([false, true]))
      expect(root.style.getPropertyValue('--scroll-area-shadow-x-direction')).toBe(
        direction === 'rtl' ? 'to left' : 'to right',
      )

      viewport.scrollLeft = direction === 'rtl' ? -100 : 100
      fireEvent.scroll(viewport)
      expect(edges(root, 'x')).toEqual([true, true])

      // The logical end edge is the physical right edge in LTR and left edge in RTL.
      viewport.scrollLeft = direction === 'rtl' ? -250 : 250
      fireEvent.scroll(viewport)
      expect(edges(root, 'x')).toEqual([true, false])
      expect(edges(root, 'y')).toEqual([false, false])
      expect(direction === 'rtl' ? onLeftReached : onRightReached).toHaveBeenCalledTimes(1)
      expect(direction === 'rtl' ? onRightReached : onLeftReached).not.toHaveBeenCalled()
    },
  )

  test('scrolls both axes with two scrollbars and a corner', async () => {
    const screen = render(() => <ScrollArea orientation="both" scrollbarMode="always" />)
    const { root, viewport, scrollbar } = parts(screen.container)
    const corner = root.querySelector<HTMLElement>('[data-slot="scroll-area-corner"]')!
    setDimensions(viewport, {
      clientHeight: 100,
      scrollHeight: 400,
      clientWidth: 100,
      scrollWidth: 200,
    })
    await waitFor(() => expect(corner.hasAttribute('data-visible')).toBe(true))
    expect(scrollbar('vertical')?.hasAttribute('data-corner')).toBe(true)
    expect(scrollbar('horizontal')?.hasAttribute('data-visible')).toBe(true)

    const thumb = scrollbar('vertical')!.firstElementChild as HTMLElement
    expect(thumb.style.height).toBe('max(20px, 25%)')
    expect(thumb.style.left).toBe('')
    expect(thumb.style.right).toBe('')
    viewport.scrollTop = 150
    fireEvent.scroll(viewport)
    expect(thumb.style.top).toBe('calc(0.5 * (100% - max(20px, 25%)))')

    setDimensions(viewport, { scrollWidth: 100 })
    fireEvent.scroll(viewport)
    expect(corner.hasAttribute('data-visible')).toBe(false)
    expect(scrollbar('horizontal')?.hasAttribute('data-visible')).toBe(false)
  })

  test('positions the horizontal thumb from the logical start in RTL', async () => {
    const screen = render(() => (
      <ScrollArea
        orientation="horizontal"
        scrollbarMode="always"
        styles={{ viewport: { direction: 'rtl' } }}
      />
    ))
    const { viewport, scrollbar } = parts(screen.container)
    setDimensions(viewport, { clientWidth: 100, scrollWidth: 300 })
    await waitFor(() => expect(scrollbar('horizontal')?.hasAttribute('data-visible')).toBe(true))
    const thumb = scrollbar('horizontal')!.firstElementChild as HTMLElement
    expect(thumb.getAttribute('style')).toContain(
      'inset-inline-start: calc(0 * (100% - max(20px, 33.33',
    )
    expect(thumb.style.left).toBe('')
  })

  test('applies the thin scrollbar width variant', () => {
    const screen = render(() => <ScrollArea scrollbarWidth="thin" />)
    const track = parts(screen.container).scrollbar('vertical')!
    expect(track.classList.contains('w-2')).toBe(true)
    expect(track.classList.contains('w-2.5')).toBe(false)
    expect(
      screen.container.querySelector('[data-slot="scroll-area"]')!.hasAttribute('scrollbarWidth'),
    ).toBe(false)
  })

  test('shows scrollbars according to the scrollbar mode', async () => {
    vi.useFakeTimers()
    const [mode, setMode] = createSignal<ScrollAreaT.Variants['scrollbarMode']>('hover')
    const screen = render(() => <ScrollArea scrollbarMode={mode()} scrollHideDelay={300} />)
    const { root, viewport, scrollbar } = parts(screen.container)
    const visible = () => scrollbar('vertical')?.hasAttribute('data-visible')
    setDimensions(viewport, { clientHeight: 100, scrollHeight: 300 })
    await vi.advanceTimersByTimeAsync(0)
    expect(visible()).toBe(false)

    fireEvent.pointerEnter(root)
    expect(visible()).toBe(true)
    expect(root.hasAttribute('data-hovering')).toBe(true)
    fireEvent.pointerLeave(root)
    expect(visible()).toBe(true)
    vi.advanceTimersByTime(300)
    expect(visible()).toBe(false)

    setMode('scroll')
    fireEvent.pointerEnter(root)
    expect(visible()).toBe(false)
    fireEvent.scroll(viewport)
    expect(visible()).toBe(true)
    expect(root.hasAttribute('data-scrolling')).toBe(true)
    vi.advanceTimersByTime(300)
    expect(visible()).toBe(false)

    setMode('always')
    expect(visible()).toBe(true)
    // Scrollbars never show while the content fits, whatever the mode.
    setDimensions(viewport, { scrollHeight: 100 })
    fireEvent.scroll(viewport)
    expect(visible()).toBe(false)

    setMode('native')
    expect(scrollbar('vertical')).toBeNull()
    setMode('hidden')
    expect(scrollbar('vertical')).toBeNull()
  })

  test('drags the thumb and jumps to track presses', async () => {
    const screen = render(() => <ScrollArea scrollbarMode="always" />)
    const { viewport, scrollbar } = parts(screen.container)
    setDimensions(viewport, { clientHeight: 100, scrollHeight: 300 })
    const track = scrollbar('vertical')!
    const thumb = track.firstElementChild as HTMLElement
    define(track, {
      clientHeight: 100,
      clientTop: 0,
      getBoundingClientRect: () => ({ top: 0, left: 0 }) as DOMRect,
    })
    define(thumb, { offsetHeight: 20, offsetTop: 0 })
    await waitFor(() => expect(track.hasAttribute('data-visible')).toBe(true))

    fireEvent(thumb, pointer('pointerdown', { clientY: 10 }))
    expect(track.hasAttribute('data-dragging')).toBe(true)
    fireEvent(track, pointer('pointermove', { clientY: 50 }))
    expect(viewport.scrollTop).toBe(100)
    fireEvent(track, pointer('pointermove', { clientY: 500 }))
    expect(viewport.scrollTop).toBe(200)
    fireEvent(track, pointer('pointerup', { clientY: 500 }))
    expect(track.hasAttribute('data-dragging')).toBe(false)
    fireEvent(track, pointer('pointermove', { clientY: 10 }))
    expect(viewport.scrollTop).toBe(200)

    fireEvent(track, pointer('pointerdown', { clientY: 10 }))
    expect(viewport.scrollTop).toBe(0)
    fireEvent(track, pointer('pointerup', { clientY: 10 }))
    fireEvent(track, pointer('pointerdown', { clientY: 50, button: 2 }))
    expect(viewport.scrollTop).toBe(0)
  })

  test('forwards wheel input over scrollbars to the viewport only while it can scroll', () => {
    const screen = render(() => <ScrollArea orientation="both" />)
    const { viewport, scrollbar } = parts(screen.container)
    setDimensions(viewport, {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 100,
      scrollWidth: 300,
    })
    const track = scrollbar('vertical')!

    viewport.scrollTop = 100
    const mid = new WheelEvent('wheel', { deltaY: 24, cancelable: true })
    fireEvent(track, mid)
    expect(mid.defaultPrevented).toBe(true)
    expect(viewport.scrollTop).toBe(124)

    viewport.scrollTop = 200
    const atEnd = new WheelEvent('wheel', { deltaY: 24, cancelable: true })
    fireEvent(track, atEnd)
    expect(atEnd.defaultPrevented).toBe(false)
    expect(viewport.scrollTop).toBe(200)
  })

  test('translates page-mode wheel deltas per axis', () => {
    const screen = render(() => <ScrollArea orientation="both" />)
    const { viewport, scrollbar } = parts(screen.container)
    setDimensions(viewport, {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 100,
      scrollWidth: 300,
    })
    const track = scrollbar('horizontal')!

    viewport.scrollLeft = 10
    const pageX = new WheelEvent('wheel', { deltaX: 1, deltaMode: 2, cancelable: true })
    fireEvent(track, pageX)
    expect(pageX.defaultPrevented).toBe(true)
    expect(viewport.scrollLeft).toBe(110)

    const vertical = scrollbar('vertical')!
    viewport.scrollTop = 10
    const pageY = new WheelEvent('wheel', { deltaY: 1, deltaMode: 2, cancelable: true })
    fireEvent(vertical, pageY)
    expect(pageY.defaultPrevented).toBe(true)
    expect(viewport.scrollTop).toBe(110)
  })

  test('releases observers and listeners on unmount', () => {
    const { observe, disconnect, resize } = stubResizeObserver()
    const onOverflowChange = vi.fn()
    const screen = render(() => (
      <ScrollArea onOverflowChange={onOverflowChange}>
        <p>Content</p>
      </ScrollArea>
    ))
    const { root, viewport, content } = parts(screen.container)
    expect(observe).toHaveBeenCalledWith(viewport)
    expect(observe).toHaveBeenCalledWith(content)

    setDimensions(viewport, { clientHeight: 100, scrollHeight: 300 })
    resize()
    expect(edges(root, 'y')).toEqual([false, true])

    screen.unmount()
    onOverflowChange.mockClear()
    setDimensions(viewport, { scrollHeight: 100 })
    resize()
    fireEvent.scroll(viewport)
    expect(onOverflowChange).not.toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalled()
  })

  test('uses theme defaults and resolves the shadow size from theme, prop, and overrides', () => {
    const theme = defineTheme({
      scrollArea: {
        defaultVariants: { fade: true, scrollbarMode: 'native' },
        base: { root: 'theme-scroll-root', '--scroll-area-shadow-size': '18px' },
      },
    })
    const [fadeSize, setFadeSize] = createSignal<number>()
    const [styles, setStyles] = createSignal<ScrollAreaT.Styles>({ root: { height: '100px' } })
    const [style, setStyle] = createSignal<ScrollAreaT.Props['style']>({ width: '200px' })
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <ScrollArea
          fadeSize={fadeSize()}
          tabIndex={-1}
          class="custom-root"
          classes={{ viewport: 'custom-viewport' }}
          styles={styles()}
          style={style()}
        />
      </MoraineProvider>
    ))
    const { root, viewport, scrollbar } = parts(screen.container)
    const size = () => root.style.getPropertyValue('--scroll-area-shadow-size')
    expect(scrollbar('vertical')).toBeNull()
    expect(viewport.tabIndex).toBe(-1)
    expect(viewport.className).toContain('custom-viewport')
    expect(viewport.getAttribute('style')).toContain('mask-image')
    expect(root.className).toContain('theme-scroll-root')
    expect(root.className).toContain('custom-root')
    expect(root.style.height).toBe('100px')
    expect(root.style.width).toBe('200px')
    expect(size()).toBe('18px')

    setFadeSize(24)
    expect(size()).toBe('24px')
    setStyles({ root: { height: '100px', '--scroll-area-shadow-size': '30px' } })
    expect(size()).toBe('30px')
    setStyle({ width: '200px', '--scroll-area-shadow-size': '36px' })
    expect(size()).toBe('36px')
    setStyle({ width: '200px' })
    setStyles({ root: { height: '100px' } })
    expect(size()).toBe('24px')
    setFadeSize(undefined)
    expect(size()).toBe('18px')
  })
})
