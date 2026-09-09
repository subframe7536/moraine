import type { JSX } from 'solid-js'
import {
  Index,
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  onCleanup,
  onMount,
} from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef, cn, useId } from '../../shared/utils.ts'

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
  deltaPx: number
  initialSizes: number[]
  handleIndex: number
  altKey: boolean
  started: boolean
  lastSizes: number[]
}

const RESIZABLE_PANEL_PART = Symbol('Resizable.Panel')
const RESIZABLE_HANDLE_PART = Symbol('Resizable.Handle')

type PanelLocalProps = Pick<
  ResizableT.PanelProps,
  | 'id'
  | 'size'
  | 'defaultSize'
  | 'min'
  | 'max'
  | 'resizable'
  | 'collapsible'
  | 'collapsibleMin'
  | 'onResize'
  | 'onCollapse'
  | 'onExpand'
  | 'class'
  | 'style'
  | 'ref'
  | 'onTransitionEnd'
  | 'onTransitionCancel'
>

interface PanelPart {
  kind: typeof RESIZABLE_PANEL_PART
  local: PanelLocalProps
  rest: Omit<ResizableT.PanelProps, keyof PanelLocalProps | 'children'>
  content: () => JSX.Element
}

type HandleLocalProps = Pick<
  ResizableT.HandleProps,
  | 'action'
  | 'intersection'
  | 'class'
  | 'style'
  | 'ref'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
  | 'onPointerDown'
  | 'onClick'
>

interface HandlePart {
  kind: typeof RESIZABLE_HANDLE_PART
  local: HandleLocalProps
  rest: Omit<ResizableT.HandleProps, keyof HandleLocalProps | 'children'>
  content: () => ResizableT.HandleBase['children']
}

type ResizablePart = PanelPart | HandlePart

function isResizablePart(value: unknown): value is ResizablePart {
  if (typeof value !== 'object' || value === null || !('kind' in value)) {
    return false
  }

  return value.kind === RESIZABLE_PANEL_PART || value.kind === RESIZABLE_HANDLE_PART
}

function ResizablePanel(props: ResizableT.PanelProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'size',
    'defaultSize',
    'min',
    'max',
    'resizable',
    'collapsible',
    'collapsibleMin',
    'onResize',
    'onCollapse',
    'onExpand',
    'children',
    'class',
    'style',
    'ref',
    'onTransitionEnd',
    'onTransitionCancel',
  ])
  const content = resolveChildren(() => local.children)

  return {
    kind: RESIZABLE_PANEL_PART,
    local,
    rest,
    content,
  } as unknown as JSX.Element
}

function ResizableHandle(props: ResizableT.HandleProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'action',
    'intersection',
    'children',
    'class',
    'style',
    'ref',
    'onMouseEnter',
    'onMouseLeave',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onPointerDown',
    'onClick',
  ])
  const content = createMemo(() => local.children)

  return {
    kind: RESIZABLE_HANDLE_PART,
    local,
    rest,
    content,
  } as unknown as JSX.Element
}

/** Resizable panel layout with draggable dividers and keyboard support. */
export function Resizable(props: ResizableProps): JSX.Element {
  const [localProps, rest] = splitProps(props, [
    'id',
    'children',
    'onResize',
    'onResizeStart',
    'onResizeEnd',
    'onHandleKeyDown',
    'disable',
    'keyboardDelta',
    'orientation',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  ])
  const local = mergeProps(
    {
      keyboardDelta: '10%' as const,
      orientation: 'horizontal' as const,
    },
    localProps,
  )
  const resolved = createComponentStyles('resizable', local)

  const panelIdPrefix = useId(() => local.id, 'resizable')
  const orientation = () => local.orientation
  const content = resolveChildren(() => local.children)

  const parts = createMemo(() => {
    const values: unknown[] = content
      .toArray()
      .filter((value) => value !== null && value !== undefined && value !== false && value !== true)

    if (!values.every(isResizablePart)) {
      throw new Error('Resizable only accepts Resizable.Panel and Resizable.Handle children')
    }

    const validated = values

    validated.forEach((part, index) => {
      if (
        part.kind === RESIZABLE_HANDLE_PART &&
        (validated[index - 1]?.kind !== RESIZABLE_PANEL_PART ||
          validated[index + 1]?.kind !== RESIZABLE_PANEL_PART)
      ) {
        throw new Error('Resizable.Handle must be placed between two Resizable.Panel children')
      }
    })

    return validated
  })
  const panelParts = createMemo(() =>
    parts().filter((part): part is PanelPart => part.kind === RESIZABLE_PANEL_PART),
  )
  const handleParts = createMemo(() => {
    const handles = new Map<number, HandlePart>()
    let panelIndex = -1

    for (const part of parts()) {
      if (part.kind === RESIZABLE_PANEL_PART) {
        panelIndex += 1
      } else {
        handles.set(panelIndex, part)
      }
    }

    return handles
  })

  let rootRef: HTMLDivElement | undefined = undefined
  const [rootSize, setRootSize] = createSignal(0)
  const [uncontrolledSizes, setUncontrolledSizes] = createSignal<Array<ResizableSize | undefined>>(
    [],
  )
  const [interactionResizing, setInteractionResizing] = createSignal(false)
  const [transitioningPanelIndexes, setTransitioningPanelIndexes] = createSignal<number[]>([])
  let initializedWithMeasuredRootSize = false
  const panelItems = createMemo<ResizablePanelItem[]>(() =>
    panelParts().map((part) => ({
      panelId: part.local.id,
      size: part.local.size,
      defaultSize: part.local.defaultSize,
      min: part.local.min,
      max: part.local.max,
      resizable: part.local.resizable,
      collapsible: part.local.collapsible,
      collapsibleMin: part.local.collapsibleMin,
      onResize: part.local.onResize,
      onCollapse: part.local.onCollapse,
      onExpand: part.local.onExpand,
      class: cn(part.local.class),
      style: part.local.style,
      content: part.content(),
    })),
  )

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
      deltaPx: 0,
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

    drag.deltaPx += deltaPx

    const nextSizes = normalizeSizes(
      resizeFromHandle({
        handleIndex,
        deltaPercentage: drag.deltaPx / Math.max(rootSize(), 1),
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
      {...rest}
      {...resolved.root}
    >
      <Index each={resolvedPanels()}>
        {(panel, index) => {
          const panelItem = createMemo(() => panel())
          const panelPart = createMemo(() => panelParts()[index])
          const size = () => sizes()[index] ?? 0
          const collapsed = () => isPanelCollapsed(size(), panelItem())
          const isTransitioning = createMemo(() => transitioningPanelIndexes().includes(index))

          return (
            <>
              <div
                ref={(element) => callRef(panelPart()!.local.ref, element)}
                {...panelPart()!.rest}
                id={panelItem().panelId}
                data-slot="panel"
                data-collapsed={collapsed() ? '' : undefined}
                data-expanded={panelItem().collapsible && !collapsed() ? '' : undefined}
                data-resizing={interactionResizing() ? '' : undefined}
                data-transitioning={isTransitioning() ? '' : undefined}
                class={cn(resolved.slot('panel').class, panelItem().class)}
                style={{
                  'flex-grow': size(),
                  'flex-shrink': 1,
                  'flex-basis': '0px',
                  ...resolved.slot('panel').style,
                  ...(panelItem().style as JSX.CSSProperties),
                }}
                onTransitionEnd={(event) => {
                  const result = callHandler(event, panelPart()!.local.onTransitionEnd)
                  if (!result.defaultPrevented) {
                    onPanelTransitionFinish(index, event)
                  }
                }}
                onTransitionCancel={(event) => {
                  const result = callHandler(event, panelPart()!.local.onTransitionCancel)
                  if (!result.defaultPrevented) {
                    onPanelTransitionFinish(index, event)
                  }
                }}
              >
                {panelItem().content}
              </div>

              <Show when={handleParts().get(index)}>
                {(handlePart) => {
                  const action = () => handlePart().local.action ?? 'resize'
                  const handleDisabled = createMemo(
                    () => local.disable === true || !isHandleResizable(index),
                  )
                  const handleCollapseAction = createMemo(
                    () => action() === 'collapse' && local.disable !== true,
                  )
                  const gripDisabled = createMemo(() =>
                    action() === 'collapse' ? local.disable === true : handleDisabled(),
                  )
                  const collapseState = createMemo(() => resolveNearestCollapsibleState(index))
                  const aria = createMemo(() =>
                    getHandleAria({ handleIndex: index, sizes: sizes(), panels: resolvedPanels() }),
                  )
                  const bindings = useResizableHandle({
                    handleIndex: () => index,
                    orientation,
                    disable: handleDisabled,
                    intersection: () => handlePart().local.intersection,
                    onDrag: resizeHandleByDelta,
                    onDragEnd: stopHandleDrag,
                    onKeyDown: onHandleKeyDown,
                  })

                  function callHandleEvent<E extends Event>(
                    event: E,
                    handler: unknown,
                    internal: (event: E) => void,
                  ): void {
                    const result = callHandler(event, handler)
                    if (!result.defaultPrevented) {
                      internal(event)
                    }
                  }

                  function onDividerPointerDown(event: PointerEvent): void {
                    callHandleEvent(event, handlePart().local.onPointerDown, bindings.onPointerDown)
                  }

                  function onGripPointerDown(event: PointerEvent): void {
                    if (!handleCollapseAction()) {
                      return
                    }

                    callHandler(event, handlePart().local.onPointerDown)
                    if (!event.defaultPrevented) {
                      event.stopPropagation()
                    }
                  }

                  function onHandleClick(event: MouseEvent): void {
                    if (!handleCollapseAction()) {
                      return
                    }

                    const result = callHandler(event, handlePart().local.onClick)
                    if (result.defaultPrevented) {
                      return
                    }

                    event.stopPropagation()
                    toggleHandleCollapse(index)
                  }

                  const handleContext: ResizableT.HandleContext = {
                    get orientation() {
                      return orientation()
                    },
                    get disabled() {
                      return gripDisabled()
                    },
                    get action() {
                      return action()
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

                  return (
                    <div
                      ref={(element) => {
                        bindings.setElement(element)
                        callRef(handlePart().local.ref, element)
                      }}
                      {...handlePart().rest}
                      role="separator"
                      aria-controls={aria().controls}
                      aria-orientation={orientation()}
                      aria-valuemin={aria().valueMin}
                      aria-valuemax={aria().valueMax}
                      aria-valuenow={aria().valueNow}
                      aria-disabled={handleDisabled() ? 'true' : undefined}
                      tabIndex={handleDisabled() ? -1 : 0}
                      data-slot="divider"
                      data-active={bindings.active() ? '' : undefined}
                      data-cross={bindings.crossHovered() ? '' : undefined}
                      data-dragging={bindings.dragging() ? '' : undefined}
                      class={cn(resolved.slot('divider').class, handlePart().local.class)}
                      style={{
                        ...resolved.slot('divider').style,
                        ...(handlePart().local.style as JSX.CSSProperties),
                      }}
                      onMouseEnter={(event) =>
                        callHandleEvent(
                          event,
                          handlePart().local.onMouseEnter,
                          bindings.onMouseEnter,
                        )
                      }
                      onMouseLeave={(event) =>
                        callHandleEvent(
                          event,
                          handlePart().local.onMouseLeave,
                          bindings.onMouseLeave,
                        )
                      }
                      onFocus={(event) =>
                        callHandleEvent(event, handlePart().local.onFocus, bindings.onFocus)
                      }
                      onBlur={(event) =>
                        callHandleEvent(event, handlePart().local.onBlur, bindings.onBlur)
                      }
                      onKeyDown={(event) =>
                        callHandleEvent(event, handlePart().local.onKeyDown, bindings.onKeyDown)
                      }
                      onPointerDown={onDividerPointerDown}
                      onClick={(event) => callHandler(event, handlePart().local.onClick)}
                    >
                      <Show when={bindings.startIntersectionVisible()}>
                        <div
                          data-slot="crossTarget"
                          data-resizable-handle-start-target
                          {...resolved.slot('crossTarget')}
                          onMouseEnter={() =>
                            bindings.onIntersectionMouseEnter(RESIZABLE_HANDLE_TARGET_START)
                          }
                          onMouseLeave={bindings.onIntersectionMouseLeave}
                        />
                      </Show>

                      <Show when={handlePart().content() !== false}>
                        <button
                          type="button"
                          data-slot="handle"
                          tabIndex={action() === 'collapse' ? undefined : -1}
                          onPointerDown={onGripPointerDown}
                          onClick={onHandleClick}
                          data-collapse={handleCollapseAction() ? '' : undefined}
                          {...resolved.slot('handle')}
                        >
                          <Show when={handlePart().content() !== undefined}>
                            {renderComponentOrElement(handlePart().content(), handleContext)}
                          </Show>
                        </button>
                      </Show>

                      <Show when={bindings.endIntersectionVisible()}>
                        <div
                          data-slot="crossTarget"
                          data-resizable-handle-end-target
                          {...resolved.slot('crossTarget')}
                          onMouseEnter={() =>
                            bindings.onIntersectionMouseEnter(RESIZABLE_HANDLE_TARGET_END)
                          }
                          onMouseLeave={bindings.onIntersectionMouseLeave}
                        />
                      </Show>
                    </div>
                  )
                }}
              </Show>
            </>
          )
        }}
      </Index>
    </div>
  )
}

Resizable.Panel = ResizablePanel
Resizable.Handle = ResizableHandle
