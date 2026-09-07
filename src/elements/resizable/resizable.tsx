import type { JSX } from 'solid-js'
import {
  Index,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  onCleanup,
  onMount,
} from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callRef, useId } from '../../shared/utils.ts'

import {
  collapsePanel,
  EPSILON,
  expandPanel,
  fixToPrecision,
  RESIZABLE_HANDLE_TARGET_END,
  RESIZABLE_HANDLE_TARGET_START,
  RESIZE_FLAG_FOLLOWING,
  RESIZE_FLAG_PRECEDING,
  getHandleAria,
  isPanelCollapsed,
  normalizePanelSizes,
  resolveKeyboardDelta,
  resolvePanels,
  resolveSize,
  resizeFromHandle,
  resizePanelToSize,
  toggleHandleNearestPanel,
  useResizableHandle,
} from './hook/index.ts'
import type { ResizablePanelItem, ResizableSize } from './hook/index.ts'
import type { ResizableProps, ResizableT } from './resizable.types.ts'

export * from './resizable.types.ts'

interface DragState {
  initialSizes: number[]
  handleIndex: number
  altKey: boolean
  started: boolean
  lastSizes: number[]
}

const EMPTY_PANELS: ResizablePanelItem[] = []

/** Resizable panel layout with draggable dividers and keyboard support. */
export function Resizable(props: ResizableProps): JSX.Element {
  const [localProps, rest] = splitProps(props, [
    'id',
    'panels',
    'onResize',
    'onResizeStart',
    'onResizeEnd',
    'onHandleKeyDown',
    'disable',
    'handle',
    'handleRender',
    'handleAction',
    'intersection',
    'keyboardDelta',
    'orientation',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  ])

  const design = useMoraineDesign()
  const resizableDesign = () => design().resizable

  const local = mergeProps(
    {
      keyboardDelta: '10%' as const,
      handle: true,
      handleAction: 'resize' as const,
    },
    localProps,
  )

  const panelIdPrefix = useId(() => local.id, 'resizable')
  const orientation = () =>
    localProps.orientation ?? resizableDesign()?.defaultVariants?.orientation ?? 'horizontal'

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return resizableDesign()?.recipe({ orientation: orientation() })
      },
    },
    get instance() {
      return {
        class: localProps.class,
        classes: localProps.classes,
        style: localProps.style,
        styles: localProps.styles,
      }
    },
  })

  let rootRef: HTMLDivElement | undefined = undefined
  const [rootSize, setRootSize] = createSignal(0)
  const [uncontrolledSizes, setUncontrolledSizes] = createSignal<Array<ResizableSize | undefined>>(
    [],
  )
  const [interactionResizing, setInteractionResizing] = createSignal(false)
  const [transitioningPanelIndexes, setTransitioningPanelIndexes] = createSignal<number[]>([])
  let initializedWithMeasuredRootSize = false
  const panelItems = createMemo(() => local.panels ?? EMPTY_PANELS)

  const resolvedPanels = createMemo(() => resolvePanels(panelItems(), rootSize(), panelIdPrefix()))
  const panelCount = createMemo(() => resolvedPanels().length)
  const panelDefaultSizes = createMemo(() => resolvedPanels().map((p) => p.defaultSize))
  const panelControlledSizes = createMemo(() => panelItems().map((p) => p.size))
  const panelMinSizes = createMemo(() => {
    const panels = resolvedPanels()
    const controlledSizes = panelControlledSizes()
    const hasControlledSizes = controlledSizes.some((size) => size !== undefined)
    const activeSizes = hasControlledSizes ? controlledSizes : uncontrolledSizes()
    const currentRootSize = rootSize()

    return panels.map((panel, index) => {
      const controlledSize = activeSizes[index]
      if (controlledSize === undefined) {
        return panel.min
      }

      const resolvedControlledSize = resolveSize(controlledSize, currentRootSize)
      const shouldUseCollapsibleMin =
        resolvedControlledSize <= panel.collapsibleMin + EPSILON ||
        (panel.collapsible && resolvedControlledSize <= panel.min + EPSILON)

      return shouldUseCollapsibleMin ? panel.collapsibleMin : panel.min
    })
  })
  const panelMaxSizes = createMemo(() => resolvedPanels().map((p) => p.max))

  function normalizeWithCurrentState(controlledSizes?: Array<ResizableSize | undefined>) {
    return normalizePanelSizes({
      panelCount: panelCount(),
      rootSize: rootSize(),
      panelInitialSizes: panelDefaultSizes(),
      panelMinSizes: panelMinSizes(),
      panelMaxSizes: panelMaxSizes(),
      controlledSizes,
    })
  }

  const normalizedControlledSizes = createMemo(() => {
    const next = panelItems().map((p) => p.size)
    return next?.some((s) => s !== undefined) ? normalizeWithCurrentState(next) : undefined
  })

  const sizes = createMemo(() => {
    const controlled = normalizedControlledSizes()
    if (controlled !== undefined) {
      return controlled
    }

    const uncontrolled = uncontrolledSizes()
    return uncontrolled.length === panelCount()
      ? normalizeWithCurrentState(uncontrolled)
      : normalizeWithCurrentState()
  })

  createEffect(() => {
    if (normalizedControlledSizes() !== undefined) {
      return
    }

    const nextCount = panelCount()
    const hasMeasuredRootSize = rootSize() > EPSILON
    const shouldResetToDefaultSizes = hasMeasuredRootSize && !initializedWithMeasuredRootSize

    if (shouldResetToDefaultSizes) {
      initializedWithMeasuredRootSize = true
    }

    setUncontrolledSizes((prev) =>
      prev.length === 0 || prev.length !== nextCount || shouldResetToDefaultSizes
        ? [...panelDefaultSizes()]
        : prev,
    )
  })

  const updateSize = () => {
    const rect = rootRef!.getBoundingClientRect()
    const nextSize = orientation() === 'horizontal' ? rect.width : rect.height
    setRootSize(nextSize > EPSILON ? nextSize : 0)
  }

  function markPanelsTransitioning(panelIndexes: number[]): void {
    const uniqueIndexes = [...new Set(panelIndexes.filter((panelIndex) => panelIndex >= 0))]
    if (uniqueIndexes.length === 0) {
      return
    }

    setTransitioningPanelIndexes((prev) => {
      const next = new Set(prev)
      for (const panelIndex of uniqueIndexes) {
        next.add(panelIndex)
      }
      return [...next]
    })
  }

  function clearPanelTransition(panelIndex: number): void {
    setTransitioningPanelIndexes((prev) => {
      if (!prev.includes(panelIndex)) {
        return prev
      }
      return prev.filter((index) => index !== panelIndex)
    })
  }

  function onPanelTransitionFinish(panelIndex: number, event: TransitionEvent): void {
    if (event.target !== event.currentTarget || event.propertyName !== 'flex-grow') {
      return
    }

    clearPanelTransition(panelIndex)
  }

  onMount(() => {
    updateSize()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize)
      observer.observe(rootRef!)
      onCleanup(() => observer.disconnect())
    }
  })

  createEffect(() => {
    const maxPanelIndex = panelCount() - 1
    setTransitioningPanelIndexes((prev) => {
      const next = prev.filter((index) => index >= 0 && index <= maxPanelIndex)
      return next.length === prev.length ? prev : next
    })
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

  const panelCollapsibleStates = createMemo(() => panelItems().map((p) => p.collapsible))

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
    const transitionPanelIndexes: number[] = []

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
      transitionPanelIndexes.push(panelIndex)
      changed = true
    }

    prevCollapsibleStates = [...nextCollapsibleStates]

    if (changed) {
      markPanelsTransitioning(transitionPanelIndexes)
      emitSizes(nextSizes)
    }
  })

  function hasSizeChange(previousSizes: number[], nextSizes: number[]): boolean {
    if (previousSizes.length !== nextSizes.length) {
      return true
    }

    for (let index = 0; index < previousSizes.length; index += 1) {
      if (Math.abs(previousSizes[index]! - nextSizes[index]!) > EPSILON) {
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

  function resolveNearestCollapsiblePanelIndex(handleIndex: number): number | null {
    const panels = resolvedPanels()

    if (panels[handleIndex]?.collapsible) {
      return handleIndex
    }

    if (panels[handleIndex + 1]?.collapsible) {
      return handleIndex + 1
    }

    return null
  }

  function toggleHandleCollapse(handleIndex: number): void {
    const transitionPanelIndex = resolveNearestCollapsiblePanelIndex(handleIndex)
    const currentSizes = sizes()
    const nextSizes = normalizeSizes(
      toggleHandleNearestPanel({
        handleIndex,
        initialSizes: currentSizes,
        panels: resolvedPanels(),
        expandedSizes: lastExpandedSizes,
      }),
    )

    if (!hasSizeChange(currentSizes, nextSizes)) {
      return
    }

    if (transitionPanelIndex !== null) {
      markPanelsTransitioning([transitionPanelIndex])
    }

    emitSizes(nextSizes)
  }

  function resolveNearestCollapsibleState(handleIndex: number): {
    canCollapse: boolean
    collapsed: boolean
  } {
    const panels = resolvedPanels()
    const panelIndex = resolveNearestCollapsiblePanelIndex(handleIndex)
    if (panelIndex !== null) {
      const panel = panels[panelIndex]
      return {
        canCollapse: true,
        collapsed: panel ? isPanelCollapsed(sizes()[panelIndex] ?? 0, panel) : false,
      }
    }

    return {
      canCollapse: false,
      collapsed: false,
    }
  }

  function beginResize(nextSizes: number[]): void {
    local.onResizeStart?.(resolvePixelSizes(nextSizes))
  }

  function endResize(nextSizes: number[]): void {
    local.onResizeEnd?.(resolvePixelSizes(nextSizes))
  }

  function emitSizes(normalizedSizes: number[]): void {
    if (normalizedControlledSizes() === undefined) {
      setUncontrolledSizes(
        normalizedSizes.map((size): ResizableSize => `${fixToPrecision(size * 100)}%`),
      )
    }

    local.onResize?.(resolvePixelSizes(normalizedSizes))
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
    } else {
      // Incremental mode: base each resize step on the last committed sizes
      // so that a per-frame delta accumulates correctly without position jumps.
      drag.initialSizes = [...drag.lastSizes]
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
    const currentSizes = drag.lastSizes

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
    if (local.disable || !isHandleResizable(handleIndex)) {
      return
    }

    local.onHandleKeyDown?.({
      event,
      handleIndex,
      sizes: resolvePixelSizes(sizes()),
    })

    if (event.defaultPrevented) {
      return
    }

    const keyboardDelta = resolveKeyboardDelta(local.keyboardDelta, rootSize())
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
      ref={(element) => {
        rootRef = element
        callRef(local.ref, element)
      }}
      id={local.id}
      data-slot="root"
      data-resizable-root
      data-orientation={orientation()}
      {...rest}
      {...resolved.rootClassAndStyle()}
    >
      <Index each={resolvedPanels()}>
        {(panel, index) => {
          const panelItem = createMemo(() => panel())
          const size = () => sizes()[index] ?? 0
          const collapsed = () => isPanelCollapsed(size(), panelItem())
          const handleDisabled = createMemo(
            () => local.disable === true || !isHandleResizable(index),
          )
          const handleCollapseAction = createMemo(
            () => local.handleAction === 'collapse' && local.disable !== true,
          )
          const handleRenderDisabled = createMemo(() =>
            local.handleAction === 'collapse' ? local.disable === true : handleDisabled(),
          )
          const collapseState = createMemo(() => resolveNearestCollapsibleState(index))

          const aria = createMemo(() =>
            getHandleAria({ handleIndex: index, sizes: sizes(), panels: resolvedPanels() }),
          )

          const bindings = useResizableHandle({
            handleIndex: () => index,
            orientation,
            disable: handleDisabled,
            intersection: () => local.intersection,
            onDrag: resizeHandleByDelta,
            onDragEnd: stopHandleDrag,
            onKeyDown: onHandleKeyDown,
          })

          function onHandlePointerDown(event: PointerEvent): void {
            if (!handleCollapseAction()) {
              return
            }

            event.stopPropagation()
          }

          function onHandleClick(event: MouseEvent): void {
            if (!handleCollapseAction()) {
              return
            }

            event.stopPropagation()
            toggleHandleCollapse(index)
          }

          const handleRenderProps: ResizableT.HandleRenderProps = {
            get orientation() {
              return orientation()
            },
            get disabled() {
              return handleRenderDisabled()
            },
            get action() {
              return local.handleAction
            },
            get active() {
              return bindings.active()
            },
            get dragging() {
              return bindings.dragging()
            },
            get canCollapse() {
              return collapseState().canCollapse
            },
            get collapsed() {
              return collapseState().collapsed
            },
          }

          const isTransitioning = createMemo(() => transitioningPanelIndexes().includes(index))

          return (
            <>
              <div
                id={panelItem().panelId}
                data-slot="panel"
                data-orientation={orientation()}
                data-collapsed={collapsed() ? '' : undefined}
                data-expanded={panelItem().collapsible && !collapsed() ? '' : undefined}
                data-resizing={interactionResizing() ? '' : undefined}
                data-transitioning={isTransitioning() ? '' : undefined}
                {...resolved.slotClassAndStyle('panel', {
                  get state() {
                    return {
                      class: panelItem().class,
                      style: {
                        'flex-grow': size(),
                        'flex-shrink': 1,
                        'flex-basis': '0px',
                        ...(panelItem().style as JSX.CSSProperties),
                      },
                    }
                  },
                })}
                onTransitionEnd={(event) => onPanelTransitionFinish(index, event)}
                onTransitionCancel={(event) => onPanelTransitionFinish(index, event)}
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
                  data-orientation={orientation()}
                  data-active={bindings.active() ? '' : undefined}
                  data-cross={bindings.crossHovered() ? '' : undefined}
                  data-dragging={bindings.dragging() ? '' : undefined}
                  {...resolved.slotClassAndStyle('divider')}
                  onMouseEnter={bindings.onMouseEnter}
                  onMouseLeave={bindings.onMouseLeave}
                  onFocus={bindings.onFocus}
                  onBlur={bindings.onBlur}
                  onKeyDown={bindings.onKeyDown}
                  onPointerDown={bindings.onPointerDown}
                >
                  <Show when={bindings.startIntersectionVisible()}>
                    <div
                      data-slot="crossTarget"
                      data-resizable-handle-start-target
                      {...resolved.slotClassAndStyle('crossTarget')}
                      onMouseEnter={() =>
                        bindings.onIntersectionMouseEnter(RESIZABLE_HANDLE_TARGET_START)
                      }
                      onMouseLeave={bindings.onIntersectionMouseLeave}
                    />
                  </Show>

                  <Show when={local.handle}>
                    <button
                      type="button"
                      data-slot="handle"
                      tabIndex={local.handleAction === 'collapse' ? undefined : -1}
                      onPointerDown={onHandlePointerDown}
                      onClick={onHandleClick}
                      data-collapse={handleCollapseAction() ? '' : undefined}
                      {...resolved.slotClassAndStyle('handle')}
                    >
                      <Show when={local.handleRender !== undefined}>
                        {renderComponentOrElement(local.handleRender, handleRenderProps)}
                      </Show>
                    </button>
                  </Show>

                  <Show when={bindings.endIntersectionVisible()}>
                    <div
                      data-slot="crossTarget"
                      data-resizable-handle-end-target
                      {...resolved.slotClassAndStyle('crossTarget')}
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
