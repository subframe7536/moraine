import type { JSX } from 'solid-js'
import { createEffect, createSignal, on, onMount, splitProps } from 'solid-js'

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

const DEFAULT_KEYBOARD_DELTA = 10

interface DragState {
  panelIndex: number
  altKey: boolean
  /** True once the session produced a layout change; survives re-basing. */
  started: boolean
  /** Layout before the session's first change; survives re-basing. */
  commitBaseline: number[]
  deltaPx: number
  panelSpacePx: number
  initialSizes: number[]
  lastSizes: number[]
}

function hasSizeChange(previous: number[], next: number[]): boolean {
  if (previous.length !== next.length) {
    return true
  }

  return next.some((size, index) => Math.abs(size - (previous[index] ?? 0)) > EPSILON)
}

function collapsedSizeFraction(panel: ResizablePanelRegistration): number {
  return panel.collapsedSize() / 100
}

export function Resizable(props: ResizableProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'onValueCommit',
    'disabled',
    'keyboardDelta',
    'orientation',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  ])

  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(resizableRecipe, local, {
    data: { root: resizableDataAttributes.root({ splitterRoot: true }) },
  })

  const orientation = (): ResizableOrientation => variants.orientation ?? 'horizontal'
  const disabled = () => local.disabled === true
  const keyboardDelta = () => local.keyboardDelta ?? DEFAULT_KEYBOARD_DELTA

  const [settled, setSettled] = createSignal(false)
  const [resizing, setResizing] = createSignal(false)
  const [transitioningIds, setTransitioningIds] = createSignal<string[]>([])
  const [items, setItems] = createSignal<ResizableItem[]>([])
  const [uncontrolledLayout, setUncontrolledLayout] = createSignal<ResizableT.Layout | undefined>(
    local.defaultValue ? { ...local.defaultValue } : undefined,
  )

  let seq = 0
  let drag: DragState | null = null
  const lastExpandedSizes = new Map<string, number>()
  const previousCollapsed = new Map<string, boolean>()

  onMount(() => setSettled(true))

  // Accessors (not memos): the server evaluates createMemo eagerly at
  // creation — before children register — so these must read live state.
  const orderedItems = (): ResizableItem[] => {
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

  const orderedPanels = (): ResizablePanelRegistration[] =>
    orderedItems().flatMap((item) => (item.kind === 'panel' ? [item.panel] : []))

  const sourceLayout = () => local.value ?? uncontrolledLayout()

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
    panels: ResizablePanelRegistration[],
    layout: ResizableT.Layout | undefined,
  ): number[] {
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
      panelInitialSizes: controlled.map((entry) =>
        entry === undefined ? missingShare : undefined,
      ),
      panelMinSizes: panels.map((panel) => normalizedMinFraction(panel, layout)),
      panelMaxSizes: panels.map((panel) => Math.max(panel.min(), panel.max()) / 100),
      controlledSizes: controlled,
    })
  }

  /** Resolved panel sizes as fractions (0..1), aligned with `orderedPanels()`. */
  const resolved = (): number[] => resolveLayoutFractions(orderedPanels(), sourceLayout())

  /** Panel constraints for the resize algorithms; `collapsedFloor` lowers every collapsible min to collapsedSize. */
  function panelSpecs(collapsedFloor = false): ResizableResolvedPanel[] {
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

  function toLayoutRecord(fractions: number[]): ResizableT.Layout {
    const record: ResizableT.Layout = {}
    orderedPanels().forEach((panel, index) => {
      record[panel.id()] = fixToPrecision((fractions[index] ?? 0) * 100)
    })
    return record
  }

  /** Emits `onValueChange` and updates uncontrolled state when the layout changed. */
  function applyLayout(next: number[]): boolean {
    if (!hasSizeChange(resolved(), next)) {
      return false
    }

    const record = toLayoutRecord(next)
    if (local.value === undefined) {
      setUncontrolledLayout(record)
    }
    local.onValueChange?.(record)
    return true
  }

  function commitLayout(next: number[]): void {
    local.onValueCommit?.(toLayoutRecord(next))
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

  /**
   * Applies the live collapse threshold: a collapsible panel collapses to
   * `collapsedSize` once the candidate drops below `(min + collapsedSize) / 2`,
   * and a collapsed panel expands back to `min` past the same midpoint.
   */
  function resolveThresholdedSizes(
    candidate: number[],
    previousSizes: number[],
    specs: ResizableResolvedPanel[],
  ): number[] {
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
    if (toggled >= 0) {
      markTransitioning(specs[toggled]!.panelId)
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
      const delta = keyboardDelta() / 100
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
          handle: () => resize(event.shiftKey ? -1 : -delta),
        },
        [horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown']: {
          preventDefault: false,
          handle: () => resize(event.shiftKey ? 1 : delta),
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
    const next = expandPanelSizes({
      panelIndex: index,
      strategy: RESIZE_FLAG_FOLLOWING,
      initialSizes: resolved(),
      panels: specs,
      expandedSize: lastExpandedSizes.get(id) ?? specs[index]!.min,
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
    on(resolved, (sizes) => {
      orderedPanels().forEach((panel, index) => {
        const size = sizes[index] ?? 0
        const collapsedSize = collapsedSizeFraction(panel)
        const collapsed = isPanelCollapsed(size, {
          collapsible: panel.collapsible(),
          collapsedSize,
        })
        const id = panel.id()
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
    }),
  )

  // ---------------------------------------------------------------------------
  // Registration + context
  // ---------------------------------------------------------------------------

  function registerItem(item: ResizableItem): () => void {
    item.seq = seq
    seq += 1
    const stored = item
    setItems((previous) => [...previous, stored])
    return () => {
      setItems((previous) => previous.filter((entry) => entry !== stored))
      if (stored.kind === 'panel') {
        previousCollapsed.delete(stored.panel.id())
        lastExpandedSizes.delete(stored.panel.id())
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
    slotOverrides: pickSlotOverrides(local),
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
        ref={(element) => callRef(local.ref, element)}
        id={local.id}
      >
        {local.children}
      </div>
    </ResizableProvider>
  )
}

Resizable.usePanel = useResizablePanel
Resizable.Panel = ResizablePanel
Resizable.Handle = ResizableHandle
