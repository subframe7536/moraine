import type { Component, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

import type { BaseSelectT } from './base-select.tsx'

export namespace MultiSelectT {
  export type Value = string | number

  export type OptionRenderState = BaseSelectT.OptionRenderState
  export type VirtualEntry<TItem extends Value = Value> = BaseSelectT.VirtualEntry<Item<TItem>>
  export type VirtualRenderProps<TItem extends Value = Value> = BaseSelectT.VirtualRenderProps<
    Item<TItem>
  >

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
    /** Button used to remove one selected value. */
    tagRemove?: T
    /** Counter shown when selected tags exceed the visible limit. */
    tagOverflow?: T
  }

  export interface OptionSlot<T = unknown> {
    /** Message shown when filtering leaves no selectable options. */
    empty?: T
    /** Primary label text inside an option row. */
    itemLabel?: T
    /** Supporting description text inside an option row. */
    itemDescription?: T
    /** Trailing region inside an option row, usually for selection state or custom content. */
    itemTrailing?: T
  }

  export interface OptionRenderProps<TItem extends Value = Value> {
    /** Option and interaction state, or null when no option matches. */
    option: (Item<TItem> & OptionRenderState) | null
  }

  export interface LabelRenderProps<TItem extends Value = Value> {
    /** Option whose label is being rendered. */
    option: Item<TItem>
  }

  export interface TagRenderProps<TItem extends Value = Value> {
    /** Selected option represented by the tag. */
    option: Item<TItem>
    /** Removes this option from the selection. */
    onClose: () => void
  }

  export interface EmptyRenderProps<TItem extends Value = Value> {
    /** Current input/search text. */
    inputValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected values. */
    selectedValues: TItem[]
    /** Whether the maximum selection count has been reached. */
    isAtMaxCount: boolean
    /** Create a new tag (requires `allowCreate`). Returns true if successfully created. */
    create: (value?: string) => boolean
    /** Close the dropdown menu. */
    close: () => void
  }

  export interface Slot<T = unknown> extends BaseSelectT.Slot<T>, ControlSlot<T>, OptionSlot<T> {}

  export interface Variant {
    variant?: 'outline' | 'subtle' | 'ghost' | 'none' | null
    size?: 'sm' | 'md' | 'lg' | null
    search?: boolean | 'true' | 'false' | null
    side?: 'top' | 'right' | 'bottom' | 'left' | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item<Val extends Value = Value> extends BaseSelectT.Item<Val> {}

  export interface Base<TItem extends Value = Value>
    extends
      Omit<
        BaseSelectT.Base<Item<TItem>>,
        | 'children'
        | 'closeOnSelect'
        | 'emptyRender'
        | 'initialValue'
        | 'onInputKeyDown'
        | '_onFormReset'
        | '_isValueControlled'
        | 'onOptionSelect'
        | 'optionRender'
        | 'selectedValues'
        | 'multiple'
        | 'tabSelectionBehavior'
        | 'virtualRender'
        | 'scrollToItem'
        | '_defaultSize'
        | '_recipe'
        | '_provider'
        | '_design'
        | '_styleInputs'
      >,
      FormIdentityOptions,
      FormValueOptions<TItem[]>,
      FormRequiredOption,
      FormDisableOption {
    /** Called when the selection changes. */
    onChange?: (value: NoInfer<TItem[]>) => void
    /** Renders flattened group labels and options through a virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted option into view using its flattened entry index. */
    scrollToItem?: (item: Item<TItem>, entryIndex: number) => void
    /**
     * Show a clear button when a value is selected.
     * @default false
     */
    allowClear?: boolean
    /** Called when clear is triggered. */
    onClear?: () => void
    /** Characters that split input into tokens and immediately select them. */
    tokenSeparators?: string[]
    /** Allow creating new tags on Enter when no match is found. */
    allowCreate?: boolean
    /** Maximum number of selected values (multiple/tags). */
    maxCount?: number
    /** Maximum visible tags before showing +N (visual only). */
    maxTagCount?: number
    /** Custom renderer for each option in the dropdown. Passes `null` for empty state. */
    optionRender?: ComponentOrElement<OptionRenderProps<TItem>>
    /** Custom renderer for each selected tag (multiple/tags). */
    tagRender?: ComponentOrElement<TagRenderProps<TItem>>
    /** Custom renderer for the option label text. */
    labelRender?: ComponentOrElement<LabelRenderProps<TItem>>
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

  export type Props<TItem extends Value = Value> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export interface MultiSelectProps<
  TItem extends MultiSelectT.Value = MultiSelectT.Value,
> extends MultiSelectT.Props<TItem> {
  ref?: Ref<HTMLDivElement>
  inputRef?: Ref<HTMLInputElement>
}
