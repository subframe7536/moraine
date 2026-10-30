import type { Virtualizer } from '@tanstack/virtual-core'
import { batch } from 'solid-js'

import { attachEventListenerMap } from '../shared/event-listener'

type OffsetCallback = (offset: number, isScrolling: boolean) => void

// Same check as `@tanstack/virtual-core`; servers report support so no fallback timer starts.
const SUPPORTS_SCROLLEND = typeof window === 'undefined' ? true : 'onscrollend' in window

const PASSIVE_LISTENER = { passive: true } as const

/**
 * Creates an `observeElementOffset` option that shares one set of scroll listeners per scroll
 * element. Virtualizers on the same element, such as the rows and columns of a table, then get
 * their offsets inside one `batch`, so one scroll event runs downstream computations once.
 *
 * Mirrors `observeOffset` from `@tanstack/virtual-core` 3.19.6: `scrollend` when
 * `useScrollendEvent` is set and supported, otherwise an `isScrollingResetDelay` timer, and a
 * negated horizontal offset in RTL. Recheck it when upgrading `@tanstack/virtual-core`. The first
 * virtualizer that subscribes to an element decides its `scrollend` and delay settings.
 */
export function createSharedElementOffsetObserver(): <
  TScrollElement extends HTMLElement,
  TItemElement extends HTMLElement,
>(
  instance: Virtualizer<TScrollElement, TItemElement>,
  callback: OffsetCallback,
) => (() => void) | undefined {
  interface Subscriber {
    readonly instance: Virtualizer<HTMLElement, HTMLElement>
    readonly callback: OffsetCallback
  }
  interface Listener {
    readonly subscribers: Set<Subscriber>
    readonly dispose: () => void
  }
  const listeners = new Map<HTMLElement, Listener>()

  const readOffset = (instance: Subscriber['instance'], element: HTMLElement): number => {
    const { horizontal, isRtl } = instance.options
    return horizontal ? element.scrollLeft * (isRtl ? -1 : 1) : element.scrollTop
  }

  const listen = (
    element: HTMLElement,
    targetWindow: Window & typeof globalThis,
    first: Subscriber['instance'],
  ): Listener => {
    const subscribers = new Set<Subscriber>()
    const notify = (isScrolling: boolean) =>
      batch(() => {
        for (const subscriber of subscribers) {
          subscriber.callback(readOffset(subscriber.instance, element), isScrolling)
        }
      })
    const useScrollend = first.options.useScrollendEvent && SUPPORTS_SCROLLEND
    const resetDelay = first.options.isScrollingResetDelay
    let resetTimer: number | undefined
    const onScroll = () => {
      if (!useScrollend) {
        targetWindow.clearTimeout(resetTimer)
        resetTimer = targetWindow.setTimeout(() => notify(false), resetDelay)
      }
      notify(true)
    }
    const onScrollEnd = () => notify(false)

    const detach = attachEventListenerMap(
      element,
      { scroll: onScroll, scrollend: useScrollend ? onScrollEnd : undefined },
      PASSIVE_LISTENER,
    )
    return {
      subscribers,
      dispose: () => {
        detach()
        targetWindow.clearTimeout(resetTimer)
      },
    }
  }

  return (instance, callback) => {
    const element = instance.scrollElement
    const targetWindow = instance.targetWindow
    if (!element || !targetWindow) {
      return undefined
    }
    const source = instance as unknown as Subscriber['instance']
    let listener = listeners.get(element)
    if (!listener) {
      listener = listen(element, targetWindow, source)
      listeners.set(element, listener)
    }
    const subscriber: Subscriber = { instance: source, callback }
    listener.subscribers.add(subscriber)
    const current = listener
    return () => {
      current.subscribers.delete(subscriber)
      if (current.subscribers.size === 0) {
        current.dispose()
        if (listeners.get(element) === current) {
          listeners.delete(element)
        }
      }
    }
  }
}
