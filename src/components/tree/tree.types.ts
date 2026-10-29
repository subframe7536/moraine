import type { Component, FlowComponent, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'
import type { ListT } from '../list/list.types'

import type { TreeStyleSlot, TreeStyleVariants } from './tree.style-types'

export namespace TreeT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = TreeStyleSlot<T>
  export type Variants = TreeStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type SelectionMode = 'none' | 'single' | 'multiple'

  /** Cascading check state of one node. */
  export type CheckedState = 'checked' | 'unchecked' | 'indeterminate'

  /**
   * Options for `createTree`. Options are read reactively, so controlled values can be
   * supplied with getters, for example `get expandedKeys() { return keys() }`.
   */
  export interface Options<T> {
    /** Reactive root items. */
    items: () => readonly T[]

    /** Returns the unique, stable key of an item. */
    getKey: (item: T) => string

    /** Returns the children of an item. Items that return `undefined` have no children yet. */
    getChildren?: (item: T) => readonly T[] | undefined

    /**
     * Returns the text used for the accessible name and typeahead.
     * Defaults to the item itself for strings and to its key otherwise.
     */
    getTextValue?: (item: T) => string | undefined

    /**
     * Returns the prefix icon of an item, shown before the label of the default item.
     * Receives the item instance so the icon can react to expansion or loading state.
     * `undefined` renders no icon.
     */
    getIcon?: (item: ItemInstance<T>) => IconT.Name | undefined

    /** Whether an item is disabled. Disabled items are skipped by keyboard navigation. */
    isDisabled?: (item: T) => boolean

    /**
     * Marks an item as a leaf, so it is never treated as a lazy branch.
     * Only relevant together with `loadChildren`.
     */
    isLeaf?: (item: T) => boolean

    /**
     * Loads the children of an item on demand. Items without children and not marked as
     * leaves become lazy branches. Expanding one waits for the returned promise.
     */
    loadChildren?: (item: T) => Promise<readonly T[]>

    /** Called after the children of an item were loaded. */
    onLoadChildrenComplete?: (details: { item: T; children: readonly T[] }) => void

    /** Called when loading the children of an item failed. */
    onLoadChildrenError?: (details: { item: T; error: unknown }) => void

    /** Expanded keys (controlled). */
    expandedKeys?: readonly string[]

    /**
     * Expanded keys by default (uncontrolled).
     * @default []
     */
    defaultExpandedKeys?: readonly string[]

    /** Called when the expanded keys change. */
    onExpandedChange?: (keys: string[]) => void

    /**
     * Whether clicking a branch row also toggles it. When `false`, only the trigger toggles.
     * @default true
     */
    expandOnClick?: boolean

    /**
     * Whether items render the expand chevron. When `false`, `tree.ItemTrigger` renders
     * nothing and clicking a branch row toggles it even when `expandOnClick` is `false`.
     * @default true
     */
    trigger?: boolean

    /**
     * How many items can be selected.
     * @default 'single'
     */
    selectionMode?: SelectionMode

    /** Selected keys (controlled). */
    selectedKeys?: readonly string[]

    /**
     * Selected keys by default (uncontrolled).
     * @default []
     */
    defaultSelectedKeys?: readonly string[]

    /** Called when the selected keys change. */
    onSelectionChange?: (keys: string[]) => void

    /**
     * Whether items expose a check state rendered with `tree.ItemCheckbox`.
     * @default false
     */
    checkable?: boolean

    /**
     * Whether checking a branch checks its descendants and derives the branch state from them.
     * @default true
     */
    checkCascade?: boolean

    /** Checked keys (controlled). */
    checkedKeys?: readonly string[]

    /**
     * Checked keys by default (uncontrolled).
     * @default []
     */
    defaultCheckedKeys?: readonly string[]

    /** Called when the checked keys change. */
    onCheckedChange?: (keys: string[]) => void

    /**
     * Whether typing characters moves focus to the next matching item.
     * @default true
     */
    typeahead?: boolean

    /** Called when an item is activated with `Enter`. Without it, `Enter` selects the item. */
    onAction?: (item: ItemInstance<T>) => void
  }

  /** Reactive state of a tree. Fields update through the instance methods. */
  export interface State {
    /** Keys of expanded branches. */
    readonly expandedKeys: readonly string[]
    /** Keys of selected items. */
    readonly selectedKeys: readonly string[]
    /**
     * Keys whose check state is `checked`, followed by checked keys of items that are not loaded
     * yet. Matches the keys passed to `onCheckedChange`.
     */
    readonly checkedKeys: readonly string[]
    /** Key of the item that currently holds focus. */
    readonly focusedKey: string | undefined
    /** Keys of branches that are loading their children. */
    readonly loadingKeys: readonly string[]
  }

  /** Imperative API of a tree instance. */
  export interface Methods<T> {
    expand: (key: string) => void
    collapse: (key: string) => void
    toggle: (key: string) => void
    expandAll: () => void
    collapseAll: () => void
    /** Expands every ancestor of the item so it becomes visible. */
    expandTo: (key: string) => void
    select: (key: string) => void
    deselect: (key: string) => void
    toggleSelect: (key: string) => void
    selectAll: () => void
    clearSelection: () => void
    check: (key: string) => void
    uncheck: (key: string) => void
    toggleCheck: (key: string) => void
    /**
     * Moves the roving tab stop and DOM focus to the item, expanding collapsed ancestors and
     * scrolling it into view. Items under a disabled collapsed ancestor are ignored.
     */
    focus: (key: string) => void
    getItem: (key: string) => ItemInstance<T> | undefined
    isLoading: (key: string) => boolean
  }

  /** Stable per-key handle that carries item data, reactive state, and actions. */
  export interface ItemInstance<T> {
    readonly key: string
    readonly raw: T
    /** One-based depth, matching `aria-level`. */
    readonly level: number
    readonly posInSet: number
    readonly setSize: number
    readonly hasChildren: boolean
    /** Whether the item has no children. */
    readonly isLeaf: boolean
    readonly isLastChild: boolean
    readonly parentKey: string | undefined
    /** Direct children, whether or not the item is expanded. */
    readonly children: readonly ItemInstance<T>[]
    readonly textValue: string
    readonly isExpanded: boolean
    readonly isSelected: boolean
    readonly isLoading: boolean
    readonly isFocused: boolean
    readonly isDisabled: boolean
    readonly checkedState: CheckedState
    expand: () => void
    collapse: () => void
    toggle: () => void
    select: () => void
    toggleSelect: () => void
    toggleCheck: () => void
    focus: () => void
  }

  /** Item instance passed to `itemRender`, `actionRender`, and `tree.Item`'s `item` prop. */
  export type ItemRenderProps<T> = ItemInstance<T>

  export type VirtualRenderProps<T = unknown> = ListT.VirtualRenderProps<ItemInstance<T>>

  export interface Base<T = unknown> {
    /**
     * Renders one visible item. Defaults to trigger, check box when checkable, the icon
     * returned by `getIcon`, label, and `actionRender` actions.
     * Use `tree.Item` as the root of the rendered content.
     */
    itemRender?: Component<ItemRenderProps<T>>

    /**
     * Renders trailing actions for each item in the default item, inside `tree.ItemAction`.
     * Receives the item instance. Custom `itemRender` content composes `tree.ItemAction` directly.
     */
    actionRender?: Component<ItemRenderProps<T>>

    /** Replaces nested rendering with caller-controlled virtual rendering of flattened items. */
    virtualRender?: Component<VirtualRenderProps<T>>

    /** Scrolls a focused item into view using its flattened index. */
    scrollToItem?: (item: ItemInstance<T>, entryIndex: number) => void

    /**
     * Expand affordance icon.
     * @default 'icon-chevron-right'
     */
    triggerIcon?: IconT.Name

    /**
     * Icon shown in the trigger while children load.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Whether expanding and collapsing nested content animates its height.
     * @default true
     */
    transition?: boolean

    /**
     * Whether collapsed branches unmount their children.
     * @default true
     */
    unmountOnHide?: boolean
  }

  export type Props<T = unknown> = BaseProps<'ul', Base<T>, Variants, Classes, Styles>

  export interface ItemBase<T = unknown> {
    /** Item this node renders. */
    item: ItemInstance<T>
    /** Row content, usually trigger and label. */
    children?: JSX.Element
  }

  export type ItemProps<T = unknown> = BaseProps<'li', ItemBase<T>, never, never, never>

  export interface ItemTriggerBase<T extends ValidComponent = 'span'> {
    /**
     * Element or component to render as.
     * @default 'span'
     */
    as?: T
    /** Overrides the expand icon. */
    icon?: IconT.Name
    /** Replaces the icon. */
    children?: JSX.Element
  }

  export type ItemTriggerProps<T extends ValidComponent = 'span'> = BaseProps<
    T,
    ItemTriggerBase<T>,
    never,
    never,
    never,
    'span'
  >

  export interface ItemIconBase {
    /** Icon to render. */
    icon: IconT.Name
  }

  export type ItemIconProps = BaseProps<'div', ItemIconBase, never, never, never>

  export interface ItemLabelBase<T extends ValidComponent = 'span'> {
    /**
     * Element or component to render as.
     * @default 'span'
     */
    as?: T
    /** Replaces the item's text value. */
    children?: JSX.Element
  }

  export type ItemLabelProps<T extends ValidComponent = 'span'> = BaseProps<
    T,
    ItemLabelBase<T>,
    never,
    never,
    never,
    'span'
  >

  export interface ItemCheckboxBase {
    /**
     * Icon shown when the item is checked.
     * @default 'icon-check'
     */
    checkedIcon?: IconT.Name

    /**
     * Icon shown when the item is indeterminate.
     * @default 'icon-minus'
     */
    indeterminateIcon?: IconT.Name
  }

  export type ItemCheckboxProps = BaseProps<'button', ItemCheckboxBase, never, never, never>

  /** Host props of the action container; children are the action controls. */
  export type ItemActionProps = BaseProps<'div', { children?: JSX.Element }, never, never, never>

  export interface Parts<T> {
    /** Tree root. Renders the visible items, nested or through `virtualRender`. */
    Tree: (props: Props<T>) => JSX.Element
    Item: (props: ItemProps<T>) => JSX.Element
    ItemTrigger: <As extends ValidComponent = 'span'>(props: ItemTriggerProps<As>) => JSX.Element
    ItemCheckbox: (props?: ItemCheckboxProps) => JSX.Element
    ItemIcon: (props: ItemIconProps) => JSX.Element
    ItemLabel: <As extends ValidComponent = 'span'>(props: ItemLabelProps<As>) => JSX.Element
    ItemAction: FlowComponent<ItemActionProps>
  }

  /** Tree store returned by `createTree`. */
  export type Instance<T> = State &
    Methods<T> &
    Parts<T> & {
      /** Visible items in pre-order. */
      readonly flattenedItems: readonly ItemInstance<T>[]
    }
}

export type TreeProps<T = unknown> = TreeT.Props<T>
