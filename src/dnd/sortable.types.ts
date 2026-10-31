import type { Component, JSX } from 'solid-js'

// Contract between sortables from `moraine/dnd` and the components that host them.
// It must not import `@dnd-kit/solid`: the main entry and `moraine/data-table` name these types
// without depending on the optional peer.

/** Item identifier inside one sortable host. */
export type SortableId = string | number

/** Where the dragged item lands relative to the target item. */
export type SortableDropPosition = 'before' | 'after' | 'inside'

/** Drop location under the pointer or keyboard focus while dragging. */
export interface SortableDragState {
  /** Item being dragged. */
  readonly sourceId: SortableId
  /** Item the source is over; undefined while it is over no other item. */
  readonly targetId?: SortableId
  /** Position relative to `targetId`; set together with it. */
  readonly position?: SortableDropPosition
}

/** Completed drop on another item. */
export interface SortableDropTarget {
  readonly sourceId: SortableId
  readonly targetId: SortableId
  readonly position: SortableDropPosition
}

/** Props a host passes to a sortable's `Provider`. */
export interface SortableProviderProps {
  children: JSX.Element
  /** Reports the drag source and the current drop location; undefined when no drag is active. */
  onChange: (state: SortableDragState | undefined) => void
  /** Called once when a drag ends on a target. Not called for canceled drags. */
  onDrop: (target: SortableDropTarget) => void
}

/** Item registration a host passes to a sortable's `useItem`. */
export interface SortableItemInput {
  /** Unique id among the host's items. */
  id: () => SortableId
  /** Position in the host's rendered order. Keyboard dragging moves along this order. */
  index: () => number
  /** Prevents dragging and dropping this item. */
  disabled?: () => boolean
  /**
   * Positions this item accepts as a drop target.
   * @default ['before', 'after']
   */
  positions?: () => readonly SortableDropPosition[]
}

/** Element refs returned by a sortable's `useItem`. */
export interface SortableItemRefs {
  /** Item element. It is the drop target, and the drag handle when `handleRef` is unused. */
  ref: (element: HTMLElement) => void
  /** Restricts drag activation to this element, such as a grip button. */
  handleRef: (element: HTMLElement) => void
}

/**
 * What a sortable host (`List`, `Tree`, `DataTable`) needs from its `sortable` prop.
 * `createSortable()` returns one.
 */
export interface Sortable {
  /** Wraps the host's items. Hosts mount it; callers pass the whole sortable instead. */
  readonly Provider: Component<SortableProviderProps>
  /** Registers one item; call it inside the item's owner, under `Provider`. */
  useItem: (input: SortableItemInput) => SortableItemRefs
}
