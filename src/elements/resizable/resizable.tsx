import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, onCleanup } from 'solid-js'

import type { SlotClasses } from '../../shared/slot-class'
import { cn, useId } from '../../shared/utils'

import { useResizableHandle } from './hook/handle'
import type { ResizableHandleOptions } from './hook/handle'
import { RESIZABLE_HANDLE_TARGET_END, RESIZABLE_HANDLE_TARGET_START } from './hook/manager'
import {
  EPSILON,
  getHandleAria,
  isPanelCollapsed,
  normalizePanelSizes,
  resolveKeyboardDelta,
  resolvePanels,
} from './hook/panel'
import type { ResizableOrientation, ResizablePanelItem, ResizableSize } from './hook/panel'
import { resizeFromHandle, toggleHandleNearestPanel } from './hook/resize'
import {
  resizableCrossTargetVariants,
  resizableHandleVariants,
  resizableRootVariants,
} from './resizable.class'
import type { ResizableVariantProps } from './resizable.class'

type ResizableSlots = 'root' | 'panel' | 'divider' | 'handle' | 'crossTarget'

export type ResizableClasses = SlotClasses<ResizableSlots>

export interface ResizableProps extends ResizableVariantProps, ResizableHandleOptions {
  id?: string
  panels?: ResizablePanelItem[]
  onSizesChange?: (sizes: number[]) => void
  keyboardDelta?: ResizableSize
  classes?: ResizableClasses
}

interface DragState {
  initialSizes: number[]
  handleIndex: number
  altKey: boolean
}

export function Resizable(props: ResizableProps): JSX.Element {
  const localProps = mergeProps(
    {
      orientation: 'horizontal' as ResizableOrientation,
      keyboardDelta: 0.1 as ResizableSize,
      renderHandle: true,
    },
    props,
  )

  const panelIdPrefix = useId(() => localProps.id, 'resizable')
  const orientation = () => localProps.orientation

  const [rootElement, setRootElement] = createSignal<HTMLDivElement>()
  const [rootSize, setRootSize] = createSignal(1)
  const [uncontrolledSizes, setUncontrolledSizes] = createSignal<number[]>([])

  const resolvedPanels = createMemo(() =>
    resolvePanels(localProps.panels ?? [], rootSize(), panelIdPrefix()),
  )
  const panelCount = createMemo(() => resolvedPanels().length)
  const panelInitialSizes = createMemo(() => resolvedPanels().map((p) => p.initialSize))

  function normalizeWithCurrentState(controlledSizes?: Array<ResizableSize | undefined>) {
    return normalizePanelSizes({
      panelCount: panelCount(),
      rootSize: rootSize(),
      panelInitialSizes: panelInitialSizes(),
      controlledSizes,
    })
  }

  const normalizedControlledSizes = createMemo(() => {
    const next = localProps.panels?.map((p) => p.size)
    return next?.some((s) => s !== undefined) ? normalizeWithCurrentState(next) : undefined
  })

  const sizes = createMemo(() => normalizedControlledSizes() ?? uncontrolledSizes())

  createEffect(() => {
    if (normalizedControlledSizes() !== undefined) {
      return
    }

    const nextCount = panelCount()
    setUncontrolledSizes((prev) =>
      prev.length === 0 || prev.length !== nextCount
        ? normalizeWithCurrentState()
        : normalizeWithCurrentState(prev),
    )
  })

  createEffect(() => {
    const element = rootElement()
    if (!element) {
      return
    }

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      const value = orientation() === 'horizontal' ? rect.width : rect.height
      setRootSize(value > EPSILON ? value : 1)
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    onCleanup(() => observer.disconnect())
  })

  let prevSizes: number[] = []
  let prevCollapsed: boolean[] = []

  createEffect(() => {
    const panels = resolvedPanels()
    const currentSizes = sizes()

    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i]
      const size = currentSizes[i] ?? 0
      const collapsed = panel ? isPanelCollapsed(size, panel) : false

      if (panel && (prevSizes[i] === undefined || Math.abs((prevSizes[i] ?? 0) - size) > EPSILON)) {
        panel.onResize?.(size)
      }

      if (panel && prevCollapsed[i] !== undefined && prevCollapsed[i] !== collapsed) {
        if (collapsed) {
          panel.onCollapse?.(size)
        } else {
          panel.onExpand?.(size)
        }
      }
    }

    prevSizes = [...currentSizes]
    prevCollapsed = panels.map((p, i) => isPanelCollapsed(currentSizes[i] ?? 0, p))
  })

  function normalizeSizes(nextSizes: number[]): number[] {
    const nextCount = panelCount()
    if (nextSizes.length !== nextCount) {
      return normalizeWithCurrentState(nextSizes)
    }

    let total = 0
    for (const size of nextSizes) {
      if (!Number.isFinite(size) || size < 0) {
        return normalizeWithCurrentState(nextSizes)
      }
      total += size
    }

    return Math.abs(total - 1) > EPSILON * Math.max(1, nextCount)
      ? normalizeWithCurrentState(nextSizes)
      : nextSizes
  }

  function emitSizes(nextSizes: number[]): void {
    const normalized = normalizeSizes(nextSizes)
    if (normalizedControlledSizes() === undefined) {
      setUncontrolledSizes(normalized)
    }
    localProps.onSizesChange?.(normalized)
  }

  let drag: DragState | null = null

  function resizeHandleByDelta(handleIndex: number, deltaPx: number, altKey: boolean): void {
    if (sizes().length <= 1) {
      return
    }

    if (!drag || drag.handleIndex !== handleIndex || drag.altKey !== altKey) {
      drag = { initialSizes: [...sizes()], handleIndex, altKey }
    }

    emitSizes(
      resizeFromHandle({
        handleIndex,
        deltaPercentage: deltaPx / Math.max(rootSize(), 1),
        altKey,
        initialSizes: drag.initialSizes,
        panels: resolvedPanels(),
      }),
    )
  }

  function stopHandleDrag(): void {
    drag = null
  }

  function onHandleKeyDown(handleIndex: number, event: KeyboardEvent, altKey: boolean): void {
    if (event.key === 'Enter') {
      emitSizes(
        toggleHandleNearestPanel({
          handleIndex,
          initialSizes: sizes(),
          panels: resolvedPanels(),
        }),
      )
      event.preventDefault()
      return
    }

    const keyboardDelta = resolveKeyboardDelta(localProps.keyboardDelta, rootSize())
    let deltaPercentage: number | null = null

    if (
      (orientation() === 'horizontal' && event.key === 'ArrowLeft') ||
      (orientation() === 'vertical' && event.key === 'ArrowUp') ||
      event.key === 'Home'
    ) {
      deltaPercentage = event.shiftKey || event.key === 'Home' ? -1 : -keyboardDelta
    } else if (
      (orientation() === 'horizontal' && event.key === 'ArrowRight') ||
      (orientation() === 'vertical' && event.key === 'ArrowDown') ||
      event.key === 'End'
    ) {
      deltaPercentage = event.shiftKey || event.key === 'End' ? 1 : keyboardDelta
    }

    if (deltaPercentage === null) {
      return
    }

    emitSizes(
      resizeFromHandle({
        handleIndex,
        deltaPercentage,
        altKey,
        initialSizes: sizes(),
        panels: resolvedPanels(),
      }),
    )
    event.preventDefault()
  }

  return (
    <div
      ref={setRootElement}
      id={localProps.id}
      data-slot="root"
      data-resizable-root
      data-orientation={orientation()}
      class={resizableRootVariants({ orientation: orientation() }, localProps.classes?.root)}
    >
      <For each={resolvedPanels()}>
        {(panel, index) => {
          const mergedHandleOptions = createMemo<ResizableHandleOptions>(() => ({
            renderHandle: panel.renderHandle ?? localProps.renderHandle,
            disableHandle: panel.disableHandle ?? localProps.disableHandle,
            intersection: panel.intersection ?? localProps.intersection,
            onHandleDragStart: panel.onHandleDragStart ?? localProps.onHandleDragStart,
            onHandleDrag: panel.onHandleDrag ?? localProps.onHandleDrag,
            onHandleDragEnd: panel.onHandleDragEnd ?? localProps.onHandleDragEnd,
          }))

          const size = () => sizes()[index()] ?? 0
          const collapsed = () => isPanelCollapsed(size(), panel)

          const aria = createMemo(() =>
            getHandleAria({ handleIndex: index(), sizes: sizes(), panels: resolvedPanels() }),
          )

          const bindings = useResizableHandle({
            handleIndex: index,
            orientation,
            options: mergedHandleOptions,
            onDrag: resizeHandleByDelta,
            onDragEnd: stopHandleDrag,
            onKeyDown: onHandleKeyDown,
          })

          return (
            <>
              <div
                id={panel.panelId}
                data-slot="panel"
                data-orientation={orientation()}
                data-collapsed={collapsed() ? '' : undefined}
                data-expanded={panel.collapsible && !collapsed() ? '' : undefined}
                class={cn('min-h-0 min-w-0 overflow-auto', localProps.classes?.panel, panel.class)}
                style={{ 'flex-basis': `${size() * 100}%`, ...panel.style }}
              >
                {panel.content}
              </div>

              <Show
                when={
                  index() < resolvedPanels().length - 1 &&
                  mergedHandleOptions().disableHandle !== true
                }
              >
                <div
                  ref={bindings.setElement}
                  role="separator"
                  aria-controls={aria().controls}
                  aria-orientation={orientation()}
                  aria-valuemin={aria().valueMin}
                  aria-valuemax={aria().valueMax}
                  aria-valuenow={aria().valueNow}
                  aria-disabled={mergedHandleOptions().disableHandle ? 'true' : undefined}
                  tabIndex={mergedHandleOptions().disableHandle ? -1 : 0}
                  data-slot="divider"
                  data-orientation={orientation()}
                  data-active={bindings.active() ? '' : undefined}
                  data-dragging={bindings.dragging() ? '' : undefined}
                  class={resizableHandleVariants(
                    { orientation: orientation() },
                    localProps.classes?.divider,
                  )}
                  onMouseEnter={bindings.onMouseEnter}
                  onMouseLeave={bindings.onMouseLeave}
                  onFocus={bindings.onFocus}
                  onBlur={bindings.onBlur}
                  onKeyDown={bindings.onKeyDown}
                  onPointerDown={bindings.onPointerDown}
                >
                  <Show when={bindings.startIntersectionVisible()}>
                    <div
                      data-slot="cross-target"
                      data-resizable-handle-start-target
                      data-cross={bindings.cross() ? '' : undefined}
                      class={resizableCrossTargetVariants(
                        { orientation: orientation(), target: 'startIntersection' },
                        localProps.classes?.crossTarget,
                      )}
                      onMouseEnter={() =>
                        bindings.onIntersectionMouseEnter(RESIZABLE_HANDLE_TARGET_START)
                      }
                      onMouseLeave={bindings.onIntersectionMouseLeave}
                    />
                  </Show>

                  <Show when={mergedHandleOptions().renderHandle} keyed>
                    {(renderHandle) => (
                      <Show
                        when={renderHandle === true}
                        fallback={
                          <div
                            data-slot="handle"
                            class={cn(
                              'z-10 pointer-events-none flex items-center justify-center',
                              localProps.classes?.handle,
                            )}
                          >
                            {renderHandle}
                          </div>
                        }
                      >
                        <div
                          data-slot="handle"
                          class={cn(
                            'z-10 h-6 w-1 rounded-lg bg-border/90 pointer-events-none flex shrink-0',
                            orientation() === 'horizontal' ? 'mx-auto' : 'rotate-90',
                            localProps.classes?.handle,
                          )}
                        />
                      </Show>
                    )}
                  </Show>

                  <Show when={bindings.endIntersectionVisible()}>
                    <div
                      data-slot="cross-target"
                      data-resizable-handle-end-target
                      data-cross={bindings.cross() ? '' : undefined}
                      class={resizableCrossTargetVariants(
                        { orientation: orientation(), target: 'endIntersection' },
                        localProps.classes?.crossTarget,
                      )}
                      onMouseEnter={() =>
                        bindings.onIntersectionMouseEnter(RESIZABLE_HANDLE_TARGET_END)
                      }
                      onMouseLeave={bindings.onIntersectionMouseLeave}
                    />
                  </Show>
                </div>
              </Show>
            </>
          )
        }}
      </For>
    </div>
  )
}
