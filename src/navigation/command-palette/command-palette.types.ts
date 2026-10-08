import type { Component, JSX, Ref } from 'solid-js'

import type { IconT } from '../../element/icon'
import type { ListT } from '../../element/list'
import type { BaseProps, ElementProps, InputElementProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type {
  CommandPaletteStyleSlot,
  CommandPaletteStyleVariant,
} from './command-palette.style-types'

interface CommandPaletteBaseRenderProps<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> {
  searchTerm: string
  loading: boolean
  hasItems: boolean
  groups: CommandPaletteT.Group<TItem>[]
  visibleGroups: CommandPaletteT.Group<TItem>[]
}

export namespace CommandPaletteT {
  export type Kind = 'single'
  export type Slot<T = unknown> = CommandPaletteStyleSlot<T>

  export type Variant = CommandPaletteStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {
    /** Unique value for the item. */
    value: string
    /** Primary label for the item. */
    label?: string
    /** Secondary description text shown for the item. */
    description?: string
    /** Additional keywords included in built-in search matching. */
    keywords?: string[]
    /** Content or render function at the start of this item. */
    leadingRender?: JSX.Element | ((props: ItemRenderProps) => JSX.Element)
    /** Content or render function at the end of this item. */
    trailingRender?: JSX.Element | ((props: ItemRenderProps) => JSX.Element)
    /** Whether the item is disabled and cannot be selected. */
    disabled?: boolean
    /** Whether this item should be excluded from built-in search filtering. */
    alwaysShow?: boolean
    /** Callback triggered when the item is selected. */
    onSelect?: () => void
  }

  export interface Group<TItem extends Item = Item> {
    /** Unique identifier for the group. */
    id: string
    /** Display name for the group header. */
    label?: string
    /** Items belonging to this group. */
    items?: TItem[]
  }

  export interface VirtualLabelEntry<TItem extends Item = Item> {
    /** Structural entry rendered before a command group. */
    type: 'label'
    /** Stable key used by a virtualizer. */
    key: string
    /** Visible group label. */
    label: string
    /** Source group containing the command. */
    group: Group<TItem>
  }

  export interface VirtualItemEntry<TItem extends Item = Item> {
    /** Selectable command entry. */
    type: 'item'
    /** Stable normalized command key. */
    key: string
    /** Source command. */
    item: TItem
    /** Source group containing the command. */
    group: Group<TItem>
    /** Whether the command cannot be selected. */
    disabled: boolean
  }

  export type VirtualEntry<TItem extends Item = Item> =
    | VirtualLabelEntry<TItem>
    | VirtualItemEntry<TItem>

  export type VirtualRenderProps<TItem extends Item = Item> = ListT.VirtualRenderProps<
    VirtualEntry<TItem>,
    HTMLElement,
    HTMLDivElement
  >

  export interface ItemRenderProps<
    TItem extends Item = Item,
  > extends CommandPaletteBaseRenderProps<TItem> {
    item: TItem
    group: Group<TItem>
    /** Whether the item is currently highlighted. */
    highlighted: boolean
    disabled: boolean
  }

  export type EmptyRenderProps<TItem extends Item = Item> = CommandPaletteBaseRenderProps<TItem>
  export type FooterRenderProps<TItem extends Item = Item> = CommandPaletteBaseRenderProps<TItem>

  export interface Base<TItem extends Item = Item> {
    /** Ref forwarded to the root `<div>` element. */
    ref?: Ref<HTMLDivElement>
    /** Ref forwarded to the inner search `<input>` element. */
    inputRef?: Ref<HTMLInputElement>
    /**
     * Command groups to display initially.
     * @default []
     */
    groups?: Group<TItem>[]
    /**
     * Placeholder text for the search input.
     * Localized via MoraineProvider messages. English default is `Search...`.
     */
    placeholder?: string
    /** Controlled search term. */
    searchTerm?: string
    /** Callback triggered when the search term changes. */
    onSearchTermChange?: (term: string) => void
    /** Callback triggered when an enabled item is selected. */
    onSelect?: (item: TItem) => void
    /** Maximum allowed length for the search text. */
    searchMaxLength?: number
    /**
     * Whether to focus the search input automatically on mount.
     * @default true
     */
    autofocus?: boolean
    /**
     * Icon name of input's leading icon.
     * @default 'icon-search'
     */
    leadingIcon?: IconT.Name
    /**
     * Icon name of input's leading icon for the loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /**
     * Icon name for the palette close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name
    /**
     * Whether to show a close button in the header.
     * @default false
     */
    showClose?: boolean
    /** Callback triggered when the close button is clicked or selection requests closing. */
    onClose?: () => void
    /**
     * Whether to request closing the palette after an enabled item is selected.
     * @default true
     */
    closeOnSelect?: boolean
    /**
     * Whether the palette is in a loading state.
     * @default false
     */
    loading?: boolean
    /**
     * Disable built-in search filtering and render all provided items.
     * @default false
     */
    disableFilter?: boolean
    /** Custom search text builder for built-in filtering. */
    getItemSearchText?: (item: TItem, group: Group<TItem>) => string
    /** Custom filter function that fully controls which groups and items are visible. */
    filterItems?: (args: { groups: Group<TItem>[]; searchTerm: string }) => Group<TItem>[]
    /** Content or render function for the empty state. */
    emptyRender?: JSX.Element | ((props: EmptyRenderProps<TItem>) => JSX.Element)
    /** Content or render function for the footer. */
    footerRender?: JSX.Element | ((props: FooterRenderProps<TItem>) => JSX.Element)
    /** Renderer for each command row. */
    itemRender?: (props: ItemRenderProps<TItem>) => JSX.Element
    /** Renders flattened group labels and commands through a virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted command into view using its flattened entry index. */
    scrollToItem?: (item: TItem, entryIndex: number) => void
    /** Additional attributes for the command listbox. */
    listboxProps?: Omit<ElementProps<HTMLDivElement>, 'children'>
    /** Additional attributes for a command row. */
    itemProps?: (context: ItemRenderProps<TItem>) => ElementProps<HTMLDivElement> | undefined
    /** Additional attributes for the search input. */
    inputProps?: InputElementProps
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export type CommandPaletteProps<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> =
  CommandPaletteT.Props<TItem>
