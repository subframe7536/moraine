import type { JSX } from '@solidjs/web'
import { For, Show, createEffect, createMemo, createSignal, onCleanup, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { EMPTY_AXIS_METRICS, createScrollMetrics } from '../../shared/scroll-metrics'
import type { AxisMetrics } from '../../shared/scroll-metrics'
import { callHandler, callRef, pick } from '../../shared/utils'

import {
  SCROLL_AREA_SCROLLBAR_CLASS,
  SCROLL_AREA_SHADOW_STYLE,
  SCROLL_AREA_THUMB_MIN_SIZE,
  scrollAreaDataAttributes,
  scrollAreaRecipe,
} from './scroll-area.recipe'
import type { ScrollAreaProps, ScrollAreaT } from './scroll-area.types'
type Orientation = NonNullable<ScrollAreaT.Variants['orientation']>
type ScrollbarWidth = NonNullable<ScrollAreaT.Variants['scrollbarWidth']>
type ScrollbarMode = NonNullable<ScrollAreaT.Variants['scrollbarMode']>

const AXES = { vertical: ['y'], horizontal: ['x'], both: ['y', 'x'] } as const

const AXIS_CONFIG = {
  y: {
    clientSize: (el: HTMLElement) => el.clientHeight,
    scrollSize: (el: HTMLElement) => el.scrollHeight,
    getScroll: (el: HTMLElement) => el.scrollTop,
    setScroll: (el: HTMLElement, val: number) => {
      el.scrollTop = val
    },
    thumbOffset: (thumb: HTMLElement) => thumb.offsetTop,
    thumbSize: (thumb: HTMLElement) => thumb.offsetHeight,
    trackOffset: (track: HTMLElement, event: PointerEvent) =>
      event.clientY - track.getBoundingClientRect().top - track.clientTop,
    thumbStyle: (offset: string, size: string): JSX.CSSProperties => ({
      top: offset,
      height: size,
    }),
  },
  x: {
    clientSize: (el: HTMLElement) => el.clientWidth,
    scrollSize: (el: HTMLElement) => el.scrollWidth,
    getScroll: (el: HTMLElement) => el.scrollLeft,
    setScroll: (el: HTMLElement, val: number) => {
      el.scrollLeft = val
    },
    thumbOffset: (thumb: HTMLElement) => thumb.offsetLeft,
    thumbSize: (thumb: HTMLElement) => thumb.offsetWidth,
    trackOffset: (track: HTMLElement, event: PointerEvent) =>
      event.clientX - track.getBoundingClientRect().left - track.clientLeft,
    thumbStyle: (offset: string, size: string): JSX.CSSProperties => ({
      // Logical offset: the thumb sits at the inline start of the track, which is the right in RTL.
      'inset-inline-start': offset,
      width: size,
    }),
  },
} as const

function sameOverflow(a: ScrollAreaT.Overflow, b: ScrollAreaT.Overflow): boolean {
  return (
    a.x.start === b.x.start && a.x.end === b.x.end && a.y.start === b.y.start && a.y.end === b.y.end
  )
}

/** Flag that turns off `delay` milliseconds after `release`. */
function createReleaseDelay(delay: () => number) {
  const [active, setActive] = createSignal(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  return {
    active,
    hold(): void {
      clearTimeout(timer)
      setActive(true)
    },
    release(): void {
      clearTimeout(timer)
      timer = setTimeout(() => setActive(false), delay())
    },
  }
}

/**
 * Native scroll container that constrains overflowing content and draws custom scrollbars over
 * it. Scrolling stays native (wheel, touch, keyboard), so give the root a height or maximum height
 * for vertical scrolling and a width for horizontal scrolling. When the area is a landmark of
 * its own, label it with `role="region"` and `aria-label`.
 *
 * @example
 * ```tsx
 * import { For, omit } from 'solid-js'
 * import { ScrollArea } from 'moraine'
 *
 * <ScrollArea class="h-48 w-full" role="region" aria-label="Recent activity">
 *   <For each={Array.from({ length: 12 }, (_, index) => index + 1)}>
 *     {(entry) => <p class="py-2 text-sm">Activity entry {entry}</p>}
 *   </For>
 * </ScrollArea>
 * ```
 */
export function ScrollArea(props: ScrollAreaProps): JSX.Element {
  const local = pick(
    props,
    'ref',
    'viewportRef',
    'children',
    'orientation',
    'scrollbarMode',
    'scrollbarWidth',
    'fade',
    'fadeSize',
    'scrollThreshold',
    'scrollHideDelay',
    'onOverflowChange',
    'onTopReached',
    'onBottomReached',
    'onLeftReached',
    'onRightReached',
    'onScroll',
    'onPointerEnter',
    'onPointerLeave',
    'tabindex',
    'class',
    'style',
    'classes',
    'styles',
  )
  const rest = omit(
    props,
    'ref',
    'viewportRef',
    'children',
    'orientation',
    'scrollbarMode',
    'scrollbarWidth',
    'fade',
    'fadeSize',
    'scrollThreshold',
    'scrollHideDelay',
    'onOverflowChange',
    'onTopReached',
    'onBottomReached',
    'onLeftReached',
    'onRightReached',
    'onScroll',
    'onPointerEnter',
    'onPointerLeave',
    'tabindex',
    'class',
    'style',
    'classes',
    'styles',
  )
  const [viewport, setViewport] = createSignal<HTMLDivElement>()
  const [dragging, setDragging] = createSignal<ScrollAreaT.Axis>()
  const hideDelay = () => local.scrollHideDelay ?? 600
  const scrolling = createReleaseDelay(hideDelay)
  const hovering = createReleaseDelay(hideDelay)
  const metrics = createScrollMetrics(viewport, () => {
    scrolling.hold()
    scrolling.release()
  })

  const {
    slots: { root: rootSlot, viewport: viewportSlot, content: contentSlot, corner: cornerSlot },
    variants,
    slotWith,
  } = useRecipe(scrollAreaRecipe, local, {
    data: {
      root: scrollAreaDataAttributes.root(() => ({
        orientation: orientation(),
        overflowX: axisMetrics('x').extent > 0,
        overflowY: axisMetrics('y').extent > 0,
        overflowXStart: overflow().x.start,
        overflowXEnd: overflow().x.end,
        overflowYStart: overflow().y.start,
        overflowYEnd: overflow().y.end,
        scrolling: scrolling.active(),
        hovering: hovering.active(),
      })),
      corner: scrollAreaDataAttributes.corner(() => ({ visible: cornerVisible() })),
    },
    own: {
      viewport: () => (fade() ? { style: SCROLL_AREA_SHADOW_STYLE } : undefined),
      root: () =>
        local.fadeSize === undefined
          ? undefined
          : { style: { '--scroll-area-shadow-size': `${Math.max(0, local.fadeSize)}px` } },
    },
    enforced: {
      root: () => {
        const x = axisMetrics('x')
        const y = axisMetrics('y')
        return {
          style: {
            '--scroll-area-overflow-x-start': `${x.position}px`,
            '--scroll-area-overflow-x-end': `${x.extent - x.position}px`,
            '--scroll-area-overflow-y-start': `${y.position}px`,
            '--scroll-area-overflow-y-end': `${y.extent - y.position}px`,
            '--scroll-area-shadow-x-direction': metrics().rtl ? 'to left' : 'to right',
          },
        }
      },
    },
  })

  const orientation = (): Orientation => variants.orientation ?? 'vertical'
  const fade = (): boolean => variants.fade ?? false
  const scrollbarWidth = (): ScrollbarWidth => variants.scrollbarWidth ?? 'normal'
  const scrollbarMode = (): ScrollbarMode => variants.scrollbarMode ?? 'hover'
  const axes = (): readonly ScrollAreaT.Axis[] => AXES[orientation()]
  const axisMetrics = (axis: ScrollAreaT.Axis): AxisMetrics =>
    axes().includes(axis) ? metrics()[axis] : EMPTY_AXIS_METRICS
  const customScrollbar = () => scrollbarMode() !== 'native' && scrollbarMode() !== 'hidden'

  const overflow = createMemo(
    (): ScrollAreaT.Overflow => {
      const threshold = Math.max(0, local.scrollThreshold ?? 0)
      const edges = (axis: ScrollAreaT.Axis): ScrollAreaT.AxisOverflow => {
        const { extent, position } = axisMetrics(axis)
        // Scroll positions may be fractional while client and scroll sizes are integers.
        return { start: position > threshold, end: extent - position > threshold + 1 }
      }
      return { x: edges('x'), y: edges('y') }
    },
    { equals: sameOverflow },
  )

  // Unmeasured boxes stay in the tab order until layout sizes are known.
  const canScroll = () =>
    axes().some((axis) => {
      const { client, extent } = metrics()[axis]
      return client === 0 || extent > 0
    })

  const scrollbarVisible = (axis: ScrollAreaT.Axis): boolean => {
    if (axisMetrics(axis).extent <= 0) {
      return false
    }
    const mode = scrollbarMode()
    const active = scrolling.active() || dragging() === axis
    if (mode === 'hover') {
      return active || hovering.active()
    }
    return mode === 'scroll' ? active : true
  }
  const cornerVisible = (): boolean =>
    orientation() === 'both' && scrollbarVisible('x') && scrollbarVisible('y')

  createEffect(
    overflow,
    (current, previous) => {
      local.onOverflowChange?.(current)
      if (!previous) {
        return
      }
      for (const axis of ['x', 'y'] as const) {
        if (axisMetrics(axis).extent <= 0) {
          continue
        }
        const reachedStart = previous[axis].start && !current[axis].start
        const reachedEnd = previous[axis].end && !current[axis].end
        if (axis === 'y') {
          if (reachedStart) {
            local.onTopReached?.()
          }
          if (reachedEnd) {
            local.onBottomReached?.()
          }
        } else {
          // `start`/`end` are logical: in RTL they sit at the right and left edges.
          const rtl = metrics().rtl
          if (reachedStart) {
            ;(rtl ? local.onRightReached : local.onLeftReached)?.()
          }
          if (reachedEnd) {
            ;(rtl ? local.onLeftReached : local.onRightReached)?.()
          }
        }
      }
    },
    { defer: true },
  )

  function thumbStyle(axis: ScrollAreaT.Axis): JSX.CSSProperties {
    const { client, extent, position } = axisMetrics(axis)
    const ratio = client + extent > 0 ? client / (client + extent) : 1
    const progress = extent > 0 ? position / extent : 0
    const size = `max(${SCROLL_AREA_THUMB_MIN_SIZE}px, ${ratio * 100}%)`
    const offset = `calc((100% - ${size}) * ${progress})`
    return AXIS_CONFIG[axis].thumbStyle(offset, size)
  }

  let drag: { pointer: number; thumb: number } | undefined

  /** Scrolls so the thumb starts `thumbOffset` px into its track. */
  function scrollToThumb(axis: ScrollAreaT.Axis, track: HTMLElement, thumbOffset: number): void {
    const element = viewport()
    const thumb = track.firstElementChild as HTMLElement | null
    if (!element || !thumb) {
      return
    }
    const config = AXIS_CONFIG[axis]
    const room = config.clientSize(track) - config.thumbSize(thumb)
    const progress = room > 0 ? Math.max(0, Math.min(thumbOffset / room, 1)) : 0
    const extent = config.scrollSize(element) - config.clientSize(element)
    const target = axis === 'x' && metrics().rtl ? (progress - 1) * extent : progress * extent
    config.setScroll(element, target)
  }

  function endDrag(): void {
    drag = undefined
    setDragging(undefined)
  }

  return (
    <div
      data-slot="scroll-area"
      {...rootSlot}
      {...rest}
      ref={(element) => callRef(local.ref, element)}
      onPointerEnter={(event) => {
        hovering.hold()
        callHandler(event, local.onPointerEnter)
      }}
      onPointerLeave={(event) => {
        hovering.release()
        callHandler(event, local.onPointerLeave)
      }}
    >
      <div
        data-slot="scroll-area-viewport"
        {...viewportSlot}
        tabindex={local.tabindex ?? (canScroll() ? 0 : -1)}
        ref={(element) => {
          setViewport(element)
          callRef(local.viewportRef, element)
        }}
        onScroll={(event) => callHandler(event, local.onScroll)}
      >
        <div data-slot="scroll-area-content" {...contentSlot}>
          {local.children}
        </div>
      </div>
      <Show when={customScrollbar()}>
        <For each={axes()}>
          {(axis) => {
            const scrollbarSlot = slotWith('scrollbar', {
              data: scrollAreaDataAttributes.scrollbar({
                orientation: axis === 'y' ? 'vertical' : 'horizontal',
                visible: () => scrollbarVisible(axis),
                dragging: () => dragging() === axis,
                corner: cornerVisible,
              }),
              own: () => ({
                class: SCROLL_AREA_SCROLLBAR_CLASS[axis][scrollbarWidth()],
              }),
            })
            const thumbSlot = slotWith('thumb', { enforced: () => ({ style: thumbStyle(axis) }) })
            return (
              <div
                data-slot="scroll-area-scrollbar"
                aria-hidden="true"
                {...scrollbarSlot}
                onPointerDown={(event) => {
                  const track = event.currentTarget
                  const thumb = track.firstElementChild as HTMLElement | null
                  if (event.button !== 0 || !thumb) {
                    return
                  }
                  event.preventDefault()
                  const config = AXIS_CONFIG[axis]
                  const pointer = config.trackOffset(track, event)
                  let start = config.thumbOffset(thumb)
                  if (!thumb.contains(event.target)) {
                    // Track presses center the thumb on the pointer, then continue as a drag.
                    start = pointer - config.thumbSize(thumb) / 2
                    scrollToThumb(axis, track, start)
                  }
                  drag = { pointer, thumb: start }
                  track.setPointerCapture?.(event.pointerId)
                  setDragging(axis)
                }}
                onPointerMove={(event) => {
                  if (drag && dragging() === axis) {
                    const track = event.currentTarget
                    scrollToThumb(
                      axis,
                      track,
                      drag.thumb + AXIS_CONFIG[axis].trackOffset(track, event) - drag.pointer,
                    )
                  }
                }}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onWheel={(event) => {
                  const element = viewport()
                  if (!element) {
                    return
                  }
                  // Scrollbars sit outside the viewport, so wheel input over them is forwarded.
                  const unitY =
                    event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1
                  const unitX =
                    event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1
                  const deltaY = event.deltaY * unitY
                  const deltaX = event.deltaX * unitX
                  const canScroll =
                    (deltaY < 0 && element.scrollTop > 0) ||
                    (deltaY > 0 &&
                      element.scrollTop + element.clientHeight < element.scrollHeight) ||
                    (deltaX < 0 && element.scrollLeft > 0) ||
                    (deltaX > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth)
                  if (!canScroll) {
                    return
                  }
                  event.preventDefault()
                  element.scrollTop += deltaY
                  element.scrollLeft += deltaX
                }}
              >
                <div data-slot="scroll-area-thumb" {...thumbSlot} />
              </div>
            )
          }}
        </For>
        <Show when={orientation() === 'both'}>
          <div data-slot="scroll-area-corner" aria-hidden="true" {...cornerSlot} />
        </Show>
      </Show>
    </div>
  )
}
