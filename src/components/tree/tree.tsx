import type { JSX } from '@solidjs/web'
import { createEffect, createSignal, onCleanup, untrack, omit, createRenderEffect } from 'solid-js'

import { pickSlotOverrides, useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef } from '../../shared/utils'
import { VirtualContent } from '../../virtualizer/virtual-content'

import { TreeItemProvider, TreeProvider } from './tree-context'
import type { TreeContext, TreeItemContext } from './tree-context'
import { TreeDefaultItem, TreeItem, TreeItemList } from './tree-item'
import { TreeItemAction } from './tree-item-action'
import { TreeItemCheckbox } from './tree-item-checkbox'
import { TreeItemIcon } from './tree-item-icon'
import { TreeItemLabel } from './tree-item-label'
import { TreeItemTrigger } from './tree-item-trigger'
import { createTreeState } from './tree-state'
import type { TreeState } from './tree-state'
import { treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'
function TreeRoot<T>(props: TreeT.Props<T> & { state: TreeState<T> }): JSX.Element {
  const rest = omit(
    props,
    'state',
    'itemRender',
    'actionRender',
    'virtualizer',
    'getItemIcon',
    'expandIcon',
    'loadingIcon',
    'transition',
    'forceMount',
    'size',
    'variant',
    'indentGuide',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
  )
  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(treeRecipe, props)
  const state = untrack(() => props.state)
  const [scrollElement, setScrollElement] = createSignal<HTMLElement>()

  createEffect(
    () => props.virtualizer,
    (virtualizer) => {
      // Items outside the virtual window have no element to scroll into view.
      state.navigation.registerScroller(
        virtualizer
          ? (key) => {
              const index = state.flattenedKeys().indexOf(key)
              if (index >= 0) {
                virtualizer.scrollToIndex(index)
              }
            }
          : undefined,
      )
    },
  )
  createRenderEffect(scrollElement, (element) => {
    if (!element) {
      return
    }
    return state.navigation.registerRoot(element)
  })
  onCleanup(() => {
    state.navigation.registerScroller(undefined)
  })

  function RenderItem(itemProps: TreeItemContext): JSX.Element {
    return (
      <TreeItemProvider value={itemProps}>
        {renderWithProps(
          props.itemRender ?? TreeDefaultItem,
          itemProps.item as TreeT.ItemRenderProps<T>,
        )}
      </TreeItemProvider>
    )
  }

  const context: TreeContext = {
    state: state as unknown as TreeContext['state'],
    options: state.options as unknown as TreeContext['options'],
    props: props as unknown as TreeContext['props'],
    get variants() {
      return {
        size: variants.size,
        variant: variants.variant,
        indentGuide: variants.indentGuide,
        transition: variants.transition,
      }
    },
    slotOverrides: pickSlotOverrides(props),
    RenderItem,
  }

  return (
    <ul
      data-slot="tree"
      role="tree"
      aria-multiselectable={state.selectionMode() === 'multiple' ? 'true' : undefined}
      {...rootSlot}
      {...rest}
      ref={(element: HTMLElement) => {
        setScrollElement(element)
        callRef(() => props.ref, element)
      }}
    >
      <TreeProvider value={context}>
        <VirtualContent<TreeT.ItemInstance<T>>
          virtualizer={props.virtualizer}
          entries={state.flattenedItems()}
          scrollElement={scrollElement()}
          render={(item, _index, rowProps) => <RenderItem item={item} row={rowProps} />}
          fallback={<TreeItemList items={state.rootItems()} />}
        />
      </TreeProvider>
    </ul>
  )
}

/**
 * Creates a headless tree instance that carries reactive state, imperative methods, and the
 * components bound to it. Behavior (expansion, selection, checking, lazy loading) is configured
 * here; presentation is configured on the bound `tree.Tree`. Call it inside a reactive owner, such
 * as a component body; each call creates an independent tree.
 *
 * @example
 * ```tsx
 * import { createTree } from 'moraine'
 *
 * interface Node {
 *   id: string
 *   children?: Node[]
 * }
 * const nodes: Node[] = [{ id: 'src', children: [{ id: 'index.ts' }] }, { id: 'README.md' }]
 * const tree = createTree<Node>({
 *   items: () => nodes,
 *   getKey: (node) => node.id,
 *   getChildren: (node) => node.children,
 *   defaultExpandedKeys: ['src'],
 * })
 *
 * <tree.Tree aria-label="Files" />
 * ```
 */
export function createTree<T>(options: TreeT.Options<T>): TreeT.Instance<T> {
  const state = createTreeState(options)

  return {
    get expandedKeys() {
      return state.expandedKeys()
    },
    get selectedKeys() {
      return state.selectedKeys()
    },
    get checkedKeys() {
      return state.checkedKeys()
    },
    get focusedKey() {
      return state.navigation.focusedKey()
    },
    get loadingKeys() {
      return state.loadingKeys()
    },
    get flattenedItems() {
      return state.flattenedItems()
    },
    expand: state.expand,
    collapse: state.collapse,
    toggle: state.toggle,
    expandAll: state.expandAll,
    collapseAll: state.collapseAll,
    expandTo: state.expandTo,
    select: state.select,
    deselect: state.deselect,
    toggleSelect: state.toggleSelect,
    selectAll: state.selectAll,
    clearSelection: state.clearSelection,
    check: state.check,
    uncheck: state.uncheck,
    toggleCheck: state.toggleCheck,
    focus: state.focus,
    getItem: state.getItem,
    isLoading: state.isLoading,
    Tree: (props: TreeT.Props<T>) => <TreeRoot<T> {...props} state={state} />,
    Item: TreeItem,
    ItemTrigger: TreeItemTrigger,
    ItemCheckbox: TreeItemCheckbox,
    ItemIcon: TreeItemIcon,
    ItemLabel: TreeItemLabel,
    ItemAction: TreeItemAction,
  }
}
