import type { Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { FormValueOptions } from '../shared/form-options.ts'

import type { BaseSelectT } from './base-select.types.ts'
import type {
  SelectItem,
  SearchProps,
  ContentProps,
  SelectRow,
  SelectGroup,
  SelectEntry,
  SelectVirtualRenderProps,
} from './shared/types.ts'

export namespace MultiSelectT {
  export type Kind = 'single'

  export type Value = string | number

  export type ItemRenderState = Omit<BaseSelectT.ItemState, 'item'>
  export type ItemRenderProps<TItem extends Item = Item> = BaseSelectT.ItemState<TItem>
  export type Row<TItem extends Item = Item> = SelectRow<TItem>
  export type VirtualRenderProps<TItem extends Item = Item> = SelectVirtualRenderProps<TItem>
  export type Group<TItem extends Item = Item> = SelectGroup<TItem>
  export type Entry<TItem extends Item = Item> = SelectEntry<TItem>

  export interface ControlSlot<T = unknown> {
    /** Multi-select control that displays selected tags and opens the popup. */
    control?: T
    /** Search input used to filter or add selections. */
    input?: T
    /** Icon shown before the selected tags and search input. */
    leading?: T
    /** Button region that toggles the multi-select popup. */
    trigger?: T
    /** Button used to clear all selected values. */
    clear?: T
    /** Wrapper that lays out selected value tags inside the control. */
    tagsContainer?: T
    /** Selected value tag. */
    tag?: T
    /** Text label inside a selected value tag. */
    tagLabel?: T
    /** Button used to remove one selected value. */
    tagRemove?: T
    /** Counter shown when selected tags exceed the visible limit. */
    tagOverflow?: T
  }

  export interface ItemSlot<T = unknown> {
    /** Message shown when filtering leaves no selectable items. */
    empty?: T
    /** Leading icon inside an item row. */
    itemLeading?: T
    /** Text region containing the primary label and optional description. */
    itemLabel?: T
    /** Supporting description text inside an item row. */
    itemDescription?: T
    /** Trailing region inside an item row, usually for selection state or custom content. */
    itemTrailing?: T
  }

  export interface TagRenderProps<TItem extends Item = Item> {
    /** Selected item represented by the tag. */
    item: TItem | undefined
    /** Original selected value, including unresolved values. */
    value: TItem['value']
    /** Visual label, or String(value) when unresolved. */
    label: import('solid-js').JSX.Element
    /** Removes this item from the selection. */
    onClose: () => void
  }

  export interface EmptyRenderProps<TItem extends Item = Item> {
    /** Current input/search text. */
    inputValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected values. */
    selectedValues: readonly TItem['value'][]
    /** Whether the maximum selection count has been reached. */
    isAtMaxCount: boolean
    /** Create a new tag (requires `createItem`). Returns true if successfully created. */
    create: (value?: string) => boolean
    /** Close the dropdown menu. */
    close: () => void
  }

  export interface Slot<T = unknown> extends BaseSelectT.Slot<T>, ControlSlot<T>, ItemSlot<T> {
    /** Visual control wrapper. */
    root?: T
  }

  export interface Variant {
    /** Visual treatment of the component.
     * @default 'outline'
     */
    variant?: 'outline' | 'subtle' | 'ghost' | 'none'
    /** Visual size of the component.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'
    /** Whether the control accepts searchable input.
     * @default false
     */
    search?: boolean | null
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item<Val extends Value = Value> extends SelectItem<Val> {}

  export interface Base<TItem extends Item = Item>
    extends
      Omit<
        BaseSelectT.Base<TItem>,
        'children' | 'classes' | 'styles' | 'size' | 'items' | 'serializeValue'
      >,
      SearchProps<TItem>,
      ContentProps<TItem>,
      FormValueOptions<TItem['value'][]> {
    /** Source items, optionally grouped. */
    items?: Entry<TItem>[]
    /** Called when the selection changes. */
    onChange?: (value: NoInfer<TItem['value'][]>) => void
    /**
     * Show a clear button when a value is selected.
     * @default false
     */
    allowClear?: boolean
    /** Called when clear is triggered. */
    onClear?: () => void
    /** Characters that split input into tokens and immediately select them. */
    tokenSeparators?: string[]
    /** Factory used by every unmatched free-text creation path. */
    createItem?: (input: string) => TItem
    /** Maximum number of selected values (multiple/tags). */
    maxCount?: number
    /** Maximum visible tags before showing +N (visual only). */
    maxTagCount?: number
    /** Custom renderer for each selected tag. */
    tagRender?: ComponentOrElement<TagRenderProps<TItem>>
    /** Custom renderer for the empty state when current filtered result has no matches. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /**
     * Placeholder text shown when no value is selected.
     * @default ''
     */
    placeholder?: string
    /** Whether the select is in a loading state. */
    loading?: boolean
    /**
     * Icon shown during loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Icon shown before the input/value area. */
    leadingIcon?: IconT.Name
    /**
     * Icon used when the action button opens the dropdown.
     * @default 'icon-chevron-down'
     */
    trailingIcon?: IconT.Name
    /**
     * Icon used when the action button clears the selection.
     * Tag remove buttons keep using this icon as well.
     */
    closeIcon?: IconT.Name
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export interface MultiSelectProps<
  TItem extends MultiSelectT.Item = MultiSelectT.Item,
> extends MultiSelectT.Props<TItem> {
  ref?: Ref<HTMLDivElement>
  inputRef?: Ref<HTMLInputElement>
}
