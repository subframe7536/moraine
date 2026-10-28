import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { createDisclosureState } from '../../shared/disclosure-state'
import { callHandler, callRef } from '../../shared/utils'
import { Checkbox } from '../checkbox'

import { TreeItemProvider, useTreeContext, useTreeItemContext } from './tree-context'
import { TreeItemIcon } from './tree-item-icon'
import { TreeItemLabel } from './tree-item-label'
import { TreeItemTrigger } from './tree-item-trigger'
import { TREE_INDENT_GUIDE_STYLE, treeDataAttributes, treeRecipe } from './tree.recipe'
import type { TreeT } from './tree.types'

const WIRING_KEYS = ['ref', 'onClick', 'onKeyDown', 'onFocusIn', 'onMouseDown'] as const

function TreeItemGroup(props: { item: TreeT.ItemInstance<unknown> }): JSX.Element {
  const context = useTreeContext()
  const [lastHeight, setLastHeight] = createSignal(0)
  const transition = () => context.props.transition ?? true
  const disclosure = createDisclosureState({
    open: () => props.item.isExpanded,
    transition,
    unmountOnHide: () => context.props.unmountOnHide ?? true,
  })
  const allowHeightMotion = () => transition() && !disclosure.initialOpen()
  const hasMeasuredHeight = () => disclosure.contentHeight() > 0 || lastHeight() > 0
  const visualExpanded = () =>
    disclosure.open() && (disclosure.initialOpen() || hasMeasuredHeight())
  createEffect(
    on(disclosure.contentHeight, (height) => {
      if (height > 0) {
        setLastHeight(height)
      }
    }),
  )
  const { slots } = useRecipe(
    treeRecipe,
    {
      get transition() {
        return allowHeightMotion()
      },
    },
    {
      slot: 'content',
      contextVariants: () => context.variants,
      contextSlots: () => context.slotOverrides,
      own: () => ({
        content: {
          style: {
            '--mo-collapsible-content-height': `${disclosure.contentHeight() || lastHeight()}px`,
          },
        },
      }),
      enforced: () => {
        if (!allowHeightMotion()) {
          return {
            content: {
              style: {
                animation: 'none',
                height: disclosure.open() ? 'auto' : undefined,
                overflow: 'visible',
              },
            },
          }
        }
        return {}
      },
    },
  )

  return (
    <div
      ref={(element) => {
        onCleanup(disclosure.registerPresenceElement(element))
      }}
      role="group"
      aria-hidden={disclosure.ariaHidden()}
      hidden={disclosure.hidden() && !allowHeightMotion()}
      inert={disclosure.inert()}
      data-slot="tree-content"
      {...slots.content}
      {...treeDataAttributes.content({
        closed: () => !visualExpanded(),
        expanded: visualExpanded,
      })}
    >
      <Show when={disclosure.shouldMount()}>
        <div
          ref={(element) => {
            onCleanup(disclosure.registerMeasureElement(element))
          }}
        >
          <TreeItemList items={props.item.children} />
        </div>
      </Show>
    </div>
  )
}

/** Renders the given items through the tree's item renderer. */
export function TreeItemList(props: {
  items: readonly TreeT.ItemInstance<unknown>[]
}): JSX.Element {
  const context = useTreeContext()
  return <For each={props.items}>{(item) => <context.RenderItem item={item} />}</For>
}

/** Host of one item: `treeitem` semantics around its row and, when nested, its child group. */
export function TreeItem(props: TreeT.ItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'item',
    'children',
    'ref',
    'class',
    'style',
    'onClick',
    'onKeyDown',
    'onFocusIn',
    'onMouseDown',
  ])
  const context = useTreeContext()
  const itemContext = useTreeItemContext()
  const row = () => (itemContext?.item === local.item ? itemContext.row : undefined)
  const itemProps = createMemo(() => splitProps(local.item.getItemProps(), WIRING_KEYS))
  const wiring = () => itemProps()[0]
  const attributes = () => itemProps()[1]
  const { slots } = useRecipe(treeRecipe, local, {
    slot: 'item',
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
    own: () => ({
      item: {
        style: { ...TREE_INDENT_GUIDE_STYLE, '--mo-tree-level': local.item.level - 1 },
      },
    }),
    enforced: () => ({ item: { style: row()?.style } }),
  })
  const leaf = () => !local.item.hasChildren

  return (
    <TreeItemProvider
      value={{
        get item() {
          return local.item
        },
        get row() {
          return row()
        },
      }}
    >
      <div
        data-slot="tree-item"
        {...row()}
        {...attributes()}
        {...rest}
        {...slots.item}
        {...treeDataAttributes.item({
          checked: () => local.item.checkedState === 'checked',
          disabled: () => local.item.isDisabled,
          expanded: () => local.item.isExpanded,
          indeterminate: () => local.item.checkedState === 'indeterminate',
          leaf,
          loading: () => local.item.isLoading,
          selected: () => local.item.isSelected,
        })}
        ref={(element: HTMLElement) => {
          callRef(wiring().ref, element)
          callRef(row()?.ref, element)
          callRef(local.ref, element)
        }}
        onClick={(event: MouseEvent) => {
          if (!callHandler(event, local.onClick).defaultPrevented) {
            callHandler(event, wiring().onClick)
          }
        }}
        onKeyDown={(event: KeyboardEvent) => {
          if (!callHandler(event, local.onKeyDown).defaultPrevented) {
            callHandler(event, wiring().onKeyDown)
          }
        }}
        onFocusIn={(event: FocusEvent) => {
          callHandler(event, local.onFocusIn)
          callHandler(event, wiring().onFocusIn)
        }}
        onMouseDown={(event: MouseEvent) => {
          if (!callHandler(event, local.onMouseDown).defaultPrevented) {
            callHandler(event, wiring().onMouseDown)
          }
        }}
      >
        <div
          data-slot="tree-row"
          {...slots.row}
          {...treeDataAttributes.row({
            disabled: () => local.item.isDisabled,
            expanded: () => local.item.isExpanded,
            leaf,
            selected: () => local.item.isSelected,
          })}
        >
          {local.children}
        </div>
        <Show when={!context.props.virtualRender && local.item.hasChildren}>
          <TreeItemGroup item={local.item} />
        </Show>
      </div>
    </TreeItemProvider>
  )
}

/** Default item content: trigger, check box when checkable, prefix icon, and label. */
export function TreeDefaultItem(props: TreeT.ItemRenderProps<unknown>): JSX.Element {
  const context = useTreeContext()

  return (
    <TreeItem item={props.item}>
      <TreeItemTrigger />
      <Show when={context.options.checkable}>
        <Checkbox {...props.item.getCheckboxProps()} size={context.variants.size} />
      </Show>
      <Show when={context.options.getIcon?.(props.item)}>
        {(icon) => <TreeItemIcon icon={icon()} />}
      </Show>
      <TreeItemLabel />
    </TreeItem>
  )
}
