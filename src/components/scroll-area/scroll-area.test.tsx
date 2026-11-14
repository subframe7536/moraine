import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { Component } from 'solid-js'
import { For, createEffect, createRoot, createSignal, on } from 'solid-js'
import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'
import type { ListVirtualizer, VirtualRenderProps } from '../../virtualizer/virtualizer.types'

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
    const onReachStart = vi.fn()
    const onReachEnd = vi.fn()
    const screen = render(() => (
      <ScrollArea
        edgeThreshold={10}
        onOverflowChange={onOverflowChange}
        onReachStart={onReachStart}
        onReachEnd={onReachEnd}
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
    expect(onReachEnd).toHaveBeenCalledExactlyOnceWith('y')

    viewport.scrollTop = 0
    fireEvent.scroll(viewport)
    expect(onReachStart).toHaveBeenCalledExactlyOnceWith('y')

    // Content that stops overflowing does not count as reaching an edge.
    setDimensions(viewport, { scrollHeight: 100 })
    fireEvent.scroll(viewport)
    expect(edges(root, 'y')).toEqual([false, false])
    expect(root.hasAttribute('data-overflow-y')).toBe(false)
    expect(onReachEnd).toHaveBeenCalledTimes(1)
  })

  test.each(['ltr', 'rtl'] as const)(
    'tracks logical horizontal edges in %s content',
    async (direction) => {
      const screen = render(() => (
        <ScrollArea orientation="horizontal" styles={{ viewport: { direction } }} />
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

      viewport.scrollLeft = direction === 'rtl' ? -250 : 250
      fireEvent.scroll(viewport)
      expect(edges(root, 'x')).toEqual([true, false])
      expect(edges(root, 'y')).toEqual([false, false])
    },
  )

  test('scrolls both axes with two scrollbars and a corner', async () => {
    const screen = render(() => <ScrollArea orientation="both" />)
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
    viewport.scrollTop = 150
    fireEvent.scroll(viewport)
    expect(thumb.style.top).toBe('calc(0.5 * (100% - max(20px, 25%)))')

    setDimensions(viewport, { scrollWidth: 100 })
    fireEvent.scroll(viewport)
    expect(corner.hasAttribute('data-visible')).toBe(false)
    expect(scrollbar('horizontal')?.hasAttribute('data-visible')).toBe(false)
  })

  test('shows scrollbars according to the scrollbar mode', async () => {
    vi.useFakeTimers()
    const [mode, setMode] = createSignal<ScrollAreaT.Variants['scrollbar']>('hover')
    const screen = render(() => <ScrollArea scrollbar={mode()} scrollHideDelay={300} />)
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

    setMode('auto')
    expect(visible()).toBe(true)
    setDimensions(viewport, { scrollHeight: 100 })
    fireEvent.scroll(viewport)
    expect(visible()).toBe(false)
    setMode('always')
    expect(visible()).toBe(true)

    setMode('native')
    expect(scrollbar('vertical')).toBeNull()
    setMode('hidden')
    expect(scrollbar('vertical')).toBeNull()
  })

  test('drags the thumb and jumps to track presses', async () => {
    const screen = render(() => <ScrollArea />)
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

  test('scrolls to logical edges through the controller', async () => {
    const scrollTo = vi.fn()
    let controller: ScrollAreaT.Controller | undefined
    const screen = render(() => (
      <ScrollArea
        orientation="both"
        styles={{ viewport: { direction: 'rtl' } }}
        controllerRef={(value) => (controller = value)}
      />
    ))
    const { viewport } = parts(screen.container)
    define(viewport, { scrollTo })
    setDimensions(viewport, {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 100,
      scrollWidth: 300,
    })
    await waitFor(() => expect(controller?.overflow.y.end).toBe(true))
    expect(controller?.overflow.x).toEqual({ start: false, end: true })

    controller?.scrollToEdge('y', 'end', { behavior: 'smooth' })
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 300, behavior: 'smooth' })
    controller?.scrollToEdge('x', 'end')
    expect(scrollTo).toHaveBeenLastCalledWith({ left: -300 })
    controller?.scrollToEdge('x', 'start')
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0 })
  })

  test('renders items with itemRender and mounts a virtualizer on the viewport', () => {
    const ItemRender: Component<ScrollAreaT.ItemRenderProps<string>> = (props) => (
      <p data-virtual={props.props ? '' : undefined}>
        {props.index}:{props.item}
      </p>
    )
    let scrollElement: HTMLElement | undefined
    const virtualizer: ListVirtualizer<string> = {
      virtualRender: (props: VirtualRenderProps<string>) => {
        createEffect(
          on(
            () => props.scrollElement,
            (element) => (scrollElement = element),
          ),
        )
        return (
          <For each={props.entries}>
            {(entry, index) => <>{props.render(entry, index(), {})}</>}
          </For>
        )
      },
      scrollToIndex: vi.fn(),
    }
    const [virtual, setVirtual] = createSignal<ListVirtualizer<string>>()
    const screen = render(() => (
      <ScrollArea items={['a', 'b']} itemRender={ItemRender} virtualizer={virtual()}>
        <span>Ignored</span>
      </ScrollArea>
    ))
    expect(screen.getByText('0:a').hasAttribute('data-virtual')).toBe(false)
    expect(screen.queryByText('Ignored')).toBeNull()

    setVirtual(() => virtualizer)
    expect(screen.getByText('1:b').hasAttribute('data-virtual')).toBe(true)
    expect(scrollElement).toBe(parts(screen.container).viewport)
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
        defaultVariants: { shadow: true, scrollbar: 'native' },
        base: { root: 'theme-scroll-root', '--scroll-area-shadow-size': '18px' },
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
    expect(viewport.className).toContain('mask-image')
    expect(root.className).toContain('theme-scroll-root')
    expect(root.className).toContain('custom-root')
    expect(root.style.height).toBe('100px')
    expect(root.style.width).toBe('200px')
    expect(size()).toBe('18px')

    setShadowSize(24)
    expect(size()).toBe('24px')
    setStyles({ root: { height: '100px', '--scroll-area-shadow-size': '30px' } })
    expect(size()).toBe('30px')
    setStyle({ width: '200px', '--scroll-area-shadow-size': '36px' })
    expect(size()).toBe('36px')
    setStyle({ width: '200px' })
    setStyles({ root: { height: '100px' } })
    expect(size()).toBe('24px')
    setShadowSize(undefined)
    expect(size()).toBe('18px')
  })
})
