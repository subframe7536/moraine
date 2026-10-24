import type { JSX } from 'solid-js'
import { Show, createSignal, onCleanup, onMount, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { createListVirtualizer } from '../../shared/list-virtualizer'
import { callRef } from '../../shared/utils'

import { TreeProvider, TreeRowProvider } from './tree-context'
import type { TreeContext } from './tree-context'
import { TreeDefaultItem, TreeItemList } from './tree-item'
import type { TreeNavigation } from './tree-navigation'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

const DEFAULT_OVERSCAN = 8

export interface TreeInternals<T> {
  rootItems: () => readonly TreeT.ItemInstance<T>[]
  flattenedItems: () => readonly TreeT.ItemInstance<T>[]
  flattenedKeys: () => readonly string[]
  selectionMode: () => TreeT.SelectionMode
  checkable: () => boolean
  navigation: TreeNavigation
}

/** Tree root bound to a `createTree` instance through `internals`. */
export function TreeRoot<T>(props: TreeT.Props<T> & { internals: TreeInternals<T> }): JSX.Element {
  const [local, rest] = splitProps(props, [
    'internals',
    'itemRender',
    'virtual',
    'icons',
    'animate',
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
    enforced: () => ({
      virtualContainer: {
        style: {
          height:
            typeof local.virtual?.height === 'number'
              ? `${local.virtual.height}px`
              : local.virtual?.height,
        },
      },
    }),
  })
  const internals = untrack(() => local.internals)
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()
  const virtualizer = createListVirtualizer<TreeT.ItemInstance<T>>({
    estimateSize: (item) => {
      const estimate = local.virtual?.estimateSize ?? 32
      return typeof estimate === 'function' ? estimate(item) : estimate
    },
    getItemKey: (item) => item.key,
    get overscan() {
      return local.virtual?.overscan ?? DEFAULT_OVERSCAN
    },
  })
  const VirtualRender = virtualizer.virtualRender

  onMount(() => {
    internals.navigation.registerScroller((key) => {
      const index = internals.flattenedKeys().indexOf(key)
      if (index >= 0) {
        virtualizer.scrollToIndex(index)
      }
    })
  })
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
      return Boolean(local.virtual)
    },
    get checkable() {
      return internals.checkable()
    },
    get animate() {
      return local.animate ?? true
    },
    get unmountOnHide() {
      return local.unmountOnHide ?? true
    },
    icons: {
      get trigger() {
        return local.icons?.trigger ?? 'icon-chevron-right'
      },
      get folder() {
        return local.icons?.folder ?? 'icon-folder'
      },
      get folderOpen() {
        return local.icons?.folderOpen ?? 'icon-folder-open'
      },
      get file() {
        return local.icons?.file ?? 'icon-file'
      },
      get loading() {
        return local.icons?.loading ?? 'icon-loading'
      },
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
          internals.navigation.registerRoot(element)
          callRef(local.ref, element)
        }}
      >
        <Show when={local.virtual} fallback={<TreeItemList items={internals.rootItems()} />}>
          <div
            ref={setScrollElement}
            data-slot="tree-virtual-container"
            {...slots.virtualContainer}
          >
            <VirtualRender
              entries={internals.flattenedItems()}
              scrollElement={scrollElement()}
              render={(item, _index, rowProps) => (
                <TreeRowProvider value={rowProps ?? null}>
                  <RenderItem item={item} />
                </TreeRowProvider>
              )}
            />
          </div>
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
