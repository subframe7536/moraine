import { DragDropProvider } from '@dnd-kit/solid'
import type { DragDropProviderProps } from '@dnd-kit/solid'
import { isSortable, useSortable } from '@dnd-kit/solid/sortable'
import type { Component } from 'solid-js'
import { isServer } from 'solid-js/web'

import type {
  Sortable,
  SortableDragState,
  SortableDropPosition,
  SortableDropTarget,
  SortableItemInput,
  SortableItemRefs,
  SortableProviderProps,
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
}

type DragDropManager = Parameters<NonNullable<DragDropProviderProps['onDragMove']>>[1]
type DragOperation = Parameters<NonNullable<DragDropProviderProps['onDragEnd']>>[0]['operation']

interface ItemData extends Record<string, unknown> {
  positions: readonly SortableDropPosition[]
}

const DEFAULT_POSITIONS: readonly SortableDropPosition[] = ['before', 'after']

const NOOP_REFS: SortableItemRefs = {
  ref: () => {},
  handleRef: () => {},
}

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
  point: { x: number; y: number } = operation.position.current,
): SortableDragState | undefined {
  const { activatorEvent, source, target } = operation
  if (!source) {
    return undefined
  }
  const sourceId = source.id
  if (!target || target.id === source.id || target.disabled) {
    return { sourceId }
  }

  const positions = (target.data as ItemData | undefined)?.positions ?? DEFAULT_POSITIONS
  const rect = target.shape?.boundingRectangle
  let ratio: number
  if (isKeyboardDrag(activatorEvent) || !rect || rect.height <= 0) {
    // Keyboard moves step from item to item, so the direction of travel picks the side.
    const sourceIndex = isSortable(source) ? source.index : 0
    const targetIndex = isSortable(target) ? target.index : 0
    ratio = targetIndex > sourceIndex ? 1 : 0
  } else {
    ratio = (point.y - rect.top) / rect.height
  }

  const dropPosition = pickPosition(ratio, positions)
  return dropPosition ? { sourceId, targetId: target.id, position: dropPosition } : { sourceId }
}

/**
 * Creates a sortable for `List`, `Tree`, and `DataTable` over `@dnd-kit/solid`. Pass the result to
 * the component's `sortable` prop.
 *
 * Items keep their place while dragging: the host marks the drop location on the target item
 * (`data-drop-position`) and reports the move when the drag ends, so rows that the host does not
 * own, such as virtual rows, stay in place.
 */
export function createSortable(options: SortableOptions = {}): Sortable {
  const ClientProvider: Component<SortableProviderProps> = (props) => {
    let active = false
    const report = (manager: DragDropManager, point?: { x: number; y: number }): void => {
      if (active) {
        props.onChange(readDragState(manager.dragOperation, point))
      }
    }

    return (
      <DragDropProvider
        sensors={options.sensors}
        plugins={options.plugins}
        modifiers={options.modifiers}
        onDragStart={(_event, manager) => {
          active = true
          report(manager)
        }}
        onDragMove={(event, manager) => {
          // `dragmove` is dispatched before the operation applies the new position.
          const { x, y } = manager.dragOperation.position.current
          report(manager, event.to ?? { x: x + (event.by?.x ?? 0), y: y + (event.by?.y ?? 0) })
        }}
        onDragOver={(event, manager) => {
          // Stops the optimistic sorting plugin from moving item elements: the host owns them.
          event.preventDefault()
          report(manager)
        }}
        onDragEnd={(event) => {
          active = false
          props.onChange(undefined)
          const final = event.canceled ? undefined : readDragState(event.operation)
          if (final?.targetId !== undefined && final.position !== undefined) {
            props.onDrop(final as SortableDropTarget)
          }
        }}
      >
        {props.children}
      </DragDropProvider>
    )
  }
  // The server renders items without a drag manager; they become sortable after hydration.
  const Provider: Component<SortableProviderProps> = isServer
    ? (props) => <>{props.children}</>
    : ClientProvider

  const useItem = (input: SortableItemInput): SortableItemRefs => {
    if (isServer) {
      return NOOP_REFS
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
    return {
      ref: (element) => sortable.ref(element),
      handleRef: (element) => sortable.handleRef(element),
    }
  }

  return { Provider, useItem }
}
