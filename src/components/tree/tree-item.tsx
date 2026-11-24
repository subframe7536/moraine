import type { JSX } from '@solidjs/web'
import { For, Show, createMemo, createEffect, createSignal, untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { createDisclosureState } from '../../shared/disclosure-state'
import { bindElement } from '../../shared/element-binding'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef, pick } from '../../shared/utils'

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
    open: () => props.item.expanded,
    transition,
    forceMount: () => context.props.forceMount,
    // Layout height of the child list: a row still translated by a drop animation overflows it and
    // would inflate `scrollHeight` past the height the group settles at.
    measure: (element) => element.offsetHeight,
  })
  const allowHeightMotion = () => transition() && !disclosure.initialOpen()
  const hasMeasuredHeight = () => disclosure.contentHeight() > 0 || lastHeight() > 0
  // A memo, so the toggle counter below sees only real state changes, not every height measurement.
  const visualExpanded = createMemo(
    () => disclosure.open() && (disclosure.initialOpen() || hasMeasuredHeight()),
  )
  // A toggle is in progress until its animation ends; the recipe applies the animation only then.
  // A CSS animation that stays applied after it ends replays whenever the element is inserted
  // again, such as when a drag library lifts or restores the item, or a reorder moves it. It also
  // clips the group, so focus rings of child rows stay visible at rest.
  //
  // Derived rather than written on change: the state can change through methods, a controlled
  // `expandedKeys`, or a late height measurement, and the attributes that start the animation must
  // apply in the same update as each of them. Counting toggles keeps a reversal mid-animation in
  // progress, so the opposite animation takes over. Toggles while transitions are off do not count.
  // Every change after mount is a user toggle, so it reads `transition` rather than
  // `allowHeightMotion`, whose `initialOpen` input updates only after this first open.
  const toggles = createMemo<number>((count?: number): number => {
    visualExpanded()
    return count === undefined ? 0 : untrack(transition) ? count + 1 : count
  })
  const [settledToggles, setSettledToggles] = createSignal(untrack(toggles))
  const animating = () => allowHeightMotion() && toggles() !== settledToggles()
  const finish = () => setSettledToggles(untrack(toggles))
  let contentElement: HTMLElement | undefined
  createEffect(
    toggles,
    () => {
      // No animation runs under reduced motion, so `animationend` never fires.
      requestAnimationFrame(() => {
        if (contentElement?.getAnimations?.().length === 0) {
          finish()
        }
      })
    },
    { defer: true },
  )
  const settle = (event: AnimationEvent) => {
    if (event.target === event.currentTarget) {
      finish()
    }
  }
  createEffect(disclosure.contentHeight, (height) => {
    if (height > 0) {
      setLastHeight(height)
    }
  })
  const {
    slots: { content: contentSlot },
  } = useRecipe(
    treeRecipe,
    {},
    {
      data: {
        content: treeDataAttributes.content({
          closed: () => !visualExpanded(),
          expanded: visualExpanded,
          transition: allowHeightMotion,
          transitioning: animating,
        }),
      },
      context: () => ({ variants: context.variants, ...context.slotOverrides }),
      own: {
        content: () => ({
          style: {
            '--mo-collapsible-content-height': `${disclosure.contentHeight() || lastHeight()}px`,
          },
        }),
      },
      enforced: {
        content: () =>
          allowHeightMotion()
            ? undefined
            : {
                style: {
                  animation: 'none',
                  height: disclosure.open() ? 'auto' : undefined,
                  overflow: 'visible',
                },
              },
      },
    },
  )

  const [shell, setShell] = createSignal<HTMLDivElement>()
  bindElement(shell, disclosure.registerContentElement)

  return (
    <div
      ref={(element) => {
        contentElement = element
        setShell(element)
      }}
      aria-hidden={disclosure.ariaHidden()}
      hidden={disclosure.hidden() && !allowHeightMotion()}
      {...{ 'prop:inert': disclosure.inert() }}
      data-slot="tree-content"
      {...contentSlot}
      onAnimationEnd={settle}
      onAnimationCancel={settle}
    >
      <Show when={disclosure.shouldMount()}>
        {(_mounted) => {
          const [list, setList] = createSignal<HTMLUListElement>()
          bindElement(list, disclosure.registerMeasureElement)
          return (
            <ul ref={setList} role="group" class={TREE_LIST_CLASS}>
              <TreeItemList items={props.item.children} />
            </ul>
          )
        }}
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

/**
 * Host of one item: a `li` with `treeitem` semantics, keyboard and click handling, and the item's
 * row. Return it as the root of `itemRender` with the item instance `itemRender` receives; its
 * children render inside the row. Without a `virtualizer` it also renders the nested group of an
 * expanded branch, so do not render children items yourself.
 *
 * @example
 * ```tsx
 * import { createTree } from 'moraine'
 *
 * const tree = createTree<string>({ items: () => ['Docs', 'Src'], getKey: (name) => name })
 *
 * <tree.Tree
 *   aria-label="Folders"
 *   itemRender={(item) => (
 *     <tree.Item item={item}>
 *       <tree.ItemTrigger />
 *       <tree.ItemLabel />
 *     </tree.Item>
 *   )}
 * />
 * ```
 */
export function TreeItem(props: TreeT.ItemProps): JSX.Element {
  const local = pick(
    props,
    'item',
    'children',
    'ref',
    'class',
    'style',
    'onClick',
    'onKeyDown',
    'onFocusIn',
    'onMouseDown',
  )
  const rest = omit(
    props,
    'item',
    'children',
    'ref',
    'class',
    'style',
    'onClick',
    'onKeyDown',
    'onFocusIn',
    'onMouseDown',
  )
  const context = useTreeContext()
  const itemContext = useTreeItemContext()
  const row = () => (itemContext?.item === local.item ? itemContext.row : undefined)
  const [itemElement, setItemElement] = createSignal<HTMLElement>()
  // Re-register when a reused row renders another item key.
  createEffect(
    () => [itemElement(), (() => local.item.key)()],
    ([element, key]) => {
      if (element) {
        return context.state.navigation.registerElement(key, element)
      }
    },
  )
  // Virtual row wiring (such as the measured index attribute) is owned and applied after rest.
  // Its `style` merges through the enforced recipe layer and its `ref` through the composed ref.
  const rowAttributes = omit(
    untrack(() => row() ?? {}),
    'ref',
    'style',
  )
  const {
    slots: { item: itemSlot, row: rowSlot, guide: guideSlot },
    variants,
  } = useRecipe(treeRecipe, local, {
    slot: 'item',
    data: {
      item: treeDataAttributes.item({
        checked: () => local.item.checkedState === 'checked',
        disabled: () => local.item.disabled,
        expanded: () => local.item.expanded,
        indeterminate: () => local.item.checkedState === 'indeterminate',
        leaf: () => local.item.leaf,
        loading: () => local.item.loading,
        selected: () => local.item.selected,
      }),
      row: treeDataAttributes.row({
        disabled: () => local.item.disabled,
        expanded: () => local.item.expanded,
        leaf: () => local.item.leaf,
        selected: () => local.item.selected,
      }),
    },
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
    own: {
      item: () => ({
        style: { '--mo-tree-level': local.item.level - 1 },
      }),
      row: () => ({
        style: TREE_ROW_PADDING_STYLE,
      }),
    },
    enforced: { item: () => ({ style: row()?.style }) },
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
        aria-label={local.item.label}
        {...itemSlot}
        {...rest}
        {...rowAttributes}
        tabindex={
          local.item.disabled
            ? undefined
            : context.state.navigation.tabStopKey() === local.item.key
              ? 0
              : -1
        }
        aria-level={local.item.level}
        aria-posinset={local.item.posInSet}
        aria-setsize={local.item.setSize}
        aria-expanded={
          local.item.hasChildren ? (local.item.expanded ? 'true' : 'false') : undefined
        }
        aria-selected={
          context.state.selectionMode() === 'none'
            ? undefined
            : local.item.selected
              ? 'true'
              : 'false'
        }
        aria-checked={
          context.options.checkable
            ? local.item.checkedState === 'indeterminate'
              ? 'mixed'
              : local.item.checkedState === 'checked'
                ? 'true'
                : 'false'
            : undefined
        }
        aria-disabled={local.item.disabled ? 'true' : undefined}
        aria-busy={local.item.loading ? 'true' : undefined}
        ref={(element: HTMLElement) => {
          setItemElement(element)
          callRef(() => row()?.ref, element)
          callRef(() => local.ref, element)
        }}
        onClick={(event: MouseEvent) => {
          if (
            !callHandler(event, local.onClick).defaultPrevented &&
            belongsToItem(event) &&
            !isFromDescendant(event, INTERACTIVE_SELECTOR) &&
            !local.item.disabled
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
          if (belongsToItem(event) && !local.item.disabled) {
            context.state.setFocusedKey(local.item.key)
          }
        }}
        onMouseDown={(event: MouseEvent) => {
          if (
            !callHandler(event, local.onMouseDown).defaultPrevented &&
            belongsToItem(event) &&
            !local.item.disabled &&
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
        <div data-slot="tree-row" {...rowSlot}>
          <Show when={variants.indentGuide && local.item.level > 1}>
            <span data-slot="tree-guides" aria-hidden="true" class={TREE_GUIDES_CLASS}>
              <For each={Array.from({ length: local.item.level - 1 })} keyed={false}>
                {() => <span data-slot="tree-guide" {...guideSlot} />}
              </For>
            </span>
          </Show>
          {local.children}
        </div>
        <Show when={!context.props.virtualizer && local.item.hasChildren}>
          <TreeItemGroup item={local.item} />
        </Show>
      </li>
    </TreeItemProvider>
  )
}

/**
 * Default item content: trigger (unless `expandIcon` is `false` or `null`), check box when
 * checkable, prefix icon from `getItemIcon`, label, and actions.
 */
export function TreeDefaultItem(props: TreeT.ItemRenderProps<unknown>): JSX.Element {
  const context = useTreeContext()

  return (
    <TreeItem item={props}>
      <Show when={context.props.expandIcon !== false && context.props.expandIcon !== null}>
        <TreeItemTrigger />
      </Show>
      <TreeItemCheckbox />
      <Show when={context.props.getItemIcon?.(props)}>
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
