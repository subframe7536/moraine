import { KeyboardSensor, PointerSensor } from '@dnd-kit/solid'
import { createEffect, createMemo, mergeProps, on, onCleanup } from 'solid-js'

import type { TreeT } from '../components/tree/tree.types'

import { createSortable } from './create-sortable'
import type { SortableOptions } from './create-sortable'
import type {
  Sortable,
  SortableDropPosition,
  SortableDropTarget,
  SortableItem,
  SortableItemAttributes,
} from './sortable.types'

/** Move reported when a drag drops an item at a new place in the tree. */
export interface TreeMoveEvent<T> {
  /** Moved item. */
  readonly item: TreeT.ItemInstance<T>
  /** Key of the moved item. */
  readonly key: string
  /** Parent key before the move; undefined for a root item. */
  readonly fromParentKey: string | undefined
  /** Index among its siblings before the move. */
  readonly fromIndex: number
  /** New parent key; undefined for the root level. */
  readonly parentKey: string | undefined
  /** Index among the new siblings after the move, with the item already removed from its old place. */
  readonly index: number
  /** Item the source was dropped on. */
  readonly target: TreeT.ItemInstance<T>
  /** Where the source was dropped relative to `target`. */
  readonly position: SortableDropPosition
}

export interface TreeSortableOptions<T> extends Omit<SortableOptions, 'canDrop' | 'onDrop'> {
  /** Called when a drag moves an item. Update the tree items from it. */
  onMove: (event: TreeMoveEvent<T>) => void
  /**
   * Whether an item accepts children, so dropping on the middle of its row moves the source
   * inside it.
   * @default () => true
   */
  canNest?: (item: TreeT.ItemInstance<T>) => boolean
  /**
   * Rejects a move, such as one into a read-only folder. Moves into the source itself or its
   * descendants are always rejected.
   */
  canDrop?: (move: Omit<TreeMoveEvent<T>, 'fromIndex' | 'fromParentKey'>) => boolean
  /** Prevents dragging and dropping an item. */
  isDisabled?: (item: TreeT.ItemInstance<T>) => boolean
  /**
   * Milliseconds the source hovers inside a collapsed item before it expands, loading lazy
   * children. Pass `false` to disable.
   * @default 600
   */
  expandDelay?: number | false
}

/** One registered tree item. */
export interface TreeSortableNode extends Omit<SortableItem, 'ref' | 'targetRef'> {
  /** Attributes to spread onto `tree.Item`: the drag ref, `data-dragging`, and `data-drop-position`. */
  readonly props: SortableItemAttributes & { ref: (element: HTMLElement) => void }
}

export interface TreeSortable<T> extends Sortable {
  /** Registers an item; call it in `itemRender` and spread `props` onto `tree.Item`. */
  useNode: (item: TreeT.ItemInstance<T>) => TreeSortableNode
}

const ROW_SELECTOR = ':scope > [data-slot="tree-row"]'

/** Index among the item's siblings. */
function siblingIndex(item: TreeT.ItemInstance<unknown>): number {
  return item.posInSet - 1
}

/**
 * Creates a sortable for a `createTree` instance. Wrap `tree.Tree` in `Provider`, call `useNode` in
 * `itemRender`, spread its `props` onto `tree.Item`, and update the items from `onMove`.
 *
 * Dropping on the top or bottom quarter of a row moves the source before or after it, and on the
 * middle moves it inside, as the last child. Dropping after an expanded item with children moves
 * the source to its first child, where the drop indicator sits. Keyboard dragging starts only from
 * a handle (`handleRef`), so Space and Enter on the item keep their tree behavior.
 */
export function createTreeSortable<T>(
  tree: TreeT.Instance<T>,
  options: TreeSortableOptions<T>,
): TreeSortable<T> {
  const indexes = createMemo(
    () => new Map(tree.flattenedItems.map((item, index) => [item.key, index])),
  )

  const isWithin = (key: string | undefined, ancestorKey: string): boolean => {
    for (let current = key; current !== undefined; current = tree.getItem(current)?.parentKey) {
      if (current === ancestorKey) {
        return true
      }
    }
    return false
  }

  const resolveMove = (drop: SortableDropTarget): TreeMoveEvent<T> | undefined => {
    const item = tree.getItem(String(drop.sourceId))
    const target = tree.getItem(String(drop.targetId))
    if (!item || !target || isWithin(target.key, item.key)) {
      return undefined
    }
    let parentKey: string | undefined
    let index: number
    if (drop.position === 'inside') {
      parentKey = target.key
      index = target.children.length
    } else if (drop.position === 'after' && target.isExpanded && target.children.length > 0) {
      parentKey = target.key
      index = 0
    } else {
      parentKey = target.parentKey
      index = siblingIndex(target) + (drop.position === 'after' ? 1 : 0)
    }
    const fromIndex = siblingIndex(item)
    if (item.parentKey === parentKey && fromIndex < index) {
      index -= 1
    }
    if (item.parentKey === parentKey && fromIndex === index) {
      return undefined
    }
    return {
      item,
      key: item.key,
      fromParentKey: item.parentKey,
      fromIndex,
      parentKey,
      index,
      target,
      position: drop.position,
    }
  }

  const sortable = createSortable({
    // Keyboard drags start only from a handle: the item element keeps Space and Enter.
    sensors: options.sensors ?? [
      PointerSensor,
      KeyboardSensor.configure({
        preventActivation: (event, source) =>
          !source.handle ||
          !(event.target instanceof Node) ||
          !source.handle.contains(event.target),
      }),
    ],
    plugins: options.plugins,
    modifiers: options.modifiers,
    canDrop: (drop) => {
      const move = resolveMove(drop)
      return move !== undefined && (options.canDrop?.(move) ?? true)
    },
    onDrop: (drop) => {
      const move = resolveMove(drop)
      if (move) {
        options.onMove(move)
      }
    },
  })

  // Hovering inside a collapsed item expands it, which also loads lazy children.
  const expandDelay = options.expandDelay ?? 600
  if (expandDelay !== false) {
    createEffect(
      on(
        () => {
          const state = sortable.state()
          return state?.position === 'inside' ? String(state.targetId) : undefined
        },
        (key) => {
          const item = key === undefined ? undefined : tree.getItem(key)
          if (!item || item.isExpanded || !item.hasChildren) {
            return
          }
          const timer = setTimeout(() => tree.expand(item.key), expandDelay)
          onCleanup(() => clearTimeout(timer))
        },
      ),
    )
  }

  const useNode = (item: TreeT.ItemInstance<T>): TreeSortableNode => {
    const node = sortable.useItem({
      id: () => item.key,
      index: () => indexes().get(item.key) ?? -1,
      disabled: () => item.isDisabled || (options.isDisabled?.(item) ?? false),
      positions: () =>
        (options.canNest?.(item) ?? true) ? ['before', 'inside', 'after'] : ['before', 'after'],
    })
    const props = mergeProps(
      {
        ref: (element: HTMLElement) => {
          node.ref(element)
          // The item element also holds its child group, so drops measure against the row.
          const attachRow = (): boolean => {
            const row = element.querySelector<HTMLElement>(ROW_SELECTOR)
            if (row) {
              node.targetRef(row)
            }
            return row !== null
          }
          if (!attachRow()) {
            queueMicrotask(attachRow)
          }
        },
      },
      node.attributes,
    ) as TreeSortableNode['props']
    const { ref: _ref, targetRef: _targetRef, ...rest } = node
    return { ...rest, props }
  }

  return { ...sortable, useNode }
}

/** Accessors `moveTreeNode` uses to read and rebuild items. */
export interface MoveTreeNodeAccess<T> {
  getKey: (item: T) => string
  getChildren: (item: T) => readonly T[] | undefined
  /** Returns a copy of `item` with `children`. */
  withChildren: (item: T, children: T[]) => T
}

/**
 * Returns a copy of `items` with the node `move.key` moved under `move.parentKey` at `move.index`,
 * as reported by `TreeMoveEvent`. Unchanged branches keep their identity.
 */
export function moveTreeNode<T>(
  items: readonly T[],
  move: Pick<TreeMoveEvent<unknown>, 'key' | 'parentKey' | 'index'>,
  access: MoveTreeNodeAccess<T>,
): T[] {
  let moved: T | undefined
  const remove = (list: readonly T[]): T[] => {
    let changed = false
    const next: T[] = []
    for (const item of list) {
      if (access.getKey(item) === move.key) {
        moved = item
        changed = true
        continue
      }
      const children = access.getChildren(item)
      const nextChildren = children ? remove(children) : undefined
      if (children && nextChildren !== children) {
        changed = true
        next.push(access.withChildren(item, nextChildren!))
      } else {
        next.push(item)
      }
    }
    return changed ? next : (list as T[])
  }
  const insert = (list: readonly T[], parentKey: string | undefined): T[] => {
    if (parentKey === move.parentKey) {
      const next = list.slice()
      next.splice(Math.min(move.index, next.length), 0, moved!)
      return next
    }
    let changed = false
    const next = list.map((item) => {
      const children = access.getChildren(item)
      if (access.getKey(item) === move.parentKey) {
        changed = true
        return access.withChildren(item, insert(children ?? [], access.getKey(item)))
      }
      if (children) {
        const nextChildren = insert(children, access.getKey(item))
        if (nextChildren !== children) {
          changed = true
          return access.withChildren(item, nextChildren)
        }
      }
      return item
    })
    return changed ? next : (list as T[])
  }

  const removed = remove(items)
  if (moved === undefined) {
    return items.slice()
  }
  return insert(removed, undefined)
}
