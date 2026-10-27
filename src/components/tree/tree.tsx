import type { Component, JSX } from 'solid-js'
import { Show, createEffect, createSignal, on, onCleanup, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { callRef } from '../../shared/utils'
import type { IconT } from '../icon'
import type { ListT } from '../list/list.types'

import { TreeProvider, TreeRowProvider } from './tree-context'
import type { TreeContext } from './tree-context'
import { TreeDefaultItem, TreeItemList } from './tree-item'
import type { TreeNavigation } from './tree-navigation'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

export interface TreeInternals<T> {
  rootItems: () => readonly TreeT.ItemInstance<T>[]
  flattenedItems: () => readonly TreeT.ItemInstance<T>[]
  flattenedKeys: () => readonly string[]
  selectionMode: () => TreeT.SelectionMode
  checkable: () => boolean
  trigger: () => boolean
  getIcon: (item: TreeT.ItemInstance<T>) => IconT.Name | undefined
  navigation: TreeNavigation
}

/** Tree root bound to a `createTree` instance through `internals`. */
export function TreeRoot<T>(props: TreeT.Props<T> & { internals: TreeInternals<T> }): JSX.Element {
  const [local, rest] = splitProps(props, [
    'internals',
    'itemRender',
    'virtualRender',
    'scrollToItem',
    'triggerIcon',
    'loadingIcon',
    'transition',
    'unmountOnHide',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  ])
  const { slots, variants } = useRecipe(treeRecipe, local, {
    vars: () => ({
      '--mo-tree-indent': '1.25rem',
      '--mo-tree-indent-guide': 'var(--border)',
    }),
  })
  const internals = untrack(() => local.internals)
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  createEffect(
    on(
      () => local.scrollToItem,
      (scrollToItem) => {
        internals.navigation.registerScroller(
          scrollToItem
            ? (key) => {
                const index = internals.flattenedKeys().indexOf(key)
                const item = internals.flattenedItems()[index]
                if (item) {
                  scrollToItem(item, index)
                }
              }
            : undefined,
        )
      },
    ),
  )
  onCleanup(() => {
    internals.navigation.registerScroller(undefined)
    internals.navigation.registerRoot(undefined)
  })

  function RenderItem(itemProps: TreeT.ItemRenderProps<unknown>): JSX.Element {
    return (
      <Dynamic
        component={local.itemRender ?? TreeDefaultItem}
        item={itemProps.item as TreeT.ItemInstance<T>}
      />
    )
  }

  const context: TreeContext = {
    get variants() {
      return { size: variants.size, variant: variants.variant }
    },
    get slotOverrides() {
      return { classes: local.classes, styles: local.styles }
    },
    get isVirtual() {
      return Boolean(local.virtualRender)
    },
    get checkable() {
      return internals.checkable()
    },
    get trigger() {
      return internals.trigger()
    },
    get itemIcon() {
      return (item: TreeT.ItemInstance<unknown>) => internals.getIcon(item as TreeT.ItemInstance<T>)
    },
    get transition() {
      return local.transition ?? true
    },
    get unmountOnHide() {
      return local.unmountOnHide ?? true
    },
    get triggerIcon() {
      return local.triggerIcon ?? 'icon-chevron-right'
    },
    get loadingIcon() {
      return local.loadingIcon ?? 'icon-loading'
    },
    RenderItem,
  }

  return (
    <TreeProvider value={context}>
      <div
        data-slot="tree"
        role="tree"
        aria-multiselectable={internals.selectionMode() === 'multiple' ? true : undefined}
        {...rest}
        {...slots.root}
        ref={(element: HTMLElement) => {
          setScrollElement(element)
          internals.navigation.registerRoot(element)
          callRef(local.ref, element)
        }}
      >
        <Show when={local.virtualRender} fallback={<TreeItemList items={internals.rootItems()} />}>
          {(virtualRender) => (
            <Dynamic<Component<ListT.VirtualRenderProps<TreeT.ItemInstance<T>>>>
              component={virtualRender()}
              entries={internals.flattenedItems()}
              scrollElement={scrollElement()}
              render={(item, _index, rowProps) => (
                <TreeRowProvider value={rowProps ?? null}>
                  <RenderItem item={item} />
                </TreeRowProvider>
              )}
            />
          )}
        </Show>
      </div>
    </TreeProvider>
  )
}

/** Binds `TreeRoot` to one tree instance. */
export function createTreeRoot<T>(
  internals: TreeInternals<T>,
): (props: TreeT.Props<T>) => JSX.Element {
  return function Tree(props) {
    return <TreeRoot<T> {...props} internals={internals} />
  }
}
