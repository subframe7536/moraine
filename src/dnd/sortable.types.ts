import type { Accessor, FlowComponent } from 'solid-js'

/** Item identifier inside one sortable. */
export type SortableId = string | number

/** Where the dragged item lands relative to the target item. */
export type SortableDropPosition = 'before' | 'after' | 'inside'

/** Drag source and the drop location under the pointer or keyboard focus. */
export interface SortableDragState {
  /** Item being dragged. */
  readonly sourceId: SortableId
  /** Index the source item registered with. */
  readonly sourceIndex: number
  /** Item the source is over; undefined while it is over no other accepted item. */
  readonly targetId?: SortableId
  /** Index the target item registered with; set together with `targetId`. */
  readonly targetIndex?: number
  /** Position relative to `targetId`; set together with it. */
  readonly position?: SortableDropPosition
}

/** Completed or candidate drop on another item. */
export interface SortableDropTarget {
  readonly sourceId: SortableId
  readonly sourceIndex: number
  readonly targetId: SortableId
  readonly targetIndex: number
  readonly position: SortableDropPosition
}

/** Item registration for `useItem`. */
export interface SortableItemInput {
  /** Unique id among the sortable's items. */
  id: () => SortableId
  /** Position in the rendered order. Keyboard dragging moves along this order. */
  index: () => number
  /** Prevents dragging and dropping this item. */
  disabled?: () => boolean
  /**
   * Positions this item accepts as a drop target.
   * @default ['before', 'after']
   */
  positions?: () => readonly SortableDropPosition[]
}

/** Drag state attributes for an item element. */
export interface SortableItemAttributes {
  /** Present while the item is the drag source. */
  readonly 'data-dragging': '' | undefined
  /** Where the dragged item would land relative to this item. */
  readonly 'data-drop-position': SortableDropPosition | undefined
}

/** One registered item. */
export interface SortableItem {
  /** Item element. It is the drop target, and the drag handle when `handleRef` is unused. */
  ref: (element: HTMLElement) => void
  /** Restricts drag activation to this element, such as a grip button. */
  handleRef: (element: HTMLElement) => void
  /**
   * Measures drop positions against this element instead of `ref`, such as the row of a tree item
   * whose element also contains its children.
   */
  targetRef: (element: HTMLElement) => void
  /** Whether this item is the drag source. */
  dragging: Accessor<boolean>
  /** Where the source would land on this item; undefined when it is not the target. */
  dropPosition: Accessor<SortableDropPosition | undefined>
  /** `data-dragging` and `data-drop-position` getters to spread onto the item element. */
  attributes: SortableItemAttributes
}

/** Range a virtualizer passes to its `rangeExtractor`. */
export interface SortableVirtualRange {
  readonly startIndex: number
  readonly endIndex: number
  readonly overscan: number
  readonly count: number
}

/** Drag and drop state shared by the items of one collection. */
export interface Sortable {
  /** Wraps the component that renders the items. Mount it once per sortable. */
  readonly Provider: FlowComponent
  /** Registers one item; call it inside the item's owner, under `Provider`. */
  useItem: (input: SortableItemInput) => SortableItem
  /**
   * Returns a ref that makes an element the drag handle of the item with `id`, for handles that
   * render outside the code that registers the item, such as a `DataTable` cell.
   */
  handleRefFor: (id: SortableId) => (element: HTMLElement) => void
  /** Current drag; undefined when no drag is active. */
  readonly state: Accessor<SortableDragState | undefined>
  /**
   * Pass to a virtualizer's `rangeExtractor` option to keep the drag source mounted while it is
   * scrolled out of view. Renders the visible range plus overscan, like the default extractor.
   */
  readonly rangeExtractor: (range: SortableVirtualRange) => number[]
}
