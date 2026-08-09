import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import type { RowProps } from './use-list-virtualizer.tsx'
import { useListVirtualizer } from './use-list-virtualizer.tsx'

describe('useListVirtualizer', () => {
  test('defers scroll-element attachment and client rows until after the hydration microtask', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const renderRow = vi.fn((item: string, _index: number, props) => <div {...props}>{item}</div>)
    let virtualizer: ReturnType<typeof useListVirtualizer<string>> | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<string>({
        estimateSize: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: ['one'],
        scrollElement,
        render: renderRow,
      })
    })

    expect(virtualizer?.instance()).toBeUndefined()
    expect(renderRow).not.toHaveBeenCalled()

    await Promise.resolve()

    expect(virtualizer?.instance()?.scrollElement).toBe(scrollElement)
    expect(renderRow).toHaveBeenCalledOnce()
    expect(screen.getByText('one').isConnected).toBe(true)
    screen.unmount()
    scrollElement.remove()
  })

  test('releases core observers and the public instance on unmount', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const cleanupRect = vi.fn()
    const cleanupOffset = vi.fn()
    let virtualizer: ReturnType<typeof useListVirtualizer<string>> | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<string>({
        estimateSize: () => 20,
        observeElementRect: (_instance, callback) => {
          callback({ width: 100, height: 40 })
          return cleanupRect
        },
        observeElementOffset: (_instance, callback) => {
          callback(0, false)
          return cleanupOffset
        },
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: ['one', 'two'],
        scrollElement,
        render: (item, index, props) => <div {...props} data-item={item} data-row={index} />,
      })
    })

    await Promise.resolve()
    expect(virtualizer?.instance()?.scrollElement).toBe(scrollElement)

    screen.unmount()

    expect(cleanupRect).toHaveBeenCalledOnce()
    expect(cleanupOffset).toHaveBeenCalledOnce()
    expect(virtualizer?.instance()).toBeUndefined()
    scrollElement.remove()
  })

  test('resolves the row render prop once while creating each visible row once', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    let renderGetterReads = 0
    const renderRow = vi.fn((item: string, _index: number, props?: RowProps) => (
      <div {...props}>{item}</div>
    ))

    const screen = render(() => {
      const virtualizer = useListVirtualizer<string>({
        estimateSize: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: ['one', 'two'],
        scrollElement,
        get render() {
          renderGetterReads += 1
          return renderRow
        },
      })
    })

    await Promise.resolve()

    expect(renderGetterReads).toBe(1)
    expect(renderRow).toHaveBeenCalledTimes(2)
    screen.unmount()
    scrollElement.remove()
  })

  test('rebuilds row identity and content when entries are rapidly replaced', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const [entries, setEntries] = createSignal([
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ])
    let virtualizer:
      | ReturnType<typeof useListVirtualizer<{ id: string; label: string }>>
      | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<{ id: string; label: string }>({
        estimateSize: () => 20,
        getItemKey: (item) => item.id,
        observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        get entries() {
          return entries()
        },
        scrollElement,
        render: (item, _index, props) => (
          <div {...props} data-key={item.id}>
            {item.label}
          </div>
        ),
      })
    })

    await Promise.resolve()
    expect(
      virtualizer
        ?.instance()
        ?.getVirtualItems()
        .map((item) => item.key),
    ).toEqual(['a', 'b'])

    setEntries([
      { id: 'b', label: 'Beta updated' },
      { id: 'a', label: 'Alpha updated' },
    ])
    await Promise.resolve()

    expect(
      virtualizer
        ?.instance()
        ?.getVirtualItems()
        .map((item) => item.key),
    ).toEqual(['b', 'a'])
    expect(screen.container.querySelectorAll('[data-key]')[0]?.textContent).toBe('Beta updated')
    expect(screen.container.querySelectorAll('[data-key]')[1]?.textContent).toBe('Alpha updated')
    screen.unmount()
    scrollElement.remove()
  })

  test('invalidates unmeasured layout when reactive estimates change', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const entries = Array.from({ length: 100 }, (_, index) => `Item ${index}`)
    const [estimatedSize, setEstimatedSize] = createSignal(20)
    let virtualizer: ReturnType<typeof useListVirtualizer<string>> | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<string>({
        estimateSize: () => estimatedSize(),
        measureElement: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 100, height: 20 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
        overscan: 0,
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries,
        scrollElement,
        render: (item, _index, props) => <div {...props}>{item}</div>,
      })
    })

    await Promise.resolve()
    expect(virtualizer?.instance()?.getTotalSize()).toBe(2000)

    setEstimatedSize(40)
    await Promise.resolve()

    expect(virtualizer?.instance()?.getTotalSize()).toBeGreaterThan(3000)
    screen.unmount()
    scrollElement.remove()
  })

  test('retargets delayed and replaced scroll elements without retaining observers', async () => {
    const firstElement = document.createElement('div')
    const secondElement = document.createElement('div')
    document.body.append(firstElement, secondElement)
    const [scrollElement, setScrollElement] = createSignal<HTMLElement>()
    const observedElements: Array<HTMLElement | null> = []
    const cleanups: Array<ReturnType<typeof vi.fn>> = []

    const screen = render(() => {
      const virtualizer = useListVirtualizer<string>({
        estimateSize: () => 20,
        observeElementRect: (instance, callback) => {
          observedElements.push(instance.scrollElement)
          callback({ width: 100, height: 20 })
          const cleanup = vi.fn()
          cleanups.push(cleanup)
          return cleanup
        },
        observeElementOffset: (_instance, callback) => callback(0, false),
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: ['one'],
        get scrollElement() {
          return scrollElement()
        },
        render: (item, _index, props) => <div {...props}>{item}</div>,
      })
    })

    await Promise.resolve()
    expect(observedElements).toEqual([])

    setScrollElement(firstElement)
    expect(observedElements).toEqual([firstElement])

    setScrollElement(secondElement)
    expect(cleanups[0]).toHaveBeenCalledOnce()
    expect(observedElements).toEqual([firstElement, secondElement])

    setScrollElement(undefined)
    expect(cleanups[1]).toHaveBeenCalledOnce()
    screen.unmount()
    firstElement.remove()
    secondElement.remove()
  })

  test('forwards scrolling to the current instance and becomes inert after unmount', async () => {
    const scrollElement = document.createElement('div')
    Object.defineProperties(scrollElement, {
      clientHeight: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 200 },
    })
    document.body.append(scrollElement)
    const scrollToFn = vi.fn()
    let virtualizer: ReturnType<typeof useListVirtualizer<string>> | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<string>({
        estimateSize: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
        scrollToFn,
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: Array.from({ length: 10 }, (_, index) => `Item ${index}`),
        scrollElement,
        render: (item, _index, props) => <div {...props}>{item}</div>,
      })
    })

    await Promise.resolve()
    scrollToFn.mockClear()

    virtualizer?.scrollToIndex(3, { align: 'start' })
    expect(scrollToFn).toHaveBeenCalledWith(
      60,
      expect.objectContaining({ behavior: 'auto' }),
      virtualizer?.instance(),
    )

    screen.unmount()
    scrollToFn.mockClear()
    virtualizer?.scrollToIndex(4)
    expect(scrollToFn).not.toHaveBeenCalled()
    scrollElement.remove()
  })

  test('supports zero items when ResizeObserver is unavailable', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver')
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: undefined })
    const renderRow = vi.fn()
    let virtualizer: ReturnType<typeof useListVirtualizer<string>> | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<string>({ estimateSize: () => 20 })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: [],
        scrollElement,
        render: renderRow,
      })
    })

    await Promise.resolve()

    expect(virtualizer?.instance()?.getTotalSize()).toBe(0)
    expect(renderRow).not.toHaveBeenCalled()
    screen.unmount()

    if (resizeObserverDescriptor) {
      Object.defineProperty(window, 'ResizeObserver', resizeObserverDescriptor)
    } else {
      Reflect.deleteProperty(window, 'ResizeObserver')
    }
    scrollElement.remove()
  })

  test('cancels a deferred attachment when unmounted before the hydration microtask', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const observeElementRect = vi.fn()
    let virtualizer: ReturnType<typeof useListVirtualizer<string>> | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<string>({
        estimateSize: () => 20,
        observeElementRect,
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: ['one'],
        scrollElement,
        render: (item, _index, props) => <div {...props}>{item}</div>,
      })
    })

    screen.unmount()
    await Promise.resolve()

    expect(observeElementRect).not.toHaveBeenCalled()
    expect(virtualizer?.instance()).toBeUndefined()
    scrollElement.remove()
  })

  test('unobserves detached rows when the virtual window is replaced', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    let publishOffset: ((offset: number, isScrolling: boolean) => void) | undefined
    let virtualizer: ReturnType<typeof useListVirtualizer<string>> | undefined

    const screen = render(() => {
      virtualizer = useListVirtualizer<string>({
        estimateSize: () => 20,
        measureElement: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
        observeElementOffset: (_instance, callback) => {
          publishOffset = callback
          callback(0, false)
        },
        overscan: 0,
      })
      const VirtualRender = virtualizer.virtualRender

      return createComponent(VirtualRender, {
        entries: Array.from({ length: 100 }, (_, index) => `Item ${index}`),
        scrollElement,
        render: (item, _index, props) => <div {...props}>{item}</div>,
      })
    })

    await Promise.resolve()
    await Promise.resolve()
    publishOffset?.(1000, false)
    await Promise.resolve()
    await Promise.resolve()

    const cachedElements = [...(virtualizer?.instance()?.elementsCache.values() ?? [])]
    expect(cachedElements.length).toBeGreaterThan(0)
    expect(cachedElements.every((element) => element.isConnected)).toBe(true)
    screen.unmount()
    scrollElement.remove()
  })
})
