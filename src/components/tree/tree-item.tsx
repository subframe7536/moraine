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
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { createDisclosureState } from '../../shared/disclosure-state'
import type { ValidComponent } from '../../shared/types'
import { callHandler, callRef } from '../../shared/utils'
import { Checkbox } from '../checkbox'
import { Icon } from '../icon'

import {
  TreeItemProvider,
  useTreeContext,
  useTreeItemContext,
  useTreeRowContext,
} from './tree-context'
import { getVirtualRowAttributes } from './tree-dom'
import { TREE_TRIGGER_ICON_CLASS, treeDataAttributes, treeRecipe } from './tree.recipe'
import type { TreeStyleSlot } from './tree.style-types'
import type { TreeT } from './tree.types'

const WIRING_KEYS = ['ref', 'onClick', 'onKeyDown', 'onFocusIn', 'onMouseDown'] as const

function useTreePart(slot: Extract<keyof TreeStyleSlot, string>, props: object) {
  const context = useTreeContext()
  return useRecipe(treeRecipe, props, {
    slot,
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
  })
}

function TreeItemGroup(props: { item: TreeT.ItemInstance<unknown> }): JSX.Element {
  const context = useTreeContext()
  const startedOpen = untrack(() => props.item.isExpanded)
  const [lastHeight, setLastHeight] = createSignal(0)
  const [hasClosed, setHasClosed] = createSignal(false)
  const skipEnter = () => startedOpen && !hasClosed()
  const allowHeightMotion = () => context.transition && !skipEnter()
  const disclosure = createDisclosureState({
    open: () => props.item.isExpanded,
    transition: () => context.transition,
    unmountOnHide: () => context.unmountOnHide,
  })
  const hasMeasuredHeight = () => disclosure.contentHeight() > 0 || lastHeight() > 0
  const visualExpanded = () => disclosure.open() && (skipEnter() || hasMeasuredHeight())
  createEffect(
    on(disclosure.contentHeight, (height) => {
      if (height > 0) {
        setLastHeight(height)
      }
    }),
  )
  createEffect(
    on(disclosure.open, (isOpen, wasOpen) => {
      if (wasOpen && !isOpen) {
        setHasClosed(true)
      }
    }),
  )
  const { slots } = useRecipe(
    treeRecipe,
    {},
    {
      slot: 'content',
      varsSlot: 'content',
      contextVariants: () => context.variants,
      contextSlots: () => context.slotOverrides,
      vars: () => ({
        '--mo-collapsible-content-height': `${disclosure.contentHeight() || lastHeight()}px`,
      }),
      enforced: () => {
        if (!context.transition || skipEnter()) {
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
      hidden={disclosure.hidden()}
      inert={disclosure.inert()}
      data-slot="tree-content"
      {...slots.content}
      {...treeDataAttributes.content({
        closed: () => !visualExpanded(),
        expanded: visualExpanded,
        transition: allowHeightMotion,
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
  const row = useTreeRowContext()
  const itemProps = createMemo(() => splitProps(local.item.getItemProps(), WIRING_KEYS))
  const wiring = () => itemProps()[0]
  const attributes = () => itemProps()[1]
  const { slots } = useRecipe(treeRecipe, local, {
    slot: 'item',
    varsSlot: 'item',
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
    vars: () => ({ '--mo-tree-level': local.item.level - 1 }),
    enforced: () => ({ item: { style: row?.style } }),
  })
  const leaf = () => !local.item.hasChildren

  return (
    <TreeItemProvider
      value={{
        get item() {
          return local.item
        },
      }}
    >
      <div
        data-slot="tree-item"
        {...getVirtualRowAttributes(row)}
        {...attributes()}
        {...rest}
        {...slots.item}
        {...treeDataAttributes.item({
          checked: () => local.item.checkedState === 'checked',
          disabled: () => local.item.isDisabled,
          entering: () => !context.isVirtual && local.item.isEntering,
          expanded: () => local.item.isExpanded,
          indeterminate: () => local.item.checkedState === 'indeterminate',
          leaf,
          loading: () => local.item.isLoading,
          selected: () => local.item.isSelected,
        })}
        ref={(element: HTMLElement) => {
          callRef(wiring().ref, element)
          callRef(row?.ref, element)
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
            entering: () => !context.isVirtual && local.item.isEntering,
            expanded: () => local.item.isExpanded,
            leaf,
            selected: () => local.item.isSelected,
          })}
        >
          {local.children}
        </div>
        <Show when={!context.isVirtual && local.item.hasChildren}>
          <TreeItemGroup item={local.item} />
        </Show>
      </div>
    </TreeItemProvider>
  )
}

/** Expand affordance. Shows the loading icon while the branch loads its children. */
export function TreeItemTrigger<T extends ValidComponent = 'span'>(
  props: TreeT.ItemTriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as TreeT.ItemTriggerProps, [
    'as',
    'icon',
    'children',
    'class',
    'style',
  ])
  const context = useTreeContext()
  const itemContext = useTreeItemContext()
  const { slots } = useTreePart('trigger', local)

  return (
    <Dynamic
      component={local.as ?? 'span'}
      data-slot="tree-trigger"
      {...itemContext.item.getTriggerProps()}
      {...rest}
      {...slots.trigger}
      {...treeDataAttributes.trigger({
        expanded: () => itemContext.item.isExpanded,
        leaf: () => !itemContext.item.hasChildren,
        loading: () => itemContext.item.isLoading,
      })}
    >
      <Show
        when={local.children}
        fallback={
          <Icon
            name={
              itemContext.item.isLoading ? context.loadingIcon : (local.icon ?? context.triggerIcon)
            }
            slotName="tree-trigger-icon"
            class={TREE_TRIGGER_ICON_CLASS}
          />
        }
      >
        {local.children}
      </Show>
    </Dynamic>
  )
}

/** Prefix icon of the item. */
export function TreeItemIcon(props: TreeT.ItemIconProps): JSX.Element {
  const [local, rest] = splitProps(props, ['icon', 'class', 'style'])
  const itemContext = useTreeItemContext()
  const { slots } = useTreePart('icon', local)

  return (
    <Icon
      name={local.icon}
      slotName="tree-icon"
      {...rest}
      {...slots.icon}
      {...treeDataAttributes.icon({
        expanded: () => itemContext.item.isExpanded,
        leaf: () => !itemContext.item.hasChildren,
      })}
    />
  )
}

/** Text of the item. */
export function TreeItemLabel<T extends ValidComponent = 'span'>(
  props: TreeT.ItemLabelProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as TreeT.ItemLabelProps, [
    'as',
    'children',
    'class',
    'style',
  ])
  const itemContext = useTreeItemContext()
  const { slots } = useTreePart('label', local)

  return (
    <Dynamic component={local.as ?? 'span'} data-slot="tree-label" {...rest} {...slots.label}>
      <Show when={local.children} fallback={itemContext.item.textValue}>
        {local.children}
      </Show>
    </Dynamic>
  )
}

/** Default item content: trigger, check box when checkable, and label. */
export function TreeDefaultItem(props: TreeT.ItemRenderProps<unknown>): JSX.Element {
  const context = useTreeContext()

  return (
    <TreeItem item={props.item}>
      <TreeItemTrigger />
      <Show when={context.checkable}>
        <Checkbox {...props.item.getCheckboxProps()} size={context.variants.size} />
      </Show>
      <TreeItemLabel />
    </TreeItem>
  )
}
