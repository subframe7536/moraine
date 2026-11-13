import type { Accessor } from 'solid-js'
import { createSignal } from 'solid-js'

import { bindElement } from '../../shared/element-binding'
import { createEventListener } from '../../shared/event-listener'

export interface AxisMetrics {
  /** Visible size in px. */
  readonly client: number
  /** Scrollable distance in px. */
  readonly extent: number
  /** Distance from the logical start edge in px, within `[0, extent]`. */
  readonly position: number
}

export interface ScrollMetrics {
  readonly x: AxisMetrics
  readonly y: AxisMetrics
  readonly rtl: boolean
}

export const EMPTY_AXIS_METRICS: AxisMetrics = { client: 0, extent: 0, position: 0 }

const EMPTY_METRICS: ScrollMetrics = { x: EMPTY_AXIS_METRICS, y: EMPTY_AXIS_METRICS, rtl: false }

function sameAxis(a: AxisMetrics, b: AxisMetrics): boolean {
  return a.client === b.client && a.extent === b.extent && a.position === b.position
}

function readAxis(element: HTMLElement, horizontal: boolean, rtl: boolean): AxisMetrics {
  const client = horizontal ? element.clientWidth : element.clientHeight
  const extent = Math.max(0, (horizontal ? element.scrollWidth : element.scrollHeight) - client)
  // RTL scrollLeft is negative from the right edge in modern browsers.
  const offset = horizontal ? (rtl ? -element.scrollLeft : element.scrollLeft) : element.scrollTop
  return { client, extent, position: Math.max(0, Math.min(offset, extent)) }
}

/**
 * Measures a scroll container on scroll, on its own size changes, and on content size changes.
 * The first measurement runs in a microtask so hydration completes before measured state changes.
 */
export function createScrollMetrics(
  viewport: Accessor<HTMLElement | undefined>,
  onScroll: () => void,
): Accessor<ScrollMetrics> {
  const [metrics, setMetrics] = createSignal(EMPTY_METRICS, {
    equals: (a, b) => a.rtl === b.rtl && sameAxis(a.x, b.x) && sameAxis(a.y, b.y),
  })

  bindElement(viewport, (element) => {
    let disposed = false

    function measure(): void {
      // A new element can still belong to the inert template document while it binds, so the
      // window is resolved at measurement time.
      const view = element.ownerDocument.defaultView
      if (disposed || !view) {
        return
      }
      const rtl = view.getComputedStyle(element).direction === 'rtl'
      setMetrics({ x: readAxis(element, true, rtl), y: readAxis(element, false, rtl), rtl })
    }

    // Observing the viewport covers window resizes; its only child, the content wrapper,
    // follows the scrolled content.
    const resizeObserver =
      typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : undefined
    resizeObserver?.observe(element)
    for (const child of element.children) {
      resizeObserver?.observe(child)
    }
    createEventListener(
      element,
      'scroll',
      () => {
        measure()
        onScroll()
      },
      { passive: true },
    )
    createEventListener(element, 'load', measure, true)
    queueMicrotask(measure)

    return () => {
      disposed = true
      resizeObserver?.disconnect()
    }
  })

  return metrics
}
