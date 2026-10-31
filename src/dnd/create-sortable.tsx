import { DragDropProvider } from '@dnd-kit/solid'
import type { DragDropProviderProps } from '@dnd-kit/solid'
import { isSortable, useSortable } from '@dnd-kit/solid/sortable'
import type { FlowComponent } from 'solid-js'
import { createRenderEffect, createSignal, on, onCleanup, untrack } from 'solid-js'
import { isServer } from 'solid-js/web'

import { createDataAttributes } from '../theme/style-contract'

import type {
  Sortable,
  SortableDragState,
  SortableDropPosition,
  SortableDropTarget,
  SortableId,
  SortableItem,
  SortableItemAttributes,
  SortableItemInput,
  SortableVirtualRange,
} from './sortable.types'

export interface SortableOptions {
  /**
   * Input sensors. Pass an array to replace the defaults (pointer and keyboard) or a function
   * to extend them.
   */
  sensors?: DragDropProviderProps['sensors']
  /**
   * Drag and drop plugins. Pass an array to replace the defaults (accessibility announcements,
   * auto-scroll, cursor, drag feedback, and text selection prevention) or a function to extend them.
   */
  plugins?: DragDropProviderProps['plugins']
  /** Modifiers applied to every drag, such as axis or container restrictions. */
  modifiers?: DragDropProviderProps['modifiers']
  /** Rejects a drop location; rejected targets show no indicator and do not drop. */
  canDrop?: (target: SortableDropTarget) => boolean
  /** Called once when a drag ends on an accepted target. Not called for canceled drags. */
  onDrop?: (target: SortableDropTarget) => void
}

type DragDropManager = Parameters<NonNullable<DragDropProviderProps['onDragMove']>>[1]
type DragOperation = Parameters<NonNullable<DragDropProviderProps['onDragEnd']>>[0]['operation']
type Point = { x: number; y: number }

interface ItemData extends Record<string, unknown> {
  positions: readonly SortableDropPosition[]
}

const DEFAULT_POSITIONS: readonly SortableDropPosition[] = ['before', 'after']

const itemDataAttributes = /* @__PURE__ */ createDataAttributes('dragging', 'drop-position')

/** Picks a drop position from where the source sits along the target, from 0 (start) to 1 (end). */
function pickPosition(
  ratio: number,
  positions: readonly SortableDropPosition[],
): SortableDropPosition | undefined {
  const before = positions.includes('before')
  const after = positions.includes('after')
  if (positions.includes('inside')) {
    if (before && ratio < 0.25) {
      return 'before'
    }
    if (after && ratio > 0.75) {
      return 'after'
    }
    return 'inside'
  }
  if (before && (ratio < 0.5 || !after)) {
    return 'before'
  }
  return after ? 'after' : undefined
}

function isKeyboardDrag(event: Event | null): boolean {
  return typeof KeyboardEvent !== 'undefined' && event instanceof KeyboardEvent
}

/** Reads the drop location from a drag operation, optionally at a pointer position it has not applied yet. */
function readDragState(
  operation: DragOperation,
  point: Point = operation.position.current,
): SortableDragState | undefined {
  const { activatorEvent, source, target } = operation
  if (!source) {
    return undefined
  }
  const sourceId = source.id
  const sourceIndex = isSortable(source) ? source.index : -1
  if (!target || target.id === source.id || target.disabled) {
    return { sourceId, sourceIndex }
  }
  const targetIndex = isSortable(target) ? target.index : -1

  const positions = (target.data as ItemData | undefined)?.positions ?? DEFAULT_POSITIONS
  const rect = target.shape?.boundingRectangle
  let ratio: number
  if (isKeyboardDrag(activatorEvent) || !rect || rect.height <= 0) {
    // Keyboard moves step from item to item, so the direction of travel picks the side.
    ratio = targetIndex > sourceIndex ? 1 : 0
  } else {
    ratio = (point.y - rect.top) / rect.height
  }

  const position = pickPosition(ratio, positions)
  return position
    ? { sourceId, sourceIndex, targetId: target.id, targetIndex, position }
    : { sourceId, sourceIndex }
}

function sameState(prev: SortableDragState | undefined, next: SortableDragState | undefined) {
  return (
    prev?.sourceId === next?.sourceId &&
    prev?.sourceIndex === next?.sourceIndex &&
    prev?.targetId === next?.targetId &&
    prev?.targetIndex === next?.targetIndex &&
    prev?.position === next?.position
  )
}

/**
 * Creates drag and drop state for one collection over `@dnd-kit/solid`. Wrap the component that
 * renders the items in `Provider` and register each item element with `useItem`.
 *
 * Items keep their place while dragging: the target item gets `data-drop-position`, and `onDrop`
 * reports the location when the drag ends. Elements owned by Solid or a virtualizer are never
 * moved by dnd kit. Use `createListSortable` for flat lists.
 */
export function createSortable(options: SortableOptions = {}): Sortable {
  // Pointer moves report the same location many times; only changes notify items.
  const [state, setState] = createSignal<SortableDragState | undefined>(undefined, {
    equals: sameState,
  })

  const allowed = (next: SortableDragState | undefined): next is SortableDropTarget =>
    next?.targetId !== undefined &&
    next.position !== undefined &&
    (options.canDrop?.(next as SortableDropTarget) ?? true)

  const report = (next: SortableDragState | undefined): void => {
    setState(
      next && !allowed(next) ? { sourceId: next.sourceId, sourceIndex: next.sourceIndex } : next,
    )
  }

  const ClientProvider: FlowComponent = (props) => {
    let active = false
    const update = (manager: DragDropManager, point?: Point): void => {
      if (active) {
        report(readDragState(manager.dragOperation, point))
      }
    }

    return (
      <DragDropProvider
        sensors={options.sensors}
        plugins={options.plugins}
        modifiers={options.modifiers}
        onDragStart={(_event, manager) => {
          active = true
          update(manager)
        }}
        onDragMove={(event, manager) => {
          // `dragmove` is dispatched before the operation applies the new position.
          const { x, y } = manager.dragOperation.position.current
          update(manager, event.to ?? { x: x + (event.by?.x ?? 0), y: y + (event.by?.y ?? 0) })
        }}
        onDragOver={(event, manager) => {
          // Stops the optimistic sorting plugin from moving item elements.
          event.preventDefault()
          update(manager)
        }}
        onDragEnd={(event) => {
          active = false
          setState(undefined)
          const final = event.canceled ? undefined : readDragState(event.operation)
          if (allowed(final)) {
            options.onDrop?.(final)
          }
        }}
      >
        {props.children}
      </DragDropProvider>
    )
  }

  // Handles rendered apart from their item attach by id, in either mount order.
  const handleSetters = new Map<SortableId, (element: HTMLElement) => void>()
  const pendingHandles = new Map<SortableId, HTMLElement>()
  const handleRefFor =
    (id: SortableId) =>
    (element: HTMLElement): void => {
      const setHandle = handleSetters.get(id)
      if (setHandle) {
        setHandle(element)
      } else {
        pendingHandles.set(id, element)
      }
    }

  // The server renders items without a drag manager; they become sortable after hydration.
  const Provider: FlowComponent = isServer ? (props) => <>{props.children}</> : ClientProvider

  const useItem = (input: SortableItemInput): SortableItem => {
    const dragging = (): boolean => state()?.sourceId === input.id()
    const dropPosition = (): SortableDropPosition | undefined => {
      const current = state()
      return current?.targetId === input.id() ? current.position : undefined
    }
    const attributes = itemDataAttributes({ dragging, dropPosition }) as SortableItemAttributes
    if (isServer) {
      return { ref: () => {}, handleRef: () => {}, dragging, dropPosition, attributes }
    }

    const data: ItemData = {
      get positions() {
        return input.positions?.() ?? DEFAULT_POSITIONS
      },
    }
    const sortable = useSortable<ItemData>({
      get id() {
        return input.id()
      },
      get index() {
        return input.index()
      },
      get disabled() {
        return input.disabled?.() ?? false
      },
      data,
    })
    const handleRef = (element: HTMLElement): void => {
      sortable.handleRef(element)
    }
    createRenderEffect(
      on(input.id, (id) => {
        handleSetters.set(id, handleRef)
        const pending = pendingHandles.get(id)
        if (pending) {
          pendingHandles.delete(id)
          handleRef(pending)
        }
        onCleanup(() => {
          if (handleSetters.get(id) === handleRef) {
            handleSetters.delete(id)
          }
        })
      }),
    )
    return {
      ref: (element) => sortable.ref(element),
      handleRef,
      dragging,
      dropPosition,
      attributes,
    }
  }

  const rangeExtractor = (range: SortableVirtualRange): number[] => {
    const start = Math.max(range.startIndex - range.overscan, 0)
    const end = Math.min(range.endIndex + range.overscan, range.count - 1)
    const indexes: number[] = []
    for (let index = start; index <= end; index++) {
      indexes.push(index)
    }
    // Read untracked: virtualizers call this outside Solid, on every range change.
    const source = untrack(state)?.sourceIndex
    if (source === undefined || source < 0 || source >= range.count) {
      return indexes
    }
    if (source < start) {
      indexes.unshift(source)
    } else if (source > end) {
      indexes.push(source)
    }
    return indexes
  }

  return { Provider, useItem, handleRefFor, state, rangeExtractor }
}
