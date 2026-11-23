import type { JSX } from '@solidjs/web'
import type { Component, FlowComponent } from 'solid-js'

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
    /**
     * Reactive accessor returning the root items. Called inside a tracking scope, so a signal or
     * store read here re-indexes the tree when it changes.
     */
    items: () => readonly T[]

    /**
     * Returns the unique, stable key of an item. Keys identify items in every `*Keys` option and
     * method; if a key appears more than once, only the first item with it is kept.
     */
    getKey: (item: T) => string

    /**
     * Returns the children of an item. Return `undefined` or an empty array when the item has no
     * children; with `loadChildren`, `undefined` instead makes it a lazy branch.
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
     * })
     *
     * <tree.Tree />
     * ```
     */
    getChildren?: (item: T) => readonly T[] | undefined

    /**
     * Returns the text used for the item's accessible name (`aria-label`), the default label, and
     * typeahead matching. Defaults to the item itself when it is a string, otherwise to its key.
     */
    getItemLabel?: (item: T) => string | undefined

    /**
     * Whether an item is disabled. Disabled items are skipped by keyboard navigation and cannot
     * be selected, checked, expanded, collapsed, or focused.
     */
    isItemDisabled?: (item: T) => boolean

    /**
     * Marks an item as a leaf, so it is never treated as a lazy branch.
     * Only relevant together with `loadChildren`.
     */
    isLeaf?: (item: T) => boolean

    /**
     * Loads the children of an item on demand. Items without children and not marked as
     * leaves become lazy branches that show an expand trigger. Expanding one waits for the
     * returned promise; the item is only recorded as expanded if it loaded and has children.
     * Concurrent loads of one item share a single call, and results are kept while the item
     * object stays the same. A rejection leaves the item collapsed and calls `onLoadChildrenError`.
     * @example
     * ```tsx
     * import { createTree } from 'moraine'
     *
     * interface Folder {
     *   path: string
     *   isFile?: boolean
     * }
     * const fetchFolder = async (path: string): Promise<Folder[]> => [{ path: `${path}/a.ts` }]
     * const tree = createTree<Folder>({
     *   items: () => [{ path: '/src' }],
     *   getKey: (folder) => folder.path,
     *   isLeaf: (folder) => folder.isFile === true,
     *   loadChildren: (folder) => fetchFolder(folder.path),
     * })
     *
     * <tree.Tree />
     * ```
     */
    loadChildren?: (item: T) => Promise<readonly T[]>

    /**
     * Called after `loadChildren` resolved for an item, with the item and its loaded children
     * (possibly empty).
     */
    onLoadChildrenSuccess?: (details: { item: T; children: readonly T[] }) => void

    /** Called when `loadChildren` rejected or threw for an item, with the item and the error. */
    onLoadChildrenError?: (details: { item: T; error: unknown }) => void

    /**
     * Keys of the expanded branches (controlled). Leave `undefined` for uncontrolled usage and
     * update it from `onExpandedKeysChange`. Options are read reactively, so pass a getter.
     * @example
     * ```tsx
     * import { createSignal } from 'solid-js'
     * import { createTree } from 'moraine'
     *
     * const [expanded, setExpanded] = createSignal<string[]>(['src'])
     * const tree = createTree<string>({
     *   items: () => ['src'],
     *   getKey: (name) => name,
     *   get expandedKeys() {
     *     return expanded()
     *   },
     *   onExpandedKeysChange: setExpanded,
     * })
     *
     * <tree.Tree />
     * ```
     */
    expandedKeys?: readonly string[]

    /**
     * Keys expanded initially (uncontrolled). Ignored while `expandedKeys` is set.
     * @default []
     */
    defaultExpandedKeys?: readonly string[]

    /**
     * Called with the full list of expanded keys whenever it changes, through user interaction,
     * tree methods, or a lazy branch that failed to load or turned out empty.
     */
    onExpandedKeysChange?: (keys: string[]) => void

    /**
     * Whether clicking a branch row also toggles it. When `false`, only the trigger toggles.
     * Modified clicks (`Ctrl`, `Meta`, `Shift`) never toggle.
     * @default true
     */
    expandOnClick?: boolean

    /**
     * How many items can be selected. `'none'` disables selection (no `aria-selected`, and
     * `Enter` toggles branches instead). `'multiple'` adds `Ctrl`/`Meta` click toggling,
     * `Shift` range selection, `Ctrl+A`, and `aria-multiselectable` on the tree.
     * @default 'single'
     */
    selectionMode?: SelectionMode

    /**
     * Keys of the selected items (controlled). Leave `undefined` for uncontrolled usage and
     * update it from `onSelectedKeysChange`. Pass a getter so changes are read reactively.
     */
    selectedKeys?: readonly string[]

    /**
     * Keys selected initially (uncontrolled). Ignored while `selectedKeys` is set.
     * @default []
     */
    defaultSelectedKeys?: readonly string[]

    /** Called with the full list of selected keys whenever it changes. */
    onSelectedKeysChange?: (keys: string[]) => void

    /**
     * Whether items expose a check state rendered with `tree.ItemCheckbox`, which renders
     * nothing otherwise. `Space` toggles the check of the focused item.
     * @default false
     */
    checkable?: boolean

    /**
     * Whether checking a branch checks its enabled descendants and derives the branch state
     * (`checked`, `unchecked`, or `indeterminate`) from them. When `false`, each key is checked
     * independently.
     * @default true
     */
    checkCascade?: boolean

    /**
     * Keys of the checked items (controlled). Leave `undefined` for uncontrolled usage and
     * update it from `onCheckedKeysChange`. Pass a getter so changes are read reactively.
     */
    checkedKeys?: readonly string[]

    /**
     * Keys checked initially (uncontrolled). Ignored while `checkedKeys` is set.
     * @default []
     */
    defaultCheckedKeys?: readonly string[]

    /**
     * Called with the full list of checked keys whenever it changes. With `checkCascade`, the
     * list contains every checked item including descendants, plus checked keys of items that
     * are not loaded yet.
     */
    onCheckedKeysChange?: (keys: string[]) => void

    /**
     * Whether typing characters moves focus to the next visible, enabled item whose text value
     * starts with them. The typed text resets after 500 ms without input.
     * @default true
     */
    typeahead?: boolean

    /**
     * Called when an item is activated with `Enter`, after `Enter` performs its normal selection
     * (or toggles the branch when `selectionMode` is `'none'`). Not called for clicks. Receives
     * the item instance.
     */
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
     * yet. Matches the keys passed to `onCheckedKeysChange`.
     */
    readonly checkedKeys: readonly string[]
    /** Key of the item that currently holds focus; `undefined` while focus is outside the tree. */
    readonly focusedKey: string | undefined
    /** Keys of branches that are loading their children. */
    readonly loadingKeys: readonly string[]
  }

  /**
   * Imperative API of a tree instance. Methods that take an item key silently do nothing for
   * unknown keys, disabled items, or changes that do not apply (such as expanding a leaf).
   */
  export interface Methods<T> {
    /** Expands a branch. A lazy branch loads its children first and expands once they arrive. */
    expand: (key: string) => void
    /** Collapses an expanded branch. */
    collapse: (key: string) => void
    /** Collapses the branch when expanded, otherwise expands it. */
    toggle: (key: string) => void
    /** Expands every enabled branch, including unloaded lazy branches, which start loading. */
    expandAll: () => void
    /** Collapses every expanded branch except disabled ones. */
    collapseAll: () => void
    /** Expands every ancestor of the item so it becomes visible. */
    expandTo: (key: string) => void
    /** Selects the item. In `'single'` mode it replaces the selection; no effect in `'none'` mode. */
    select: (key: string) => void
    /** Removes the item from the selection. */
    deselect: (key: string) => void
    /** Deselects the item when selected, otherwise selects it. */
    toggleSelect: (key: string) => void
    /** Selects every enabled loaded item. Only applies when `selectionMode` is `'multiple'`. */
    selectAll: () => void
    /** Empties the selection. */
    clearSelection: () => void
    /** Checks the item; with `checkCascade` it also checks its enabled descendants. */
    check: (key: string) => void
    /**
     * Unchecks the item and, with `checkCascade`, its enabled descendants; ancestors stop being
     * `checked`.
     */
    uncheck: (key: string) => void
    /** Unchecks the item when it is `checked`, otherwise checks it. */
    toggleCheck: (key: string) => void
    /**
     * Moves the roving tab stop and DOM focus to the item, expanding collapsed ancestors and
     * scrolling it into view. Items under a disabled collapsed ancestor are ignored.
     */
    focus: (key: string) => void
    /**
     * Returns the item instance for a key, or `undefined` when no item with that key is
     * currently in the tree. The same instance is returned for a key on every call.
     */
    getItem: (key: string) => ItemInstance<T> | undefined
    /** Whether the branch with this key is currently loading its children. Reactive. */
    isLoading: (key: string) => boolean
  }

  /**
   * Stable per-key handle that carries item data, reactive state, and actions. State fields are
   * getters, so read them inside tracking scopes (JSX, memos, effects) to stay reactive.
   */
  export interface ItemInstance<T> {
    /** Unique key returned by `getKey`. */
    readonly key: string
    /** The source item passed through `items`, `getChildren`, or `loadChildren`. */
    readonly raw: T
    /** One-based depth, matching `aria-level`. Root items are level `1`. */
    readonly level: number
    /** One-based position among its siblings, matching `aria-posinset`. */
    readonly posInSet: number
    /** Number of siblings including this item, matching `aria-setsize`. */
    readonly setSize: number
    /** Whether the item has children or is a lazy branch that has not loaded yet. */
    readonly hasChildren: boolean
    /** Whether the item has no children and cannot load any. The opposite of `hasChildren`. */
    readonly leaf: boolean
    /** Whether the item is the last among its siblings. */
    readonly lastChild: boolean
    /** Key of the parent item; `undefined` for root items. */
    readonly parentKey: string | undefined
    /** Direct children, whether or not the item is expanded. */
    readonly children: readonly ItemInstance<T>[]
    /** Text from `getItemLabel`, used as the accessible name, label, and typeahead text. */
    readonly label: string
    /** Whether the branch is expanded. */
    readonly expanded: boolean
    /** Whether the item is in the selected keys. */
    readonly selected: boolean
    /** Whether the branch is loading its children. */
    readonly loading: boolean
    /** Whether the item holds focus; always `false` while focus is outside the tree. */
    readonly focused: boolean
    /** Whether `isItemDisabled` marked the item disabled. */
    readonly disabled: boolean
    /** Check state; `'indeterminate'` only occurs on branches with `checkCascade`. */
    readonly checkedState: CheckedState
    /** Same as `tree.expand(key)` for this item. */
    expand: () => void
    /** Same as `tree.collapse(key)` for this item. */
    collapse: () => void
    /** Same as `tree.toggle(key)` for this item. */
    toggle: () => void
    /** Same as `tree.select(key)` for this item. */
    select: () => void
    /** Same as `tree.toggleSelect(key)` for this item. */
    toggleSelect: () => void
    /** Same as `tree.toggleCheck(key)` for this item. */
    toggleCheck: () => void
    /** Same as `tree.focus(key)` for this item. */
    focus: () => void
  }

  /** Item instance passed to `itemRender`, `actionRender`, and `tree.Item`'s `item` prop. */
  export type ItemRenderProps<T> = ItemInstance<T>

  /** Virtualizer over the flattened visible items, such as `createListVirtualizer()`. */
  export type Virtualizer<T = unknown> = ListT.Virtualizer<ItemInstance<T>>

  export interface Base<T = unknown> {
    /**
     * Renders one visible item. Defaults to trigger, check box when checkable, the icon
     * returned by `getItemIcon`, label, and `actionRender` actions. Receives the item instance.
     * Use `tree.Item` as the root of the rendered content; it also renders the nested children
     * of expanded branches when the tree is not virtualized.
     * @example
     * ```tsx
     * import { createTree } from 'moraine'
     *
     * const tree = createTree<string>({ items: () => ['Docs', 'Src'], getKey: (name) => name })
     *
     * <tree.Tree
     *   itemRender={(item) => (
     *     <tree.Item item={item}>
     *       <tree.ItemTrigger />
     *       <tree.ItemLabel>{item.raw.toUpperCase()}</tree.ItemLabel>
     *     </tree.Item>
     *   )}
     * />
     * ```
     */
    itemRender?: Component<ItemRenderProps<T>>

    /**
     * Renders trailing actions for each item in the default item, inside `tree.ItemAction`.
     * Receives the item instance. Ignored when `itemRender` is set; custom item content composes
     * `tree.ItemAction` directly.
     * @example
     * ```tsx
     * import { Button, createTree } from 'moraine'
     *
     * const tree = createTree<string>({ items: () => ['Docs', 'Src'], getKey: (name) => name })
     *
     * <tree.Tree
     *   actionRender={(item) => (
     *     <Button size="icon-sm" variant="ghost" leading="i-lucide:plus" aria-label={`Add to ${item.label}`} />
     *   )}
     * />
     * ```
     */
    actionRender?: Component<ItemRenderProps<T>>

    /**
     * Renders only the visible items of the flattened tree instead of nesting them. Create it
     * with `createListVirtualizer()` from `moraine/virtualizer`. The tree root is the scroll
     * container, so give it a bounded height, and keyboard focus scrolls through the virtualizer.
     * The row wiring is applied by `tree.Item`, so no extra props need spreading.
     * @example
     * ```tsx
     * import { createTree } from 'moraine'
     * import type { TreeT } from 'moraine'
     * import { createListVirtualizer } from 'moraine/virtualizer'
     *
     * const names = Array.from({ length: 10_000 }, (_, index) => `Item ${index}`)
     * const tree = createTree<string>({ items: () => names, getKey: (name) => name })
     * const virtualizer = createListVirtualizer<TreeT.ItemInstance<string>>({ estimateSize: () => 28 })
     *
     * <tree.Tree class="h-80 overflow-auto" virtualizer={virtualizer} />
     * ```
     */
    virtualizer?: Virtualizer<T>

    /**
     * Returns the prefix icon of an item in the default item content, shown before the label.
     * Not used when `itemRender` is set; render `tree.ItemIcon` there instead. Receives the item
     * instance, so the icon can follow `expanded` or `loading`. `undefined` renders no icon.
     * @example
     * ```tsx
     * import { createTree } from 'moraine'
     *
     * const tree = createTree<string>({ items: () => ['docs', 'src'], getKey: (name) => name })
     *
     * <tree.Tree
     *   aria-label="Folders"
     *   getItemIcon={(item) => (item.expanded ? 'i-lucide:folder-open' : 'i-lucide:folder')}
     * />
     * ```
     */
    getItemIcon?: (item: ItemInstance<T>) => IconT.Name | undefined

    /**
     * Icon of the expand trigger, used when `tree.ItemTrigger` has no `icon` or children of its
     * own. The recipe rotates it as the branch expands. `false` or `null` removes the trigger from
     * the default item content; an explicitly rendered `tree.ItemTrigger` then shows the default
     * chevron and still toggles.
     * @default 'icon-chevron-right'
     */
    expandIcon?: IconT.Name | false | null

    /**
     * Icon shown in the trigger instead of the expand icon while a lazy branch loads its children.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Whether collapsed branches keep their children mounted. When `false`, children mount on
     * first expansion and unmount once the branch collapses; when `true`, children mount even
     * before the first expansion.
     * @default false
     */
    forceMount?: boolean
  }

  export type Props<T = unknown> = BaseProps<'ul', Base<T>, Variants, Classes, Styles>

  export interface ItemBase<T = unknown> {
    /**
     * Item this node renders; pass the instance that `itemRender` receives. Drives the
     * `treeitem` ARIA attributes (level, position, expanded, selected, checked) and its click and
     * keyboard handling.
     */
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
    /**
     * Overrides the expand icon of this trigger. Otherwise it uses the tree's `expandIcon`, or the
     * default chevron when that is `false` or `null`. The loading icon still replaces it while the
     * branch loads.
     */
    icon?: IconT.Name
    /** Replaces the icon entirely, including the loading icon. */
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

  export type ItemIconProps = BaseProps<'span', ItemIconBase, never, never, never>

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
    /** Tree root. Renders the visible items, nested or through `virtualizer`. */
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
