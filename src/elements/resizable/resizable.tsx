import type { JSX } from 'solid-js'
import {
  Index,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
} from 'solid-js'

import type { RockUIProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn, useId } from '../../shared/utils'

import {
  collapsePanel,
  EPSILON,
  expandPanel,
  RESIZABLE_HANDLE_TARGET_END,
  RESIZABLE_HANDLE_TARGET_START,
  RESIZE_FLAG_FOLLOWING,
  RESIZE_FLAG_PRECEDING,
  getHandleAria,
  isPanelCollapsed,
  normalizePanelSizes,
  resolveKeyboardDelta,
  resolvePanels,
  resizeFromHandle,
  resizePanelToSize,
  useResizableHandle,
} from './hook'
import type { ResizableOrientation, ResizablePanelItem, ResizableSize } from './hook'
import {
  resizableCrossTargetVariants,
  resizableHandleVariants,
  resizableRootVariants,
} from './resizable.class'
import type { ResizableVariantProps } from './resizable.class'

export namespace ResizableT {
  export type Slot = 'root' | 'panel' | 'divider' | 'handle' | 'crossTarget'
  export type Variant = ResizableVariantProps
  export interface Items {}
  export interface Extend {}
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}
  /**
   * Base props for the Resizable component.
   */
  export interface Base {
    /**
     * Unique identifier for the resizable root.
     */
    id?: string

    /**
     * Array of panels to render.
     */
    panels?: ResizablePanelItem[]

    /**
     * Callback when any panel is resized.
     */
    onResize?: (sizes: number[]) => void

    /**
     * Callback when a resize operation starts.
     */
    onResizeStart?: (sizes: number[]) => void

    /**
     * Callback when a resize operation ends.
     */
    onResizeEnd?: (sizes: number[]) => void

    /**
     * Callback when a key is pressed on a handle.
     */
    onHandleKeyDown?: (context: {
      event: KeyboardEvent
      handleIndex: number
      sizes: number[]
    }) => void

    /**
     * Whether the resizable component is disabled.
     * @default false
     */
    disable?: boolean

    /**
     * Custom handle to render, or boolean to toggle default handle.
     * @default true
     */
    renderHandle?: boolean | JSX.Element

    /**
     * Whether to use intersection-based handle sizing.
     * @default false
     */
    intersection?: boolean

    /**
     * The amount to resize when using keyboard shortcuts.
     * @default '10%'
     */
    keyboardDelta?: ResizableSize
  }

  /**
   * Props for the Resizable component.
   */
  export interface Props extends RockUIProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the Resizable component.
 */
export interface ResizableProps extends ResizableT.Props {}

interface DragState {
  initialSizes: number[]
  handleIndex: number
  altKey: boolean
  started: boolean
  lastSizes: number[]
}

/** Resizable panel layout with draggable dividers and keyboard support. */
export function Resizable(props: ResizableProps): JSX.Element {
  const localProps = mergeProps(
    {
      orientation: 'horizontal' as ResizableOrientation,
      keyboardDelta: '10%' as ResizableSize,
      renderHandle: true,
    },
    props,
  )

  const panelIdPrefix = useId(() => localProps.id, 'resizable')
  const orientation = () => localProps.orientation

  const [rootElement, setRootElement] = createSignal<HTMLDivElement>()
  const [rootSize, setRootSize] = createSignal(1)
  const [uncontrolledSizes, setUncontrolledSizes] = createSignal<number[]>([])
  const [interactionResizing, setInteractionResizing] = createSignal(false)

  const resolvedPanels = createMemo(() =>
    resolvePanels(localProps.panels ?? [], rootSize(), panelIdPrefix()),
  )
  const panelCount = createMemo(() => resolvedPanels().length)
  const panelDefaultSizes = createMemo(() => resolvedPanels().map((p) => p.defaultSize))

  function normalizeWithCurrentState(controlledSizes?: Array<ResizableSize | undefined>) {
    return normalizePanelSizes({
      panelCount: panelCount(),
      rootSize: rootSize(),
      panelInitialSizes: panelDefaultSizes(),
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

  const panelCollapsibleStates = createMemo(() =>
    (localProps.panels ?? []).map((p) => p.collapsible),
  )

  let prevCollapsibleStates: Array<boolean | undefined> = []
  const lastExpandedSizes: Array<number | undefined> = []

  createEffect(() => {
    const panels = resolvedPanels()
    const currentSizes = sizes()

    for (let index = 0; index < panels.length; index += 1) {
      const panel = panels[index]
      const size = currentSizes[index] ?? 0
      const collapsed = panel ? isPanelCollapsed(size, panel) : false

      if (!panel || collapsed || size <= panel.collapsibleMin + EPSILON) {
        continue
      }

      lastExpandedSizes[index] = size
    }
  })

  createEffect(() => {
    const nextCollapsibleStates = panelCollapsibleStates()
    const panels = resolvedPanels()
    let nextSizes = sizes()
    let changed = false

    for (let panelIndex = 0; panelIndex < nextCollapsibleStates.length; panelIndex += 1) {
      const previous = prevCollapsibleStates[panelIndex]
      const next = nextCollapsibleStates[panelIndex]

      if (previous === undefined || next === undefined || previous === next) {
        continue
      }

      const panel = panels[panelIndex]
      if (!panel) {
        continue
      }

      const strategy =
        panelIndex === panels.length - 1 ? RESIZE_FLAG_PRECEDING : RESIZE_FLAG_FOLLOWING
      const togglePanels = panels.map((item, index) =>
        index === panelIndex ? Object.assign({}, item, { collapsible: true }) : item,
      )

      const resized = normalizeSizes(
        next
          ? collapsePanel({
              panelIndex,
              strategy,
              initialSizes: nextSizes,
              panels: togglePanels,
            })
          : expandPanel({
              panelIndex,
              strategy,
              initialSizes: nextSizes,
              panels: togglePanels,
              expandedSize: lastExpandedSizes[panelIndex],
            }),
      )

      if (!hasSizeChange(nextSizes, resized)) {
        continue
      }

      nextSizes = resized
      changed = true
    }

    prevCollapsibleStates = [...nextCollapsibleStates]

    if (changed) {
      emitSizes(nextSizes)
    }
  })

  function hasSizeChange(previousSizes: number[], nextSizes: number[]): boolean {
    if (previousSizes.length !== nextSizes.length) {
      return true
    }

    for (let index = 0; index < previousSizes.length; index += 1) {
      if (Math.abs(previousSizes[index] - nextSizes[index]) > EPSILON) {
        return true
      }
    }

    return false
  }

  function resolvePixelSizes(nextSizes: number[]): number[] {
    const currentRootSize = Math.max(rootSize(), 1)
    return nextSizes.map((size) => size * currentRootSize)
  }

  function scheduleInteractionResizeRelease(): void {
    queueMicrotask(() => setInteractionResizing(false))
  }

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

  function snapDragEndSizes(nextSizes: number[]): number[] {
    const panels = resolvedPanels()
    let snappedSizes = normalizeSizes(nextSizes)

    for (let panelIndex = 0; panelIndex < panels.length; panelIndex += 1) {
      const panel = panels[panelIndex]
      const panelSize = snappedSizes[panelIndex] ?? 0

      if (
        !panel?.collapsible ||
        panelSize <= panel.collapsibleMin + EPSILON ||
        panelSize + EPSILON >= panel.min
      ) {
        continue
      }

      const strategy =
        panelIndex === panels.length - 1 ? RESIZE_FLAG_PRECEDING : RESIZE_FLAG_FOLLOWING
      snappedSizes = normalizeSizes(
        resizePanelToSize({
          panelIndex,
          size: panel.min,
          strategy,
          initialSizes: snappedSizes,
          panels,
          rootSize: 1,
        }),
      )
    }

    return snappedSizes
  }

  function isHandleResizable(handleIndex: number): boolean {
    const panels = resolvedPanels()
    const precedingPanel = panels[handleIndex]
    const followingPanel = panels[handleIndex + 1]
    if (!precedingPanel || !followingPanel) {
      return false
    }

    return precedingPanel.resizable !== false && followingPanel.resizable !== false
  }

  function beginResize(nextSizes: number[]): void {
    localProps.onResizeStart?.(resolvePixelSizes(nextSizes))
  }

  function endResize(nextSizes: number[]): void {
    localProps.onResizeEnd?.(resolvePixelSizes(nextSizes))
  }

  function emitSizes(normalizedSizes: number[]): void {
    if (normalizedControlledSizes() === undefined) {
      setUncontrolledSizes(normalizedSizes)
    }
    localProps.onResize?.(resolvePixelSizes(normalizedSizes))
  }

  let drag: DragState | null = null

  function resetDragState(handleIndex: number, altKey: boolean): DragState {
    if (drag && drag.started) {
      endResize(drag.lastSizes)
    }

    drag = {
      initialSizes: [...sizes()],
      handleIndex,
      altKey,
      started: false,
      lastSizes: [...sizes()],
    }

    return drag
  }

  function resizeHandleByDelta(handleIndex: number, deltaPx: number, altKey: boolean): void {
    if (sizes().length <= 1) {
      return
    }

    if (!drag || drag.handleIndex !== handleIndex || drag.altKey !== altKey) {
      drag = resetDragState(handleIndex, altKey)
    }

    const nextSizes = normalizeSizes(
      resizeFromHandle({
        handleIndex,
        deltaPercentage: deltaPx / Math.max(rootSize(), 1),
        altKey,
        initialSizes: drag.initialSizes,
        panels: resolvedPanels(),
      }),
    )
    const currentSizes = drag.started ? drag.lastSizes : drag.initialSizes

    if (!hasSizeChange(currentSizes, nextSizes)) {
      return
    }

    if (!drag.started) {
      setInteractionResizing(true)
      beginResize(drag.initialSizes)
      drag.started = true
    }

    drag.lastSizes = nextSizes
    emitSizes(nextSizes)
  }

  function stopHandleDrag(): void {
    if (drag?.started) {
      const snappedSizes = snapDragEndSizes(drag.lastSizes)
      if (hasSizeChange(drag.lastSizes, snappedSizes)) {
        drag.lastSizes = snappedSizes
        emitSizes(snappedSizes)
      }

      endResize(drag.lastSizes)
    }

    drag = null
    setInteractionResizing(false)
  }

  function onHandleKeyDown(handleIndex: number, event: KeyboardEvent, altKey: boolean): void {
    if (localProps.disable || !isHandleResizable(handleIndex)) {
      return
    }

    localProps.onHandleKeyDown?.({
      event,
      handleIndex,
      sizes: resolvePixelSizes(sizes()),
    })

    if (event.defaultPrevented) {
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

    const currentSizes = sizes()
    const nextSizes = normalizeSizes(
      resizeFromHandle({
        handleIndex,
        deltaPercentage,
        altKey,
        initialSizes: currentSizes,
        panels: resolvedPanels(),
      }),
    )

    if (!hasSizeChange(currentSizes, nextSizes)) {
      return
    }

    setInteractionResizing(true)
    beginResize(currentSizes)
    emitSizes(nextSizes)
    endResize(nextSizes)
    scheduleInteractionResizeRelease()
    event.preventDefault()
  }

  return (
    <div
      ref={setRootElement}
      id={localProps.id}
      data-slot="root"
      style={localProps.styles?.root}
      data-resizable-root
      data-orientation={orientation()}
      class={resizableRootVariants({ orientation: orientation() }, localProps.classes?.root)}
    >
      <Index each={resolvedPanels()}>
        {(panel, index) => {
          const panelItem = createMemo(() => panel())
          const size = () => sizes()[index] ?? 0
          const collapsed = () => isPanelCollapsed(size(), panelItem())
          const handleDisabled = createMemo(
            () => localProps.disable === true || !isHandleResizable(index),
          )

          const aria = createMemo(() =>
            getHandleAria({ handleIndex: index, sizes: sizes(), panels: resolvedPanels() }),
          )

          const bindings = useResizableHandle({
            handleIndex: () => index,
            orientation,
            disable: handleDisabled,
            intersection: () => localProps.intersection,
            onDrag: resizeHandleByDelta,
            onDragEnd: stopHandleDrag,
            onKeyDown: onHandleKeyDown,
          })

          return (
            <>
              <div
                id={panelItem().panelId}
                data-slot="panel"
                data-orientation={orientation()}
                data-collapsed={collapsed() ? '' : undefined}
                data-expanded={panelItem().collapsible && !collapsed() ? '' : undefined}
                data-resizing={interactionResizing() ? '' : undefined}
                class={cn(
                  'min-h-0 min-w-0 duration-200 ease-out transition-flex-basis overflow-auto data-resizing:duration-0 motion-reduce:transition-none',
                  localProps.classes?.panel,
                  panelItem().class,
                )}
                style={{
                  'flex-basis': `${size() * 100}%`,
                  ...localProps.styles?.panel,
                  ...panelItem().style,
                }}
              >
                {panelItem().content}
              </div>

              <Show when={index < resolvedPanels().length - 1}>
                <div
                  ref={bindings.setElement}
                  role="separator"
                  aria-controls={aria().controls}
                  aria-orientation={orientation()}
                  aria-valuemin={aria().valueMin}
                  aria-valuemax={aria().valueMax}
                  aria-valuenow={aria().valueNow}
                  aria-disabled={handleDisabled() ? 'true' : undefined}
                  tabIndex={handleDisabled() ? -1 : 0}
                  data-slot="divider"
                  style={localProps.styles?.divider}
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
                        { orientation: orientation(), target: 'start' },
                        localProps.classes?.crossTarget,
                      )}
                      onMouseEnter={() =>
                        bindings.onIntersectionMouseEnter(RESIZABLE_HANDLE_TARGET_START)
                      }
                      onMouseLeave={bindings.onIntersectionMouseLeave}
                    />
                  </Show>

                  <Show when={localProps.renderHandle} keyed>
                    {(renderHandle) => (
                      <Show
                        when={renderHandle === true}
                        fallback={
                          <div
                            data-slot="handle"
                            style={localProps.styles?.handle}
                            class={cn(
                              'flex items-center justify-center z-10',
                              localProps.classes?.handle,
                            )}
                          >
                            {renderHandle}
                          </div>
                        }
                      >
                        <div
                          data-slot="handle"
                          style={localProps.styles?.handle}
                          class={cn(
                            'rounded-lg bg-border/90 flex shrink-0 h-6 w-1 z-10',
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
                        { orientation: orientation(), target: 'end' },
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
      </Index>
    </div>
  )
}
