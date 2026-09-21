import type { Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  BaseSelectDisclosureProps,
  BaseSelectFieldProps,
  BaseSelectItemBehaviorProps,
  BaseSelectResetProps,
  BaseSelectT,
} from '../base-select/base-select.types.ts'
import type { FormValueOptions } from '../shared/form-options.ts'
import type {
  SelectItem,
  SearchProps,
  ContentProps,
  SelectRow,
  SelectGroup,
  SelectEntry,
  SelectVirtualRenderProps,
} from '../shared/select/types.ts'

import type { MultiSelectStyleSlot, MultiSelectStyleVariant } from './multi-select.style-types'

export namespace MultiSelectT {
  export type Kind = 'single'
  export type Slot<T = unknown> = MultiSelectStyleSlot<T>
  export type Variant = MultiSelectStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item<Val extends string | number = string | number> extends SelectItem<Val> {}
  export type Group<TItem extends Item = Item> = SelectGroup<TItem>
  export type Entry<TItem extends Item = Item> = SelectEntry<TItem>
  export type Row<TItem extends Item = Item> = SelectRow<TItem>
  export type VirtualRenderProps<TItem extends Item = Item> = SelectVirtualRenderProps<TItem>
  export type ItemRenderProps<TItem extends Item = Item> = BaseSelectT.ItemRenderProps<TItem>

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

  export type TagOverflowEntry<TItem extends Item = Item> = Pick<
    TagRenderProps<TItem>,
    'item' | 'value' | 'label'
  >

  export interface TagOverflowRenderProps<TItem extends Item = Item> {
    /** Number of selected tags hidden by `maxTagCount`. */
    count: number
    /** Hidden tags in selection order. */
    tags: readonly TagOverflowEntry<TItem>[]
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

  export interface Base<TItem extends Item = Item>
    extends
      BaseSelectFieldProps,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<TItem>,
      BaseSelectResetProps,
      SearchProps<TItem>,
      ContentProps<TItem>,
      FormValueOptions<TItem['value'][]> {
    /** Source items, optionally grouped. Item values must be unique within the collection. */
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
    /**
     * Factory used for unmatched free-text creation.
     * Providing it also enables the editable search input.
     */
    createItem?: (input: string) => TItem
    /** Maximum number of selected values (multiple/tags). */
    maxCount?: number
    /** Maximum visible tags before collapsing the remainder into a +N summary. */
    maxTagCount?: number
    /**
     * Strings that commit completed input tokens through `createItem` or an exact source match.
     * Duplicate separators are ignored and overlapping separators prefer the longest match.
     * @default [',']
     */
    tokenSeparators?: string[]
    /** Custom renderer for each selected tag. */
    tagRender?: ComponentOrElement<TagRenderProps<TItem>>
    /** Custom renderer for tags hidden by `maxTagCount`. */
    tagOverflow?: ComponentOrElement<TagOverflowRenderProps<TItem>>
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
    /**
     * Whether ordinary control/input pointer clicks open the popup.
     * Defaults to `false` when editable (`search` or `createItem` enabled),
     * or `true` when non-editable.
     */
    openOnControlClick?: boolean
    /**
     * Whether the collection can be filtered through the editable input.
     * @default false
     */
    search?: boolean
    /** Optional editable inner input element ref. Not assigned in non-editable mode. */
    inputRef?: Ref<HTMLInputElement>
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export type MultiSelectProps<TItem extends MultiSelectT.Item = MultiSelectT.Item> =
  MultiSelectT.Props<TItem>
