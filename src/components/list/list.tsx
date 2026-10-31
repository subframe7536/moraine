import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, mergeProps, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { SortableRoot, useSortableItem } from '../../dnd/sortable-content'
import type { SortableItemBinding } from '../../dnd/sortable-content'
import type { SortableDropTarget } from '../../dnd/sortable.types'
import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'
import { VirtualContent } from '../../virtualizer/virtual-content'
import type { VirtualRowProps } from '../../virtualizer/virtualizer.types'

import { listRecipe } from './list.recipe'
import type { ListProps, ListT } from './list.types'

/** Index the source ends up at, or undefined when the drop leaves it in place. */
function resolveReorderIndex(target: SortableDropTarget): { from: number; to: number } | undefined {
  const from = Number(target.sourceId)
  const targetIndex = Number(target.targetId)
  let to = target.position === 'after' ? targetIndex + 1 : targetIndex
  if (from < to) {
    to -= 1
  }
  return from === to ? undefined : { from, to }
}

/** Adds the drag ref and drag state attributes to a row's virtual props. */
function withSortable(
  rowProps: VirtualRowProps | undefined,
  sortable: SortableItemBinding,
): ListT.RowProps {
  const merged = mergeProps(
    rowProps ?? {},
    {
      ref: (element: HTMLElement) => {
        callRef(rowProps?.ref, element)
        sortable.ref(element)
      },
    },
    sortable.attributes,
  )
  return merged
}

/**
 * One List row. Sortable ids are item indexes: rows keep their place while dragging, so indexes
 * stay stable until `onReorder` updates `items`.
 */
function ListRow<TItem>(props: {
  item: TItem
  index: number
  rowProps?: VirtualRowProps
  itemRender: ListT.Base<TItem>['itemRender']
}): JSX.Element {
  const sortable = useSortableItem({ id: () => props.index, index: () => props.index })
  // Virtual rows keep their row props for their lifetime.
  const rowProps = untrack(() => props.rowProps)
  const sortableRowProps = sortable ? withSortable(rowProps, sortable) : undefined

  return (
    <Dynamic
      component={props.itemRender}
      item={props.item}
      index={props.index}
      props={sortableRowProps ?? rowProps}
      handleRef={sortable?.handleRef}
    />
  )
}

/** Headless polymorphic list with optional virtualization and drag reordering. */
export function List<TItem, T extends ValidComponent = 'ul'>(
  props: ListProps<TItem, T>,
): JSX.Element {
  const [local, rest] = splitProps(props as ListProps<TItem, T> & { ref?: unknown }, [
    'as',
    'items',
    'itemRender',
    'virtualizer',
    'sortable',
    'onReorder',
    'fallback',
    'ref',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const {
    slots: { root: rootSlot },
  } = useRecipe(listRecipe, local)
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  const handleDrop = (target: SortableDropTarget): void => {
    const move = resolveReorderIndex(target)
    const items: readonly TItem[] = local.items ?? []
    if (!move || move.from >= items.length) {
      return
    }
    const next = items.slice()
    const [item] = next.splice(move.from, 1)
    next.splice(move.to, 0, item!)
    local.onReorder?.({ item: item!, from: move.from, to: move.to, items: next })
  }

  return (
    <Dynamic
      component={local.as ?? 'ul'}
      role="list"
      data-slot="list"
      {...rootSlot}
      {...rest}
      ref={(element: HTMLElement) => {
        setScrollElement(() => element)
        callRef(local.ref, element)
      }}
    >
      <Show
        when={'fallback' in props && !local.items?.length}
        fallback={
          <SortableRoot
            sortable={local.sortable}
            canDrop={(target) => resolveReorderIndex(target) !== undefined}
            onDrop={handleDrop}
          >
            {(dragState) => {
              const pinnedIndexes = createMemo(() => {
                const sourceId = dragState()?.sourceId
                return sourceId === undefined ? undefined : [Number(sourceId)]
              })
              return (
                <VirtualContent<TItem>
                  virtualizer={local.virtualizer}
                  entries={local.items ?? []}
                  scrollElement={scrollElement()}
                  pinnedIndexes={pinnedIndexes()}
                  render={(item, index, rowProps) => (
                    <ListRow
                      item={item}
                      index={index}
                      rowProps={rowProps}
                      itemRender={local.itemRender}
                    />
                  )}
                  fallback={
                    <For each={local.items}>
                      {(item, index) => (
                        <ListRow item={item} index={index()} itemRender={local.itemRender} />
                      )}
                    </For>
                  }
                />
              )
            }}
          </SortableRoot>
        }
      >
        {(_empty) => local.fallback}
      </Show>
    </Dynamic>
  )
}
