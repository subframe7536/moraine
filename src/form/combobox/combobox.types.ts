import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../element/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  BaseSelectCloseOnSelectOption,
  BaseSelectDisclosureProps,
  BaseSelectFieldProps,
  BaseSelectItemBehaviorProps,
  BaseSelectResetProps,
  BaseSelectT,
} from '../base-select/base-select.types.ts'
import type { FormValueOptions } from '../shared/form-options.types.ts'
import type {
  NormalizedSelectItem,
  ContentProps,
  SearchProps,
  SelectEntry,
  SelectGroup,
  SelectRow,
  SelectVirtualRenderProps,
} from '../shared/select/types.ts'

import type { ComboboxStyleSlot, ComboboxStyleVariant } from './combobox.style-types'

export namespace ComboboxT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ComboboxStyleSlot<T>
  export type Variant = ComboboxStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item<
    Val extends string | number = string | number,
  > extends BaseSelectT.Item<Val> {
    /** Leading item icon. */
    icon?: IconT.Name
    /** Secondary item description. */
    description?: JSX.Element
  }
  export type NormalizedItem<T extends string | Item> = NormalizedSelectItem<T>
  export type Group<TItem extends string | Item = string | Item> = SelectGroup<TItem>
  export type Entry<TItem extends string | Item = string | Item> = SelectEntry<TItem>
  export type Row<TItem extends string | Item = string | Item> = SelectRow<NormalizedItem<TItem>>
  export type VirtualRenderProps<TItem extends string | Item = string | Item> =
    SelectVirtualRenderProps<NormalizedItem<TItem>>
  export type ItemRenderProps<TItem extends string | Item = string | Item> =
    BaseSelectT.ItemRenderProps<NormalizedItem<TItem>>
  export interface EmptyRenderProps<TItem extends string | Item = string | Item> {
    /** Current query text. */
    inputValue: string
    /** Whether the filtered collection has matches. */
    hasMatches: boolean
    /** Currently selected value. */
    selectedValue: NormalizedItem<TItem>['value'] | null
    /** Close the popup. */
    close: () => void
  }
  export interface Base<TItem extends string | Item = string | Item>
    extends
      BaseSelectFieldProps,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<NormalizedItem<TItem>>,
      BaseSelectCloseOnSelectOption,
      BaseSelectResetProps,
      SearchProps<NormalizedItem<TItem>>,
      ContentProps<NormalizedItem<TItem>>,
      FormValueOptions<NormalizedItem<TItem>['value'] | null> {
    /** String shorthand or object items, optionally grouped. Item values must be unique. */
    items?: Entry<TItem>[]
    /** Called when the committed selection changes. */
    onChange?: (value: NoInfer<NormalizedItem<TItem>['value'] | null>) => void
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
    /**
     * Whether ordinary control/input pointer clicks open the popup.
     * @default false
     */
    openOnControlClick?: boolean
    /** Optional inner input element ref. */
    inputRef?: Ref<HTMLInputElement>
    /**
     * Loading icon.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Leading icon. */
    leadingIcon?: IconT.Name
    /**
     * Popup toggle icon.
     * @default 'icon-chevron-down'
     */
    trailingIcon?: IconT.Name
    /**
     * Clear icon.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name
  }
  export type Props<TItem extends string | Item = string | Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export type ComboboxProps<TItem extends string | ComboboxT.Item = string | ComboboxT.Item> =
  ComboboxT.Props<TItem>
