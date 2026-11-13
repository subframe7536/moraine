import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { callHandler, callRef } from '../../shared/utils'
import { VirtualContent } from '../../virtualizer/virtual-content'

import { EMPTY_AXIS_METRICS, createScrollMetrics } from './scroll-area-metrics'
import type { AxisMetrics } from './scroll-area-metrics'
import {
  SCROLL_AREA_THUMB_MIN_SIZE,
  scrollAreaDataAttributes,
  scrollAreaRecipe,
} from './scroll-area.recipe'
import type { ScrollAreaProps, ScrollAreaT } from './scroll-area.types'

type Orientation = NonNullable<ScrollAreaT.Variants['orientation']>
type ScrollbarMode = NonNullable<ScrollAreaT.Variants['scrollbar']>

const AXES = { vertical: ['y'], horizontal: ['x'], both: ['y', 'x'] } as const

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

/** Native scroll container with custom scrollbars, edge shadows, and optional virtualization. */
export function ScrollArea<TItem = unknown>(props: ScrollAreaProps<TItem>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
    'viewportRef',
    'controllerRef',
    'children',
    'items',
    'itemRender',
    'virtualizer',
    'orientation',
    'scrollbar',
    'shadow',
    'shadowSize',
    'edgeThreshold',
    'scrollHideDelay',
    'onOverflowChange',
    'onReachStart',
    'onReachEnd',
    'onScroll',
    'onPointerEnter',
    'onPointerLeave',
    'tabIndex',
    'class',
    'style',
    'classes',
    'styles',
  ])
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
      root: () =>
        local.shadowSize === undefined
          ? undefined
          : { style: { '--scroll-area-shadow-size': `${Math.max(0, local.shadowSize)}px` } },
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
  const scrollbarMode = (): ScrollbarMode => variants.scrollbar ?? 'auto'
  const axes = (): readonly ScrollAreaT.Axis[] => AXES[orientation()]
  const axisMetrics = (axis: ScrollAreaT.Axis): AxisMetrics =>
    axes().includes(axis) ? metrics()[axis] : EMPTY_AXIS_METRICS
  const customScrollbar = () => scrollbarMode() !== 'native' && scrollbarMode() !== 'hidden'

  const overflow = createMemo(
    (): ScrollAreaT.Overflow => {
      const threshold = Math.max(0, local.edgeThreshold ?? 0)
      const edges = (axis: ScrollAreaT.Axis): ScrollAreaT.AxisOverflow => {
        const { extent, position } = axisMetrics(axis)
        // Scroll positions may be fractional while client and scroll sizes are integers.
        return { start: position > threshold, end: extent - position > threshold + 1 }
      }
      return { x: edges('x'), y: edges('y') }
    },
    undefined,
    { equals: sameOverflow },
  )

  // Unmeasured boxes stay in the tab order until layout sizes are known.
  const canScroll = () =>
    axes().some((axis) => {
      const { client, extent } = metrics()[axis]
      return client === 0 || extent > 0
    })

  const scrollbarVisible = (axis: ScrollAreaT.Axis): boolean => {
    const mode = scrollbarMode()
    if (mode === 'always') {
      return true
    }
    if (axisMetrics(axis).extent <= 0) {
      return false
    }
    const active = scrolling.active() || dragging() === axis
    if (mode === 'hover') {
      return active || hovering.active()
    }
    return mode === 'scroll' ? active : true
  }
  const cornerVisible = (): boolean =>
    orientation() === 'both' && scrollbarVisible('x') && scrollbarVisible('y')

  createEffect(
    on(
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
          if (previous[axis].start && !current[axis].start) {
            local.onReachStart?.(axis)
          }
          if (previous[axis].end && !current[axis].end) {
            local.onReachEnd?.(axis)
          }
        }
      },
      { defer: true },
    ),
  )

  callRef(
    untrack(() => local.controllerRef),
    {
      get overflow() {
        return overflow()
      },
      scrollToEdge(axis, edge, options) {
        const element = viewport()
        if (!element) {
          return
        }
        if (axis === 'y') {
          element.scrollTo({ top: edge === 'start' ? 0 : element.scrollHeight, ...options })
          return
        }
        // Browsers clamp the offset; RTL offsets grow negative toward the logical end.
        const end = metrics().rtl ? -element.scrollWidth : element.scrollWidth
        element.scrollTo({ left: edge === 'start' ? 0 : end, ...options })
      },
    } satisfies ScrollAreaT.Controller,
  )

  function thumbStyle(axis: ScrollAreaT.Axis): JSX.CSSProperties {
    const { client, extent, position } = axisMetrics(axis)
    const ratio = client + extent > 0 ? client / (client + extent) : 1
    const progress = extent > 0 ? position / extent : 0
    const physical = axis === 'x' && metrics().rtl ? 1 - progress : progress
    const size = `max(${SCROLL_AREA_THUMB_MIN_SIZE}px, ${ratio * 100}%)`
    const offset = `calc((100% - ${size}) * ${physical})`
    return axis === 'y'
      ? { top: offset, height: size, left: '0', right: '0' }
      : { left: offset, width: size, top: '0', bottom: '0' }
  }

  let drag: { pointer: number; thumb: number } | undefined

  function trackOffset(axis: ScrollAreaT.Axis, track: HTMLElement, event: PointerEvent): number {
    const rect = track.getBoundingClientRect()
    return axis === 'y'
      ? event.clientY - rect.top - track.clientTop
      : event.clientX - rect.left - track.clientLeft
  }

  /** Scrolls so the thumb starts `thumbOffset` px into its track. */
  function scrollToThumb(axis: ScrollAreaT.Axis, track: HTMLElement, thumbOffset: number): void {
    const element = viewport()
    const thumb = track.firstElementChild as HTMLElement | null
    if (!element || !thumb) {
      return
    }
    const room =
      axis === 'y' ? track.clientHeight - thumb.offsetHeight : track.clientWidth - thumb.offsetWidth
    const progress = room > 0 ? Math.max(0, Math.min(thumbOffset / room, 1)) : 0
    if (axis === 'y') {
      element.scrollTop = progress * (element.scrollHeight - element.clientHeight)
      return
    }
    const extent = element.scrollWidth - element.clientWidth
    element.scrollLeft = metrics().rtl ? (progress - 1) * extent : progress * extent
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
        tabIndex={local.tabIndex ?? (canScroll() ? 0 : -1)}
        ref={(element) => {
          setViewport(element)
          callRef(local.viewportRef, element)
        }}
        onScroll={(event) => callHandler(event, local.onScroll)}
      >
        <div data-slot="scroll-area-content" {...contentSlot}>
          <Show when={local.itemRender} fallback={local.children}>
            {(itemRender) => (
              <VirtualContent<TItem>
                virtualizer={local.virtualizer}
                entries={local.items ?? []}
                scrollElement={viewport()}
                render={(item, index, rowProps) => {
                  const ItemRender = itemRender()
                  return <ItemRender item={item} index={index} props={rowProps} />
                }}
                fallback={
                  <For each={local.items}>
                    {(item, index) => {
                      const ItemRender = itemRender()
                      return <ItemRender item={item} index={index()} />
                    }}
                  </For>
                }
              />
            )}
          </Show>
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
                  const pointer = trackOffset(axis, track, event)
                  let start = axis === 'y' ? thumb.offsetTop : thumb.offsetLeft
                  if (!thumb.contains(event.target)) {
                    // Track presses center the thumb on the pointer, then continue as a drag.
                    start = pointer - (axis === 'y' ? thumb.offsetHeight : thumb.offsetWidth) / 2
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
                      drag.thumb + trackOffset(axis, track, event) - drag.pointer,
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
                  const unit =
                    event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1
                  element.scrollTop += event.deltaY * unit
                  element.scrollLeft += event.deltaX * unit
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
