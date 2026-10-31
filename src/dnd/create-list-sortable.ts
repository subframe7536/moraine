import { mergeProps } from 'solid-js'

import { createSortable } from './create-sortable'
import type { SortableOptions } from './create-sortable'
import type {
  Sortable,
  SortableDropTarget,
  SortableItem,
  SortableItemAttributes,
} from './sortable.types'

/** Reorder reported when a drag moves an item to a new index. */
export interface ListReorderEvent<TItem> {
  /** Moved item. */
  readonly item: TItem
  /** Index of the item before the move. */
  readonly from: number
  /** Index of the item after the move. */
  readonly to: number
  /** Copy of the items with the move applied. */
  readonly items: TItem[]
}

export interface ListSortableOptions<TItem> extends Omit<SortableOptions, 'canDrop' | 'onDrop'> {
  /** Items in rendered order, such as the `items` passed to `List`. */
  items: () => readonly TItem[]
  /** Called when a drag moves an item to a new index. Update the items from it. */
  onReorder: (event: ListReorderEvent<TItem>) => void
  /** Prevents dragging and dropping an item. */
  isDisabled?: (item: TItem, index: number) => boolean
}

/** Row context accepted by `useRow`, such as the props `List` passes to `itemRender`. */
export interface ListSortableRowContext<TRowProps extends object> {
  /** Current index in the items. */
  readonly index: number
  /** Attributes the host already provides for the row element, such as virtual row props. */
  readonly props?: TRowProps
}

/** One registered list row. */
export interface ListSortableRow<TRowProps extends object> extends Omit<SortableItem, 'ref'> {
  /**
   * Attributes to spread onto the row element: the context `props` with the drag ref composed
   * into their `ref`, plus `data-dragging` and `data-drop-position`.
   */
  readonly props: Omit<TRowProps, 'ref'> &
    SortableItemAttributes & { ref: (element: HTMLElement) => void }
}

export interface ListSortable<TItem> extends Sortable {
  /** Registers a row; call it in the row component, such as a `List` `itemRender`. */
  useRow: <TRowProps extends object = {}>(
    context: ListSortableRowContext<TRowProps>,
  ) => ListSortableRow<TRowProps>
  /** Items the sortable reorders. */
  readonly items: () => readonly TItem[]
}

/** Index the source ends up at, or undefined when the drop leaves it in place. */
function resolveMove(target: SortableDropTarget): { from: number; to: number } | undefined {
  const from = Number(target.sourceId)
  let to = Number(target.targetId) + (target.position === 'after' ? 1 : 0)
  if (from < to) {
    to -= 1
  }
  return from === to ? undefined : { from, to }
}

/**
 * Creates a sortable for a flat list, such as `List` or the rows of a `DataTable`. Wrap the list in
 * `Provider`, call `useRow` for each row, and update the items from `onReorder`.
 *
 * Row ids are item indexes. Rows keep their place while dragging, so indexes stay valid until
 * `onReorder` updates the items.
 */
export function createListSortable<TItem>(
  options: ListSortableOptions<TItem>,
): ListSortable<TItem> {
  const sortable = createSortable({
    sensors: options.sensors,
    plugins: options.plugins,
    modifiers: options.modifiers,
    canDrop: (target) => resolveMove(target) !== undefined,
    onDrop: (target) => {
      const move = resolveMove(target)
      const items = options.items()
      if (!move || move.from >= items.length) {
        return
      }
      const next = items.slice()
      const [item] = next.splice(move.from, 1)
      next.splice(move.to, 0, item!)
      options.onReorder({ item: item!, from: move.from, to: move.to, items: next })
    },
  })

  const useRow = <TRowProps extends object = {}>(
    context: ListSortableRowContext<TRowProps>,
  ): ListSortableRow<TRowProps> => {
    const item = sortable.useItem({
      id: () => context.index,
      index: () => context.index,
      disabled: options.isDisabled
        ? () => options.isDisabled!(options.items()[context.index]!, context.index)
        : undefined,
    })
    const hostRef = (): ((element: HTMLElement) => void) | undefined =>
      (context.props as { ref?: (element: HTMLElement) => void } | undefined)?.ref
    const props = mergeProps(
      () => context.props ?? {},
      {
        ref: (element: HTMLElement) => {
          hostRef()?.(element)
          item.ref(element)
        },
      },
      item.attributes,
    ) as ListSortableRow<TRowProps>['props']
    const { ref: _ref, ...rest } = item
    return { ...rest, props }
  }

  return { ...sortable, useRow, items: options.items }
}
