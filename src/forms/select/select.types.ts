import type { JSX } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
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
  ContentProps,
  SelectRow,
  SelectGroup,
  SelectEntry,
  SelectVirtualRenderProps,
} from '../shared/select/types.ts'

import type { SelectStyleSlot, SelectStyleVariant } from './select.style-types'

export namespace SelectT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SelectStyleSlot<T>
  export type Variant = SelectStyleVariant
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
  export type Group<TItem extends Item = Item> = SelectGroup<TItem>
  export type Entry<TItem extends Item = Item> = SelectEntry<TItem>
  export type Row<TItem extends Item = Item> = SelectRow<TItem>
  export type VirtualRenderProps<TItem extends Item = Item> = SelectVirtualRenderProps<TItem>
  export type ItemRenderProps<TItem extends Item = Item> = BaseSelectT.ItemRenderProps<TItem>
  export interface EmptyRenderProps<TItem extends Item = Item> {
    /** Whether the collection has any selectable items. */
    hasMatches: boolean
    /** Currently selected value. */
    selectedValue: TItem['value'] | null
    /** Close the dropdown menu. */
    close: () => void
  }

  export interface Base<TItem extends Item = Item>
    extends
      BaseSelectFieldProps,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<TItem>,
      BaseSelectCloseOnSelectOption,
      BaseSelectResetProps,
      ContentProps<TItem>,
      FormValueOptions<TItem['value'] | null> {
    /** Source items, optionally grouped. Item values must be unique within the collection. */
    items?: Entry<TItem>[]
    /** Called when the selection changes. */
    onChange?: (value: NoInfer<TItem['value'] | null>) => void
    /** Custom renderer for the empty state when current filtered result has no matches. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /**
     * Placeholder text shown when no value is selected.
     * @default ''
     */
    placeholder?: string
    /** Whether the select is in a loading state. */
    loading?: boolean
    /** Show a pointer clear affordance when a value is selected. */
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
    /** Icon used by the clear affordance. */
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

export type SelectProps<TItem extends SelectT.Item = SelectT.Item> = SelectT.Props<TItem>
