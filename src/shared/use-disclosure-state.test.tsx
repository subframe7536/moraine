import { createRoot, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { useDisclosureState } from './use-disclosure-state.ts'

function setScrollHeight(element: HTMLElement, getValue: () => number): void {
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    get: getValue,
  })
}

interface ResizeObserverRecord {
  disconnect: ReturnType<typeof vi.fn>
  notify: () => void
  observe: ReturnType<typeof vi.fn>
}

function installResizeObserverMock(): ResizeObserverRecord[] {
  const records: ResizeObserverRecord[] = []

  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = vi.fn()
      observe = vi.fn()
      unobserve = vi.fn()

      constructor(callback: ResizeObserverCallback) {
        records.push({
          disconnect: this.disconnect,
          notify: () => callback([], this as ResizeObserver),
          observe: this.observe,
        })
      }
    },
  )

  return records
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useDisclosureState', () => {
  test('exposes reactive open and disabled data attributes', () => {
    createRoot((dispose) => {
      const [open, setOpen] = createSignal(false)
      const [disabled, setDisabled] = createSignal(false)
      const state = useDisclosureState({ open, disabled })

      expect(state.disabled()).toBe(false)
      expect(state.dataAttrs()).toEqual({
        'data-closed': '',
        'data-disabled': undefined,
        'data-expanded': undefined,
      })

      setOpen(true)
      setDisabled(true)

      expect(state.disabled()).toBe(true)
      expect(state.dataAttrs()).toEqual({
        'data-closed': undefined,
        'data-disabled': '',
        'data-expanded': '',
      })
      dispose()
    })
  })

  test('ignores a queued measurement after the content element detaches', async () => {
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useDisclosureState({ open: () => true }),
    }))
    const element = document.createElement('div')
    let scrollHeight = 10
    setScrollHeight(element, () => scrollHeight)
    document.body.append(element)

    lifecycle.state.setContentElement(element)
    expect(lifecycle.state.contentHeight()).toBe(10)

    scrollHeight = 20
    element.remove()
    await Promise.resolve()

    expect(lifecycle.state.contentHeight()).toBe(10)
    lifecycle.dispose()
  })

  test('remeasures connected content when its size changes', () => {
    const observers = installResizeObserverMock()

    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useDisclosureState({ open: () => true }),
    }))
    const element = document.createElement('div')
    let scrollHeight = 10
    setScrollHeight(element, () => scrollHeight)
    document.body.append(element)

    lifecycle.state.setContentElement(element)
    scrollHeight = 20

    expect(observers[0]?.observe).toHaveBeenCalledWith(element)
    observers[0]?.notify()

    expect(lifecycle.state.contentHeight()).toBe(20)
    element.remove()
    lifecycle.dispose()
    expect(observers[0]?.disconnect).toHaveBeenCalledTimes(1)
  })

  test('remeasures the current element after open state changes', async () => {
    const lifecycle = createRoot((dispose) => {
      const [open, setOpen] = createSignal(false)
      return {
        dispose,
        setOpen,
        state: useDisclosureState({ open }),
      }
    })
    const element = document.createElement('div')
    let scrollHeight = 0
    setScrollHeight(element, () => scrollHeight)
    document.body.append(element)

    lifecycle.state.setContentElement(element)
    await Promise.resolve()
    expect(lifecycle.state.contentHeight()).toBe(0)

    scrollHeight = 24
    lifecycle.setOpen(true)
    await Promise.resolve()

    expect(lifecycle.state.contentHeight()).toBe(24)
    element.remove()
    lifecycle.dispose()
  })

  test('disconnects and ignores measurements from a superseded element', async () => {
    const observers = installResizeObserverMock()
    const lifecycle = createRoot((dispose) => ({
      dispose,
      state: useDisclosureState({ open: () => true }),
    }))
    const firstElement = document.createElement('div')
    const secondElement = document.createElement('div')
    let firstHeight = 10
    let secondHeight = 20
    setScrollHeight(firstElement, () => firstHeight)
    setScrollHeight(secondElement, () => secondHeight)
    document.body.append(firstElement, secondElement)

    lifecycle.state.setContentElement(firstElement)
    lifecycle.state.setContentElement(secondElement)

    expect(observers[0]?.disconnect).toHaveBeenCalledTimes(1)
    expect(lifecycle.state.contentHeight()).toBe(20)

    firstHeight = 30
    observers[0]?.notify()
    await Promise.resolve()

    expect(lifecycle.state.contentHeight()).toBe(20)

    secondHeight = 25
    observers[1]?.notify()

    expect(lifecycle.state.contentHeight()).toBe(25)
    firstElement.remove()
    secondElement.remove()
    lifecycle.dispose()
    expect(observers[1]?.disconnect).toHaveBeenCalledTimes(1)
  })

  test('constructs without layout APIs or a mounted element', () => {
    vi.stubGlobal('ResizeObserver', undefined)

    expect(() => {
      createRoot((dispose) => {
        const [open, setOpen] = createSignal(false)
        const state = useDisclosureState({ open })

        expect(state.contentHeight()).toBe(0)
        setOpen(true)
        expect(state.contentHeight()).toBe(0)
        dispose()
      })
    }).not.toThrow()
  })
})
