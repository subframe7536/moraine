import type { Component, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options'

import type { BaseSelectT } from './base-select.types.ts'
import type {
  SelectItem,
  SearchProps,
  ContentProps,
  SelectVirtualEntry,
  SelectVirtualRenderProps,
} from './shared/types.ts'

export namespace SelectT {
  export type Kind = 'single'

  export type Value = string | number

  export type ItemRenderState = Omit<BaseSelectT.ItemState, 'item'>
  export type ItemRenderProps<TValue extends Value = Value> = BaseSelectT.ItemState<Item<TValue>>
  export type VirtualEntry<TValue extends Value = Value> = SelectVirtualEntry<Item<TValue>>
  export type VirtualRenderProps<TValue extends Value = Value> = SelectVirtualRenderProps<
    Item<TValue>
  >
  export type Group<TValue extends Value = Value> = BaseSelectT.Group<Item<TValue>>
  export type Entry<TValue extends Value = Value> = BaseSelectT.Entry<Item<TValue>>

  export interface ControlSlot<T = unknown> {
    /** Closed select control that displays the current value and opens the popup. */
    control?: T
    /** Search input or value text field inside the control. */
    input?: T
    /** Icon shown before the select input or value. */
    leading?: T
    /** Button region that toggles the select popup. */
    trigger?: T
    /** Button used to clear the selected value. */
    clear?: T
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

  export interface EmptyRenderProps<TItem extends Value = Value> {
    /** Current input/search text. */
    inputValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected value. */
    selectedValue: TItem | null
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

  export interface Base<TItem extends Value = Value>
    extends
      Omit<BaseSelectT.Base<Item<TItem>>, 'children' | 'classes' | 'styles' | 'size'>,
      SearchProps<Item<TItem>>,
      ContentProps<Item<TItem>>,
      FormIdentityOptions,
      FormValueOptions<TItem | null>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /** Called when the selection changes. */
    onChange?: (value: NoInfer<TItem | null>) => void
    /** Renders flattened group labels and items through a virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted item into view using its flattened entry index. */
    scrollToItem?: (item: Item<TItem>, entryIndex: number) => void
    /** Custom renderer for the empty state when current filtered result has no matches. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /**
     * Placeholder text shown when no value is selected.
     * @default ''
     */
    placeholder?: string
    /** Whether the select is in a loading state. */
    loading?: boolean
    /** Show a clear button when a value is selected. */
    allowClear?: boolean
    /** Called when clear is triggered. */
    onClear?: () => void
    /**
     * Icon shown during loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Icon shown before the input/value area. */
    leadingIcon?: IconT.Name
    /**
     * Icon for the dropdown trigger.
     * @default 'icon-chevron-down'
     */
    trailingIcon?: IconT.Name
    /** Icon used when the action button clears the selection. */
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

export interface SelectProps<
  TItem extends SelectT.Value = SelectT.Value,
> extends SelectT.Props<TItem> {
  ref?: Ref<HTMLDivElement>
  inputRef?: Ref<HTMLInputElement>
}
