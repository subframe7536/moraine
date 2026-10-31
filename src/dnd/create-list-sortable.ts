import { mergeProps } from 'solid-js'

import { createSortable } from './create-sortable'
import type { SortableOptions } from './create-sortable'
import type {
  Sortable,
  SortableDropPosition,
  SortableDropTarget,
  SortableId,
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
  /** Item the source was dropped on. */
  readonly target: TItem
  /** Side of `target` the source was dropped on. */
  readonly position: Exclude<SortableDropPosition, 'inside'>
}

export interface ListSortableOptions<TItem> extends Omit<SortableOptions, 'canDrop' | 'onDrop'> {
  /** Items in rendered order, such as the `items` passed to `List`. */
  items: () => readonly TItem[]
  /** Called when a drag moves an item to a new index. Update the items from it. */
  onReorder: (event: ListReorderEvent<TItem>) => void
  /**
   * Stable item id. Pass it to look up rows by id, such as with `handleRefFor`.
   * @default the item index
   */
  getId?: (item: TItem, index: number) => SortableId
  /** Prevents dragging and dropping an item. Return true for every item to pause dragging. */
  isDisabled?: (item: TItem, index: number) => boolean
  /**
   * Rejects a drop location, such as a row under another parent. Rejected targets show no
   * indicator and do not drop.
   */
  canDrop?: (
    source: TItem,
    target: TItem,
    position: Exclude<SortableDropPosition, 'inside'>,
  ) => boolean
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

/** Returns a copy of `items` with the item at `from` moved to `to`. */
export function moveItem<TItem>(items: readonly TItem[], from: number, to: number): TItem[] {
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

/** Index the source ends up at, or undefined when the drop leaves it in place. */
function resolveMove(target: SortableDropTarget): { from: number; to: number } | undefined {
  const from = target.sourceIndex
  let to = target.targetIndex + (target.position === 'after' ? 1 : 0)
  if (from < to) {
    to -= 1
  }
  return from < 0 || target.targetIndex < 0 || from === to ? undefined : { from, to }
}

/**
 * Creates a sortable for a flat list, such as `List` or the rows of a `DataTable`. Wrap the list in
 * `Provider`, call `useRow` for each row, and update the items from `onReorder`.
 *
 * Rows keep their place while dragging, so indexes stay valid until `onReorder` updates the items.
 */
export function createListSortable<TItem>(
  options: ListSortableOptions<TItem>,
): ListSortable<TItem> {
  const sortable = createSortable({
    sensors: options.sensors,
    plugins: options.plugins,
    modifiers: options.modifiers,
    canDrop: (target) => {
      if (!resolveMove(target) || target.position === 'inside') {
        return false
      }
      const items = options.items()
      const source = items[target.sourceIndex]
      const over = items[target.targetIndex]
      return (
        source === undefined ||
        over === undefined ||
        (options.canDrop?.(source, over, target.position) ?? true)
      )
    },
    dropAnimation: options.dropAnimation,
    onDrop: (target) => {
      const move = resolveMove(target)
      const items = options.items()
      if (!move || target.position === 'inside' || move.from >= items.length) {
        return
      }
      const next = moveItem(items, move.from, move.to)
      options.onReorder({
        item: items[move.from]!,
        from: move.from,
        to: move.to,
        items: next,
        target: items[target.targetIndex]!,
        position: target.position,
      })
      // Index ids follow the item to its new index.
      return options.getId ? undefined : move.to
    },
  })

  const idAt = (index: number): SortableId => {
    const item = options.items()[index]
    return item === undefined ? index : (options.getId?.(item, index) ?? index)
  }

  const useRow = <TRowProps extends object = {}>(
    context: ListSortableRowContext<TRowProps>,
  ): ListSortableRow<TRowProps> => {
    const item = sortable.useItem({
      id: () => idAt(context.index),
      index: () => context.index,
      disabled: () => {
        const current = options.items()[context.index]
        return current !== undefined && (options.isDisabled?.(current, context.index) ?? false)
      },
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
