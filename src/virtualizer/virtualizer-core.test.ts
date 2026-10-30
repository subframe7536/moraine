import type { Virtualizer } from '@tanstack/virtual-core'
import { createComputed, createRoot, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { createSharedElementOffsetObserver } from './virtualizer-core'

function scrollableElement() {
  const element = document.createElement('div')
  const position = { top: 0, left: 0 }
  Object.defineProperties(element, {
    scrollTop: { configurable: true, get: () => position.top },
    scrollLeft: { configurable: true, get: () => position.left },
  })
  document.body.append(element)
  return { element, position }
}

function fakeInstance(
  element: HTMLElement,
  options: { horizontal?: boolean; isRtl?: boolean; useScrollendEvent?: boolean } = {},
): Virtualizer<HTMLElement, HTMLElement> {
  return {
    scrollElement: element,
    targetWindow: window,
    options: {
      horizontal: false,
      isRtl: false,
      useScrollendEvent: false,
      isScrollingResetDelay: 150,
      ...options,
    },
  } as unknown as Virtualizer<HTMLElement, HTMLElement>
}

function scrollListenerCount(add: { mock: { calls: unknown[][] } }, remove: typeof add): number {
  const count = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === 'scroll').length
  return count(add) - count(remove)
}

describe('createSharedElementOffsetObserver', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  test('registers one scroll listener per element and reads each axis', () => {
    const { element, position } = scrollableElement()
    const add = vi.spyOn(element, 'addEventListener')
    const remove = vi.spyOn(element, 'removeEventListener')
    const observe = createSharedElementOffsetObserver()
    const vertical = vi.fn()
    const horizontal = vi.fn()
    const rtl = vi.fn()

    const stopVertical = observe(fakeInstance(element), vertical)
    const stopHorizontal = observe(fakeInstance(element, { horizontal: true }), horizontal)
    const stopRtl = observe(fakeInstance(element, { horizontal: true, isRtl: true }), rtl)
    expect(scrollListenerCount(add, remove)).toBe(1)

    position.top = 40
    position.left = -30
    element.dispatchEvent(new Event('scroll'))
    expect(vertical).toHaveBeenLastCalledWith(40, true)
    expect(horizontal).toHaveBeenLastCalledWith(-30, true)
    expect(rtl).toHaveBeenLastCalledWith(30, true)

    stopVertical?.()
    stopHorizontal?.()
    expect(scrollListenerCount(add, remove)).toBe(1)
    stopRtl?.()
    expect(scrollListenerCount(add, remove)).toBe(0)
  })

  test('notifies every subscriber inside one batch', () => {
    const { element, position } = scrollableElement()
    const observe = createSharedElementOffsetObserver()
    const [top, setTop] = createSignal(0)
    const [left, setLeft] = createSignal(0)
    observe(fakeInstance(element), (offset) => setTop(offset))
    observe(fakeInstance(element, { horizontal: true }), (offset) => setLeft(offset))

    const seen: string[] = []
    const dispose = createRoot((dispose) => {
      createComputed(() => seen.push(`${top()},${left()}`))
      return dispose
    })

    position.top = 10
    position.left = 20
    element.dispatchEvent(new Event('scroll'))
    expect(seen).toEqual(['0,0', '10,20'])
    dispose()
  })

  test('reports the end of scrolling after the reset delay without scrollend', () => {
    vi.useFakeTimers()
    const { element, position } = scrollableElement()
    const observe = createSharedElementOffsetObserver()
    const callback = vi.fn()
    observe(fakeInstance(element), callback)

    position.top = 5
    element.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(100)
    element.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(100)
    expect(callback.mock.calls).toEqual([
      [5, true],
      [5, true],
    ])

    vi.advanceTimersByTime(50)
    expect(callback).toHaveBeenLastCalledWith(5, false)
  })

  test('stops the pending reset timer when the last subscriber leaves', () => {
    vi.useFakeTimers()
    const { element } = scrollableElement()
    const observe = createSharedElementOffsetObserver()
    const callback = vi.fn()
    const stop = observe(fakeInstance(element), callback)

    element.dispatchEvent(new Event('scroll'))
    stop?.()
    vi.advanceTimersByTime(500)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('uses scrollend when the first subscriber enables it and it is supported', () => {
    const { element, position } = scrollableElement()
    const add = vi.spyOn(element, 'addEventListener')
    const observe = createSharedElementOffsetObserver()
    const callback = vi.fn()
    observe(fakeInstance(element, { useScrollendEvent: true }), callback)

    const supported = 'onscrollend' in window
    expect(add.mock.calls.some(([type]) => type === 'scrollend')).toBe(supported)
    if (supported) {
      position.top = 8
      element.dispatchEvent(new Event('scrollend'))
      expect(callback).toHaveBeenLastCalledWith(8, false)
    }
  })

  test('does nothing before the instance has a scroll element', () => {
    const observe = createSharedElementOffsetObserver()
    const instance = {
      scrollElement: null,
      targetWindow: null,
      options: {},
    } as unknown as Virtualizer<HTMLElement, HTMLElement>
    expect(observe(instance, vi.fn())).toBeUndefined()
  })
})
