import type { JSX } from '@solidjs/web'
import { isServer } from '@solidjs/web'
import {
  createEffect,
  createMemo,
  createSignal,
  getNextChildId,
  getOwner,
  onSettled,
  untrack,
  omit,
} from 'solid-js'

import { createKeyDownHandler } from '../../shared/keyboard'
import type { KeyBinding } from '../../shared/keyboard'
import { callRef } from '../../shared/utils'
import { pickSlotOverrides, useRecipe } from '../../theme/use-recipe'
import { resolveDirection } from '../shared/overlay/direction'

import {
  EPSILON,
  RESIZE_FLAG_FOLLOWING,
  clamp,
  collapsePanel as collapsePanelSizes,
  expandPanel as expandPanelSizes,
  fixToPrecision,
  isPanelCollapsed,
  normalizePanelSizes,
  resizeFromHandle,
  resizePanelToSize,
  toggleHandleNearestPanel,
} from './hook'
import type { ResizableOrientation, ResizableResolvedPanel } from './hook'
import { ResizableProvider } from './resizable-context'
import type {
  ResizableContext,
  ResizableItem,
  ResizablePanelRegistration,
} from './resizable-context'
import { ResizableHandle } from './resizable-handle'
import { ResizablePanel, useResizablePanel } from './resizable-panel'
import { resizableDataAttributes, resizableRecipe } from './resizable.recipe'
import type { ResizableProps, ResizableT } from './resizable.types'
const DEFAULT_STEP = 10

interface DragState {
  panelIndex: number
  altKey: boolean
  /** True once the session produced a layout change; survives re-basing. */
  started: boolean
  /** Layout before the session's first change; survives re-basing. */
  commitBaseline: Array<number>
  deltaPx: number
  panelSpacePx: number
  initialSizes: Array<number>
  lastSizes: Array<number>
}

function hasSizeChange(previous: Array<number>, next: Array<number>): boolean {
  if (previous.length !== next.length) {
    return true
  }

  return next.some((size, index) => Math.abs(size - (previous[index] ?? 0)) > EPSILON)
}

function collapsedSizeFraction(panel: ResizablePanelRegistration): number {
  return panel.collapsedSize() / 100
}

// Panels register progressively while the group renders, so a server memo
// would cache an incomplete `items()` snapshot. The server keeps plain
// accessors but reserves the same hydration id slot the client memo owns so
// server and client owner trees stay aligned.
function createResizableMemo<T>(fn: () => T): () => T {
  if (isServer) {
    const owner = getOwner()
    if (owner?.id !== undefined) {
      getNextChildId(owner)
    }
    return fn
  }
  return createMemo(fn)
}

/** Minimum bound used for normalization: collapsed panels floor at collapsedSize. */
function normalizedMinFraction(
  panel: ResizablePanelRegistration,
  layout: ResizableT.Layout | undefined,
): number {
  const collapsedSize = collapsedSizeFraction(panel)
  const entry = layout?.[panel.id()]
  if (panel.collapsible() && entry !== undefined && entry / 100 <= collapsedSize + EPSILON) {
    return collapsedSize
  }
  return panel.min() / 100
}

function resolveLayoutFractions(
  panels: Array<ResizablePanelRegistration>,
  layout: ResizableT.Layout | undefined,
): Array<number> {
  const panelCount = panels.length
  if (panelCount === 0) {
    return []
  }

  const controlled: Array<number | undefined> = []
  let knownSum = 0
  let missingCount = 0

  for (const panel of panels) {
    const entry = layout?.[panel.id()]
    if (entry === undefined) {
      controlled.push(undefined)
      missingCount += 1
    } else {
      const fraction = entry / 100
      controlled.push(fraction)
      knownSum += fraction
    }
  }

  const remainder = 1 - knownSum
  const missingShare =
    missingCount === 0 ? 0 : remainder > EPSILON ? remainder / missingCount : 1 / panelCount

  return normalizePanelSizes({
    panelCount,
    panelInitialSizes: controlled.map((entry) => (entry === undefined ? missingShare : undefined)),
    panelMinSizes: panels.map((panel) => normalizedMinFraction(panel, layout)),
    panelMaxSizes: panels.map((panel) => Math.max(panel.min(), panel.max()) / 100),
    controlledSizes: controlled,
  })
}

/**
 * Applies the live collapse threshold: a collapsible panel collapses to
 * `collapsedSize` once the candidate drops below `(min + collapsedSize) / 2`,
 * and a collapsed panel expands back to `min` past the same midpoint.
 */
function resolveThresholdedSizes(
  candidate: Array<number>,
  previousSizes: Array<number>,
  specs: Array<ResizableResolvedPanel>,
): Array<number> {
  let sizes = candidate

  for (let guard = 0; guard < 4; guard += 1) {
    const pins = new Map<number, number>()

    specs.forEach((panel, index) => {
      if (!panel.collapsible || panel.min <= panel.collapsedSize + EPSILON) {
        return
      }

      const midpoint = (panel.min + panel.collapsedSize) / 2
      const wasCollapsed = (previousSizes[index] ?? 0) <= panel.collapsedSize + EPSILON
      const value = sizes[index] ?? 0

      if (wasCollapsed) {
        if (value <= midpoint + EPSILON) {
          pins.set(index, panel.collapsedSize)
        } else if (value < panel.min - EPSILON) {
          pins.set(index, panel.min)
        }
      } else if (value < midpoint - EPSILON) {
        pins.set(index, panel.collapsedSize)
      } else if (value < panel.min - EPSILON) {
        pins.set(index, panel.min)
      }
    })

    if (pins.size === 0) {
      return sizes
    }

    const floorSpecs = specs.map((panel) => ({
      ...panel,
      min: panel.collapsible ? panel.collapsedSize : panel.min,
    }))
    const pinned = floorSpecs.map((panel, index) => {
      const pin = pins.get(index)
      if (pin !== undefined) {
        panel.min = pin
        panel.max = pin
      }
      return panel
    })

    let next = sizes
    for (const [index, pin] of pins) {
      next = resizePanelToSize({
        panelIndex: index,
        size: pin,
        strategy: RESIZE_FLAG_FOLLOWING,
        initialSizes: next,
        panels: pinned,
      })
    }

    if (!hasSizeChange(sizes, next)) {
      return next
    }
    sizes = next
  }

  return sizes
}

/**
 * Split layout of draggable, keyboard-accessible panels for multi-pane interfaces. The group owns
 * the size of every panel as a layout record keyed by panel `id`, with sizes as percentages
 * (0-100); it is uncontrolled with `defaultValue` or controlled through `value` and
 * `onValueChange`. Lays panels out horizontally unless `orientation` is `vertical`. For a single
 * expandable disclosure or a drawer, use `Collapsible` or `Sheet` instead.
 *
 * @example
 * ```tsx
 * import { Resizable } from 'moraine'
 *
 * <div class="h-64 w-full">
 *   <Resizable defaultValue={{ sidebar: 30, content: 70 }}>
 *     <Resizable.Panel id="sidebar" min={20}>
 *       Sidebar
 *     </Resizable.Panel>
 *     <Resizable.Handle />
 *     <Resizable.Panel id="content" min={30}>
 *       Content
 *     </Resizable.Panel>
 *   </Resizable>
 * </div>
 * ```
 */
export function Resizable(props: ResizableProps): JSX.Element {
  const rest = omit(
    props,
    'id',
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'onValueCommit',
    'disabled',
    'step',
    'orientation',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  )

  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(resizableRecipe, props, {
    data: { root: resizableDataAttributes.root({ splitterRoot: true }) },
  })

  const orientation = (): ResizableOrientation => variants.orientation ?? 'horizontal'
  const disabled = () => props.disabled === true
  const step = () => props.step ?? DEFAULT_STEP

  const [settled, setSettled] = createSignal(false)
  const [resizing, setResizing] = createSignal(false)
  const [transitioningIds, setTransitioningIds] = createSignal<Array<string>>([])
  const [clientItems, setClientItems] = createSignal<Array<ResizableItem>>([])
  const serverItems: Array<ResizableItem> = []
  const items = isServer ? () => serverItems : clientItems
  const [uncontrolledLayout, setUncontrolledLayout] = createSignal<ResizableT.Layout | undefined>(
    untrack(() => (props.defaultValue ? { ...props.defaultValue } : undefined)),
  )

  let seq = 0
  let drag: DragState | null = null
  const lastExpandedSizes = new Map<string, number>()
  const previousCollapsed = new Map<string, boolean>()

  onSettled(() => {
    setSettled(true)
  })

  // The server evaluates createMemo eagerly before children register,
  // so SSR uses plain accessors while the client memoizes to avoid sorting
  // and layout recalculation on every panel read during drag sessions.
  const rawOrderedItems = (): Array<ResizableItem> => {
    const list = items()
    if (!settled() || list.length < 2) {
      return list
    }

    return [...list].sort((a, b) => {
      const elementA = a.kind === 'panel' ? a.panel.element() : a.handle.element()
      const elementB = b.kind === 'panel' ? b.panel.element() : b.handle.element()
      if (elementA && elementB && elementA !== elementB) {
        return elementA.compareDocumentPosition(elementB) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1
      }
      return a.seq - b.seq
    })
  }

  const rawOrderedPanels = (): Array<ResizablePanelRegistration> =>
    orderedItems().flatMap((item) => (item.kind === 'panel' ? [item.panel] : []))

  const orderedItems = createResizableMemo(rawOrderedItems)
  const orderedPanels = createResizableMemo(rawOrderedPanels)

  const sourceLayout = () => props.value ?? uncontrolledLayout()

  /** Resolved panel sizes as fractions (0..1), aligned with `orderedPanels()`. */
  const rawResolved = (): Array<number> => resolveLayoutFractions(orderedPanels(), sourceLayout())
  const resolved = createResizableMemo(rawResolved)

  /** Panel constraints for the resize algorithms; `collapsedFloor` lowers every collapsible min to collapsedSize. */
  function panelSpecs(collapsedFloor = false): Array<ResizableResolvedPanel> {
    return orderedPanels().map((panel) => {
      const min = panel.min() / 100
      const collapsedSize = collapsedSizeFraction(panel)
      return {
        panelId: panel.id(),
        min: collapsedFloor && panel.collapsible() ? collapsedSize : min,
        max: Math.max(min, panel.max() / 100),
        resizable: panel.resizable(),
        collapsible: panel.collapsible(),
        collapsedSize,
      }
    })
  }

  function toLayoutRecord(fractions: Array<number>): ResizableT.Layout {
    const record: ResizableT.Layout = {}
    orderedPanels().forEach((panel, index) => {
      record[panel.id()] = fixToPrecision((fractions[index] ?? 0) * 100)
    })
    return record
  }

  /** Emits `onValueChange` and updates uncontrolled state when the layout changed. */
  function applyLayout(next: Array<number>): boolean {
    if (!hasSizeChange(resolved(), next)) {
      return false
    }

    const record = toLayoutRecord(next)
    if (props.value === undefined) {
      setUncontrolledLayout(record)
    }
    props.onValueChange?.(record)
    return true
  }

  function commitLayout(next: Array<number>): void {
    props.onValueCommit?.(toLayoutRecord(next))
  }

  function markTransitioning(id: string): void {
    setTransitioningIds((previous) => (previous.includes(id) ? previous : [...previous, id]))
  }

  function panelIndexOf(panel: ResizablePanelRegistration): number {
    return orderedPanels().indexOf(panel)
  }

  function panelIndexById(id: string): number {
    return orderedPanels().findIndex((panel) => panel.id() === id)
  }

  // ---------------------------------------------------------------------------
  // Drag
  // ---------------------------------------------------------------------------

  function measurePanelSpacePx(): number {
    let total = 0
    for (const panel of orderedPanels()) {
      const element = panel.element()
      if (!element) {
        continue
      }
      const rect = element.getBoundingClientRect()
      total += orientation() === 'horizontal' ? rect.width : rect.height
    }
    return total
  }

  function dragHandle(precedingIndex: number, deltaPx: number, altKey: boolean): void {
    const panels = orderedPanels()
    if (panels.length <= 1 || precedingIndex < 0 || precedingIndex >= panels.length) {
      return
    }

    if (!drag || drag.panelIndex !== precedingIndex || drag.altKey !== altKey) {
      // Re-base the computation (alt flipped mid-drag or a different handle);
      // the session's commit state carries over.
      const sizes = resolved().slice()
      drag = {
        panelIndex: precedingIndex,
        altKey,
        started: drag?.started ?? false,
        commitBaseline: drag?.started === true ? drag.commitBaseline : sizes,
        deltaPx: 0,
        panelSpacePx: Math.max(measurePanelSpacePx(), 1),
        initialSizes: sizes,
        lastSizes: sizes,
      }
    }

    drag.deltaPx += deltaPx
    const candidate = resizeFromHandle({
      handleIndex: precedingIndex,
      deltaPercentage: drag.deltaPx / drag.panelSpacePx,
      altKey,
      initialSizes: drag.initialSizes,
      panels: panelSpecs(true),
    })
    const next = resolveThresholdedSizes(candidate, drag.lastSizes, panelSpecs())
    if (!hasSizeChange(drag.lastSizes, next)) {
      return
    }
    drag.lastSizes = next

    if (applyLayout(next)) {
      drag.started = true
      setResizing(true)
    }
  }

  function endHandleDrag(): void {
    const session = drag
    drag = null
    setResizing(false)

    if (session?.started && hasSizeChange(session.commitBaseline, session.lastSizes)) {
      commitLayout(session.lastSizes)
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard + collapse toggles
  // ---------------------------------------------------------------------------

  function resizeHandleByPercentage(
    precedingIndex: number,
    deltaPercentage: number,
    altKey: boolean,
    event: KeyboardEvent,
  ): void {
    const specs = panelSpecs()
    if (specs.length <= 1 || precedingIndex < 0 || precedingIndex >= specs.length) {
      return
    }

    const next = resizeFromHandle({
      handleIndex: precedingIndex,
      deltaPercentage,
      altKey,
      initialSizes: resolved(),
      panels: specs,
    })
    if (!hasSizeChange(resolved(), next)) {
      return
    }

    applyLayout(next)
    commitLayout(next)
    setResizing(true)
    queueMicrotask(() => setResizing(false))
    event.preventDefault()
  }

  /** Toggles the nearest collapsible neighbor (preceding first, then following). */
  function toggleHandleCollapse(precedingIndex: number): boolean {
    const specs = panelSpecs()
    if (specs.length <= 1 || precedingIndex < 0 || precedingIndex >= specs.length) {
      return false
    }

    const current = resolved()
    const next = toggleHandleNearestPanel({
      handleIndex: precedingIndex,
      initialSizes: current,
      panels: specs,
      expandedSizes: specs.map(
        (spec, index) => lastExpandedSizes.get(spec.panelId) ?? current[index] ?? 0,
      ),
    })
    if (!applyLayout(next)) {
      return false
    }

    const toggled = specs.findIndex(
      (spec, index) =>
        isPanelCollapsed(current[index] ?? 0, spec) !== isPanelCollapsed(next[index] ?? 0, spec),
    )
    const toggledSpec = toggled >= 0 ? specs[toggled] : undefined
    if (toggledSpec) {
      markTransitioning(toggledSpec.panelId)
    }
    commitLayout(next)
    return true
  }

  const dispatchHandleKeyDown = createKeyDownHandler<HTMLElement, [number]>({
    keys: (event, precedingIndex) => {
      const horizontal = orientation() === 'horizontal'
      const rtl =
        horizontal &&
        event.currentTarget instanceof Element &&
        resolveDirection(event.currentTarget) === 'rtl'
      const resize = (deltaPercentage: number) =>
        resizeHandleByPercentage(precedingIndex, deltaPercentage, event.altKey, event)
      const collapse: KeyBinding<HTMLElement, [number]> = {
        preventDefault: false,
        handle: () => {
          if (toggleHandleCollapse(precedingIndex)) {
            event.preventDefault()
          }
        },
      }

      return {
        Enter: collapse,
        [horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp']: {
          preventDefault: false,
          handle: () => resize(event.shiftKey ? -1 : -(step() / 100)),
        },
        [horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown']: {
          preventDefault: false,
          handle: () => resize(event.shiftKey ? 1 : step() / 100),
        },
        Home: { preventDefault: false, handle: () => resize(-1) },
        End: { preventDefault: false, handle: () => resize(1) },
      }
    },
  })

  function handleKeyDown(precedingIndex: number, event: KeyboardEvent): void {
    if (precedingIndex < 0) {
      return
    }
    dispatchHandleKeyDown(event, precedingIndex)
  }

  // ---------------------------------------------------------------------------
  // Panel API (Resizable.usePanel)
  // ---------------------------------------------------------------------------

  function collapsePanel(id: string): void {
    const index = panelIndexById(id)
    if (index < 0) {
      return
    }

    const next = collapsePanelSizes({
      panelIndex: index,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: resolved(),
      panels: panelSpecs(),
    })
    if (!applyLayout(next)) {
      return
    }
    markTransitioning(id)
    commitLayout(next)
  }

  function expandPanel(id: string): void {
    const index = panelIndexById(id)
    if (index < 0) {
      return
    }

    const specs = panelSpecs()
    const spec = specs[index]
    if (!spec) {
      return
    }
    const next = expandPanelSizes({
      panelIndex: index,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: resolved(),
      panels: specs,
      expandedSize: lastExpandedSizes.get(id) ?? spec.min,
    })
    if (!applyLayout(next)) {
      return
    }
    markTransitioning(id)
    commitLayout(next)
  }

  function resizePanel(id: string, size: number): void {
    const index = panelIndexById(id)
    if (index < 0) {
      return
    }

    const next = resizePanelToSize({
      panelIndex: index,
      size: size / 100,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: resolved(),
      panels: panelSpecs(),
    })
    if (!applyLayout(next)) {
      return
    }
    commitLayout(next)
  }

  // ---------------------------------------------------------------------------
  // Collapse transition callbacks
  // ---------------------------------------------------------------------------

  createEffect(
    () => {
      const sizes = resolved()
      return orderedPanels().map((panel, index) => ({
        panel,
        id: panel.id(),
        size: sizes[index] ?? 0,
        collapsedSize: collapsedSizeFraction(panel),
        collapsible: panel.collapsible(),
      }))
    },
    (entries) => {
      entries.forEach(({ panel, id, size, collapsedSize, collapsible }) => {
        const collapsed = isPanelCollapsed(size, { collapsible, collapsedSize })
        const previous = previousCollapsed.get(id)

        if (previous !== undefined && previous !== collapsed) {
          if (collapsed) {
            panel.onCollapse()
          } else {
            panel.onExpand()
          }
        }
        if (!collapsed && size > collapsedSize + EPSILON) {
          lastExpandedSizes.set(id, size)
        }
        previousCollapsed.set(id, collapsed)
      })
    },
  )

  // ---------------------------------------------------------------------------
  // Registration + context
  // ---------------------------------------------------------------------------

  function registerItem(item: ResizableItem): () => void {
    item.seq = seq
    seq += 1
    const stored = item
    if (isServer) {
      serverItems.push(stored)
      return () => {
        const index = serverItems.indexOf(stored)
        if (index >= 0) {
          serverItems.splice(index, 1)
        }
      }
    }
    let registered = false
    let disposed = false
    createEffect(
      () => undefined,
      () => {
        if (disposed) {
          return
        }
        registered = true
        setClientItems((previous) => [...previous, stored])
        return () => {
          registered = false
          setClientItems((previous) => previous.filter((entry) => entry !== stored))
          if (stored.kind === 'panel') {
            previousCollapsed.delete(stored.panel.id())
            lastExpandedSizes.delete(stored.panel.id())
          }
        }
      },
      { transparent: true },
    )
    return () => {
      disposed = true
      if (registered) {
        registered = false
        setClientItems((previous) => previous.filter((entry) => entry !== stored))
        if (stored.kind === 'panel') {
          previousCollapsed.delete(stored.panel.id())
          lastExpandedSizes.delete(stored.panel.id())
        }
      }
    }
  }

  function panelSize(panel: ResizablePanelRegistration): number | undefined {
    // Before settle the registration set is partial; derive from the layout
    // record directly so server markup and first client render agree.
    if (!settled()) {
      return panelPreSettleBasis(panel)
    }
    const index = panelIndexOf(panel)
    if (index < 0) {
      return undefined
    }
    return fixToPrecision((resolved()[index] ?? 0) * 100)
  }

  function panelPreSettleBasis(panel: ResizablePanelRegistration): number | undefined {
    const entry = sourceLayout()?.[panel.id()]
    if (entry === undefined) {
      return undefined
    }
    // A collapsed entry must not be clamped up to `min`.
    if (panel.collapsible() && entry <= panel.collapsedSize() + EPSILON) {
      return panel.collapsedSize()
    }
    return fixToPrecision(clamp(entry, panel.min(), panel.max()))
  }

  function panelCollapsed(panel: ResizablePanelRegistration): boolean {
    if (!settled()) {
      const basis = panelPreSettleBasis(panel)
      return (
        basis !== undefined &&
        isPanelCollapsed(basis / 100, {
          collapsible: panel.collapsible(),
          collapsedSize: collapsedSizeFraction(panel),
        })
      )
    }
    const index = panelIndexOf(panel)
    if (index < 0) {
      return false
    }
    return isPanelCollapsed(resolved()[index] ?? 0, {
      collapsible: panel.collapsible(),
      collapsedSize: collapsedSizeFraction(panel),
    })
  }

  const context: ResizableContext = {
    orientation,
    disabled,
    settled,
    resizing,
    slotOverrides: pickSlotOverrides(props),
    registerItem,
    orderedItems,
    orderedPanels,
    panelIndex: panelIndexOf,
    panelSize,
    panelPreSettleBasis,
    panelCollapsed,
    panelTransitioning: (panel) => transitioningIds().includes(panel.id()),
    clearPanelTransition: (id) =>
      setTransitioningIds((previous) => previous.filter((entry) => entry !== id)),
    dragHandle,
    endHandleDrag,
    handleKeyDown,
    collapsePanel,
    expandPanel,
    resizePanel,
  }

  return (
    <ResizableProvider value={context}>
      <div
        data-slot="resizable"
        {...rootSlot}
        {...rest}
        ref={(element) => callRef(() => props.ref, element)}
        id={props.id}
      >
        {props.children}
      </div>
    </ResizableProvider>
  )
}

Resizable.usePanel = useResizablePanel
Resizable.Panel = ResizablePanel
Resizable.Handle = ResizableHandle
