import type { JSX } from 'solid-js'
import { For, Index, Show, createEffect, createSignal, on, onCleanup, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { createDisclosureState } from '../../shared/disclosure-state'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'

import { TreeItemProvider, useTreeContext, useTreeItemContext } from './tree-context'
import { TreeItemAction } from './tree-item-action'
import { TreeItemCheckbox } from './tree-item-checkbox'
import { TreeItemIcon } from './tree-item-icon'
import { TreeItemLabel } from './tree-item-label'
import { TreeItemTrigger } from './tree-item-trigger'
import {
  TREE_GUIDES_CLASS,
  TREE_LIST_CLASS,
  TREE_ROW_PADDING_STYLE,
  treeDataAttributes,
  treeRecipe,
} from './tree.recipe'
import type { TreeT } from './tree.types'

const ACTION_SELECTOR = '[data-slot="tree-action"]'
const INTERACTIVE_SELECTOR = `a, button, input, select, textarea, label, [role="checkbox"], ${ACTION_SELECTOR}`
const POINTER_FOCUS_SELECTOR =
  'button, input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"], [data-slot="tree-trigger"]'

function belongsToItem(event: Event): boolean {
  const host = event.currentTarget
  const target = event.target instanceof Element ? event.target : null
  if (!(host instanceof Element) || !target || target.closest('[role="treeitem"]') !== host) {
    return false
  }
  const group = target.closest('[role="group"]')
  return !group || !host.contains(group)
}

function isFromDescendant(event: Event, selector: string): boolean {
  const host = event.currentTarget
  const target = event.target instanceof Element ? event.target.closest(selector) : null
  return host instanceof Element && !!target && target !== host && host.contains(target)
}

function TreeItemGroup(props: { item: TreeT.ItemInstance<unknown> }): JSX.Element {
  const context = useTreeContext()
  const [lastHeight, setLastHeight] = createSignal(0)
  const transition = () => Boolean(context.variants.transition)
  const disclosure = createDisclosureState({
    open: () => props.item.isExpanded,
    transition,
    unmountOnHide: () => context.props.unmountOnHide ?? true,
  })
  const allowHeightMotion = () => transition() && !disclosure.initialOpen()
  const hasMeasuredHeight = () => disclosure.contentHeight() > 0 || lastHeight() > 0
  const visualExpanded = () =>
    disclosure.open() && (disclosure.initialOpen() || hasMeasuredHeight())
  // Clips the group only while its height animates, so focus rings of child rows stay visible.
  const [animating, setAnimating] = createSignal(false)
  let contentElement: HTMLElement | undefined
  createEffect(
    on(
      visualExpanded,
      () => {
        if (!allowHeightMotion()) {
          return
        }
        setAnimating(true)
        // No animation runs under reduced motion, so `animationend` never fires.
        requestAnimationFrame(() => {
          if (contentElement?.getAnimations?.().length === 0) {
            setAnimating(false)
          }
        })
      },
      { defer: true },
    ),
  )
  const settle = (event: AnimationEvent) => {
    if (event.target === event.currentTarget) {
      setAnimating(false)
    }
  }
  createEffect(
    on(disclosure.contentHeight, (height) => {
      if (height > 0) {
        setLastHeight(height)
      }
    }),
  )
  const { slots } = useRecipe(
    treeRecipe,
    {},
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
        contentElement = element
        onCleanup(disclosure.registerPresenceElement(element))
      }}
      aria-hidden={disclosure.ariaHidden()}
      hidden={disclosure.hidden() && !allowHeightMotion()}
      inert={disclosure.inert()}
      data-slot="tree-content"
      {...treeDataAttributes.content({
        closed: () => !visualExpanded(),
        expanded: visualExpanded,
        transition: allowHeightMotion,
        transitioning: animating,
      })}
      {...slots.content}
      onAnimationEnd={settle}
      onAnimationCancel={settle}
    >
      <Show when={disclosure.shouldMount()}>
        <ul
          ref={(element) => {
            onCleanup(disclosure.registerMeasureElement(element))
          }}
          role="group"
          class={TREE_LIST_CLASS}
        >
          <TreeItemList items={props.item.children} />
        </ul>
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
  // Virtual row wiring (such as the measured index attribute) is owned and applied after rest.
  // Its `style` merges through the enforced recipe layer and its `ref` through the composed ref.
  const rowAttributes = () => {
    const current = row()
    if (!current) {
      return undefined
    }
    const { ref: _ref, style: _style, ...attributes } = current
    return attributes
  }
  const { slots, variants } = useRecipe(treeRecipe, local, {
    slot: 'item',
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
    own: () => ({
      item: {
        style: { '--mo-tree-level': local.item.level - 1 },
      },
      row: {
        style: TREE_ROW_PADDING_STYLE,
      },
    }),
    enforced: () => ({ item: { style: row()?.style } }),
  })

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
      <li
        data-slot="tree-item"
        role="treeitem"
        aria-label={local.item.textValue}
        {...treeDataAttributes.item({
          checked: () => local.item.checkedState === 'checked',
          disabled: () => local.item.isDisabled,
          expanded: () => local.item.isExpanded,
          indeterminate: () => local.item.checkedState === 'indeterminate',
          leaf: () => local.item.isLeaf,
          loading: () => local.item.isLoading,
          selected: () => local.item.isSelected,
        })}
        {...rest}
        {...slots.item}
        {...rowAttributes()}
        tabIndex={
          local.item.isDisabled
            ? undefined
            : context.state.navigation.tabStopKey() === local.item.key
              ? 0
              : -1
        }
        aria-level={local.item.level}
        aria-posinset={local.item.posInSet}
        aria-setsize={local.item.setSize}
        aria-expanded={local.item.hasChildren ? local.item.isExpanded : undefined}
        aria-selected={context.state.selectionMode() === 'none' ? undefined : local.item.isSelected}
        aria-checked={
          context.options.checkable
            ? local.item.checkedState === 'indeterminate'
              ? 'mixed'
              : local.item.checkedState === 'checked'
            : undefined
        }
        aria-disabled={local.item.isDisabled ? true : undefined}
        aria-busy={local.item.isLoading ? true : undefined}
        ref={(element: HTMLElement) => {
          onCleanup(context.state.navigation.registerElement(local.item.key, element))
          callRef(row()?.ref, element)
          callRef(local.ref, element)
        }}
        onClick={(event: MouseEvent) => {
          if (
            !callHandler(event, local.onClick).defaultPrevented &&
            belongsToItem(event) &&
            !isFromDescendant(event, INTERACTIVE_SELECTOR) &&
            !local.item.isDisabled
          ) {
            context.state.handleClick(event, local.item.key)
          }
        }}
        onKeyDown={(event: KeyboardEvent) => {
          if (!callHandler(event, local.onKeyDown).defaultPrevented) {
            context.state.navigation.onKeyDown(event, local.item.key)
          }
        }}
        onFocusIn={(event: FocusEvent) => {
          callHandler(event, local.onFocusIn)
          if (belongsToItem(event) && !local.item.isDisabled) {
            context.state.setFocusedKey(local.item.key)
          }
        }}
        onMouseDown={(event: MouseEvent) => {
          if (
            !callHandler(event, local.onMouseDown).defaultPrevented &&
            belongsToItem(event) &&
            !local.item.isDisabled &&
            isFromDescendant(event, POINTER_FOCUS_SELECTOR) &&
            !isFromDescendant(event, ACTION_SELECTOR)
          ) {
            event.preventDefault()
            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.focus()
            }
          }
        }}
      >
        <div
          data-slot="tree-row"
          {...treeDataAttributes.row({
            disabled: () => local.item.isDisabled,
            expanded: () => local.item.isExpanded,
            leaf: () => local.item.isLeaf,
            selected: () => local.item.isSelected,
          })}
          {...slots.row}
        >
          <Show when={variants.indentGuide && local.item.level > 1}>
            <span data-slot="tree-guides" aria-hidden="true" class={TREE_GUIDES_CLASS}>
              <Index each={Array.from({ length: local.item.level - 1 })}>
                {() => <span data-slot="tree-guide" {...slots.guide} />}
              </Index>
            </span>
          </Show>
          {local.children}
        </div>
        <Show when={!context.props.virtualRender && local.item.hasChildren}>
          <TreeItemGroup item={local.item} />
        </Show>
      </li>
    </TreeItemProvider>
  )
}

/** Default item content: trigger, check box when checkable, prefix icon, label, and actions. */
export function TreeDefaultItem(props: TreeT.ItemRenderProps<unknown>): JSX.Element {
  const context = useTreeContext()

  return (
    <TreeItem item={props}>
      <TreeItemTrigger />
      <TreeItemCheckbox />
      <Show when={context.options.getIcon?.(props)}>
        {(icon) => <TreeItemIcon icon={icon()} />}
      </Show>
      <TreeItemLabel />
      <Show when={context.props.actionRender}>
        {(actionRender) => (
          <TreeItemAction>{renderWithProps(actionRender(), props)}</TreeItemAction>
        )}
      </Show>
    </TreeItem>
  )
}
