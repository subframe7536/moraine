import type { Component, JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ListT } from '../../elements/list/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export namespace CommandPaletteT {
  export type DescriptionPosition = 'bottom' | 'trailing'

  export interface Slot<T = unknown> {
    /**
     * Command palette container that owns search and option list.
     */
    root?: T

    /** Search row that groups input, search icon, and dismiss controls. */
    inputWrapper?: T

    /** Search input used to filter commands. */
    input?: T

    /** Scrollable command list that owns option and active-descendant semantics. */
    listbox?: T

    /** Bottom region for keyboard hints or custom footer content. */
    footer?: T

    /** Section wrapper for a group of command items. */
    group?: T

    /** Group heading text. */
    label?: T

    /** Command row that can be highlighted, selected, or disabled. */
    item?: T

    /** Leading region for a command row. */
    itemLeading?: T

    /** Text column that groups command label and description. */
    itemWrapper?: T

    /** Primary text for a command item. */
    itemLabel?: T

    /** Supporting text for a command item. */
    itemDescription?: T

    /** Trailing region for shortcuts or custom item metadata. */
    itemTrailing?: T

    /** Search icon or loading indicator displayed in the input row. */
    search?: T

    /** Button that dismisses the command palette. */
    close?: T

    /** Message shown when no command items match the search. */
    empty?: T
  }

  export interface Variant {}
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Group<TItem extends Item = Item> {
    /** Unique identifier for the group. */
    id: string
    /** Display name for the group header. */
    label?: string
    /** Items belonging to this group. */
    items?: TItem[]
  }

  export interface Item {
    /** Unique value for the item. */
    value: string
    /** Primary label for the item. */
    label?: string
    /** Secondary description text shown for the item. */
    description?: string
    /** Additional keywords included in built-in search matching. */
    keywords?: string[]
    /** Where the item description is rendered. Overrides the root setting. */
    descriptionPosition?: DescriptionPosition
    /** Custom visual rendered at the start of the item. */
    leadingRender?: ComponentOrElement<ItemRenderProps>
    /** Custom visual rendered at the end of the item. */
    trailingRender?: ComponentOrElement<ItemRenderProps>
    /** Whether the item is disabled and cannot be selected. */
    disabled?: boolean
    /** Whether this item should be excluded from built-in search filtering. */
    alwaysShow?: boolean
    /** Callback triggered when the item is selected. */
    onSelect?: () => void
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
    HTMLDivElement,
    HTMLDivElement
  >

  export interface BaseContext<TItem extends Item = Item> {
    searchTerm: string
    loading: boolean
    hasItems: boolean
    groups: Group<TItem>[]
    visibleGroups: Group<TItem>[]
  }

  export interface ItemRenderProps<TItem extends Item = Item> extends BaseContext<TItem> {
    item: TItem
    group: Group<TItem>
    focused: boolean
    active: boolean
    /** Whether the item is currently active. */
    selected: boolean
    disabled: boolean
  }

  export type EmptyRenderProps<TItem extends Item = Item> = BaseContext<TItem>
  export type FooterRenderProps<TItem extends Item = Item> = BaseContext<TItem>

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
     * @default 'Search...'
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
    /**
     * Where descriptions render by default.
     * @default 'bottom'
     */
    descriptionPosition?: DescriptionPosition
    /** Custom empty state renderer. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /** Custom footer renderer. */
    footerRender?: ComponentOrElement<FooterRenderProps<TItem>>
    /** Custom command row content renderer. */
    itemRender?: ComponentOrElement<ItemRenderProps<TItem>>
    /** Renders flattened group labels and commands through a virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted command into view using its flattened entry index. */
    scrollToItem?: (item: TItem, entryIndex: number) => void
    /** Additional attributes for the command listbox. */
    listboxProps?: ElementProps<HTMLDivElement>
    /** Additional attributes for a command row. */
    itemProps?: (context: ItemRenderProps<TItem>) => ElementProps<HTMLDivElement> | undefined
    /** Additional props of input */
    inputProps?: JSX.HTMLAttributes<HTMLInputElement>
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export interface CommandPaletteProps<
  TItem extends CommandPaletteT.Item = CommandPaletteT.Item,
> extends CommandPaletteT.Props<TItem> {}
