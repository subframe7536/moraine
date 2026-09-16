import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { BaseSelectT } from '../base-select/base-select.types.ts'
import type { FormValueOptions } from '../shared/form-options.ts'
import type {
  SelectItem,
  SelectControlVariant,
  ContentProps,
  SelectRow,
  SelectGroup,
  SelectEntry,
  SelectItemSlot,
  SelectVirtualRenderProps,
} from '../shared/select/types.ts'

export namespace SelectT {
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
    /** Text presentation of the selected value. */
    value?: T
    /** Icon shown before the select input or value. */
    leading?: T
    /** Primary interactive button that toggles the popup. */
    trigger?: T
    /** Button used to clear the selected value. */
    clear?: T
  }

  export interface ItemSlot<T = unknown> extends SelectItemSlot<T> {}

  export interface EmptyRenderProps<TItem extends Item = Item> {
    /** Whether the collection has any selectable items. */
    hasMatches: boolean
    /** Currently selected value. */
    selectedValue: TItem['value'] | null
    /** Close the dropdown menu. */
    close: () => void
  }

  export interface Slot<T = unknown> extends BaseSelectT.Slot<T>, ControlSlot<T>, ItemSlot<T> {}
  export interface Variant extends SelectControlVariant {}

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item<Val extends Value = Value> extends SelectItem<Val> {}

  export interface Base<TItem extends Item = Item>
    extends
      BaseSelectT.FieldProps,
      BaseSelectT.DisclosureProps,
      BaseSelectT.ItemBehaviorProps<TItem>,
      BaseSelectT.CloseOnSelectOption,
      BaseSelectT.ResetProps,
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

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export type SelectProps<TItem extends SelectT.Item = SelectT.Item> = SelectT.Props<TItem>
