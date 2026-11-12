import type { Virtualizer } from '@tanstack/virtual-core'
import { createComputed, createRoot, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { createSharedElementOffsetObserver } from './offset-observer'

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

describe('createSharedElementOffsetObserver', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.body.replaceChildren()
  })

  test('reports the vertical, horizontal, and RTL offsets of one scroll element', () => {
    const { element, position } = scrollableElement()
    const observe = createSharedElementOffsetObserver()
    const vertical = vi.fn()
    const horizontal = vi.fn()
    const rtl = vi.fn()

    const stopVertical = observe(fakeInstance(element), vertical)
    const stopHorizontal = observe(fakeInstance(element, { horizontal: true }), horizontal)
    const stopRtl = observe(fakeInstance(element, { horizontal: true, isRtl: true }), rtl)

    position.top = 40
    position.left = -30
    element.dispatchEvent(new Event('scroll'))
    expect(vertical).toHaveBeenLastCalledWith(40, true)
    expect(horizontal).toHaveBeenLastCalledWith(-30, true)
    expect(rtl).toHaveBeenLastCalledWith(30, true)

    stopVertical?.()
    stopHorizontal?.()
    stopRtl?.()
    vertical.mockClear()
    element.dispatchEvent(new Event('scroll'))
    expect(vertical).not.toHaveBeenCalled()
  })

  test('notifies every subscriber of one scroll event in a single batch', () => {
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

  test('drops the pending end-of-scroll report when the last subscriber leaves', () => {
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

  test('returns no subscription before the instance has a scroll element', () => {
    const observe = createSharedElementOffsetObserver()
    const instance = {
      scrollElement: null,
      targetWindow: null,
      options: {},
    } as unknown as Virtualizer<HTMLElement, HTMLElement>
    expect(observe(instance, vi.fn())).toBeUndefined()
  })
})
