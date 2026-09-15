import type { Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { FormValueOptions } from '../shared/form-options.ts'

import type { BaseSelectT } from './base-select.types.ts'
import type {
  ContentProps,
  SearchProps,
  SelectEntry,
  SelectGroup,
  SelectItem,
  SelectRow,
  SelectVirtualRenderProps,
} from './shared/types.ts'

export namespace ComboboxT {
  export type Kind = 'single'
  export type Value = string | number
  export type ItemRenderState = Omit<BaseSelectT.ItemState, 'item'>
  export type ItemRenderProps<TItem extends Item = Item> = BaseSelectT.ItemState<TItem>
  export type Row<TItem extends Item = Item> = SelectRow<TItem>
  export type VirtualRenderProps<TItem extends Item = Item> = SelectVirtualRenderProps<TItem>
  export type Group<TItem extends Item = Item> = SelectGroup<TItem>
  export type Entry<TItem extends Item = Item> = SelectEntry<TItem>

  export interface ControlSlot<T = unknown> {
    /** Outer visual field and floating anchor. */
    control?: T
    /** Icon shown before the editable input. */
    leading?: T
    /** Editable query input and authoritative combobox focus owner. */
    input?: T
    /** Button used to clear the selected value and query. */
    clear?: T
    /** Secondary button that toggles the popup. */
    trigger?: T
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
    /** Trailing region inside an item row. */
    itemTrailing?: T
  }
  export interface EmptyRenderProps<TItem extends Item = Item> {
    /** Current query text. */
    inputValue: string
    /** Whether the filtered collection has matches. */
    hasMatches: boolean
    /** Currently selected value. */
    selectedValue: TItem['value'] | null
    /** Close the popup. */
    close: () => void
  }
  export interface Slot<T = unknown> extends BaseSelectT.Slot<T>, ControlSlot<T>, ItemSlot<T> {}
  export interface Variant {
    /** Visual treatment of the component. @default 'outline' */
    variant?: 'outline' | 'subtle' | 'ghost' | 'none'
    /** Visual size of the component. @default 'md' */
    size?: 'sm' | 'md' | 'lg'
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
      FormValueOptions<TItem['value'] | null> {
    /** Source items, optionally grouped. Item values must be unique. */
    items?: Entry<TItem>[]
    /** Called when the committed selection changes. */
    onChange?: (value: NoInfer<TItem['value'] | null>) => void
    /** Custom renderer for the filtered empty state. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /** Placeholder shown when there is no selected value or query. */
    placeholder?: string
    /** Whether the control is loading. */
    loading?: boolean
    /** Show a clear action when a value or query exists. */
    allowClear?: boolean
    /** Called once when clear is triggered. */
    onClear?: () => void
    /** Whether ordinary control/input pointer clicks open the popup. @default true */
    openOnControlClick?: boolean
    /** Loading icon. @default 'icon-loading' */
    loadingIcon?: IconT.Name
    /** Leading icon. */
    leadingIcon?: IconT.Name
    /** Popup toggle icon. @default 'icon-chevron-down' */
    trailingIcon?: IconT.Name
    /** Clear icon. @default 'icon-close' */
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

export interface ComboboxProps<
  TItem extends ComboboxT.Item = ComboboxT.Item,
> extends ComboboxT.Props<TItem> {
  ref?: Ref<HTMLDivElement>
  inputRef?: Ref<HTMLInputElement>
}
