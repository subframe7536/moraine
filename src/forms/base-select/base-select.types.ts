import type { JSX } from 'solid-js'

import type { ModalT } from '../../overlays/modal/modal.types.ts'
import type {
  ElementProps,
  SlotClassValue,
  SlotStyleValue,
  ValidComponent,
} from '../../shared/types.ts'
import type {
  FormIdentityOptions,
  FormDisableOption,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'

import type { BaseSelectStyleSlot, BaseSelectStyleVariant } from './base-select.style-types'

export namespace BaseSelectT {
  export type Kind = 'composite'
  export type Value = string | number
  export interface Item<TValue extends Value = Value> {
    /** Unique selection and form value. */
    value: TValue
    /** Visual label. */
    label: JSX.Element
    /** Whether this item cannot be selected. */
    disabled?: boolean
  }
  export type ItemValue<TItem extends Item> = TItem['value']
  export type Slot<T = unknown> = BaseSelectStyleSlot<T>
  export type Variant = BaseSelectStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Form identity and state forwarded to the selection machine. */
  export interface FieldProps
    extends FormIdentityOptions, FormDisableOption, FormReadOnlyOption, FormRequiredOption {}
  /** Controlled and uncontrolled popup state. */
  export interface DisclosureProps {
    /** Controlled popup state. */
    open?: boolean

    /**
     * Initial popup state.
     * @default false
     */
    defaultOpen?: boolean

    /** Called when popup state changes. */
    onOpenChange?: (open: boolean) => void
  }
  /** Item policies used by navigation, filtering, and selection. */
  export interface ItemBehaviorProps<TItem extends Item> {
    /** Machine-readable text for matching; does not change visual labels. */
    itemToLabelString?: (item: TItem) => string

    /** Additional disabled policy evaluated against the current selection. */
    isItemDisabled?: (item: TItem, values: readonly TItem['value'][]) => boolean
  }
  /** Selection behavior that visual single-value wrappers may forward. */
  export interface CloseOnSelectOption {
    /** Close after selection. Defaults to true for single, false for multiple. */
    closeOnSelect?: boolean
  }
  /** Reset notification forwarded by higher-level collection controls. */
  export interface ResetProps {
    /** Post-reset notification after an unprevented native form reset. */
    onReset?: () => void
  }
  export interface Base<TItem extends Item>
    extends
      FieldProps,
      DisclosureProps,
      ItemBehaviorProps<TItem>,
      CloseOnSelectOption,
      ResetProps,
      Variant {
    /** Current flat navigation collection. */
    items?: readonly TItem[]
    /**
     * Whether arrow-key navigation wraps from the ends.
     * @default true
     */
    loop?: boolean
    /** Native form value; return undefined to omit a selected value from submission. */
    serializeValue?: (value: TItem['value']) => string | undefined
    /** Family slot class defaults for this BaseSelect instance. */
    classes?: Classes
    /** Family slot style defaults for this BaseSelect instance. */
    styles?: Styles
    /** Composed trigger and popup parts. */
    children?: JSX.Element
  }
  export interface Selection<TValue extends Value> {
    /** Whether selecting an item toggles multiple values. */
    multiple?: boolean
    /** Controlled selection. Single mode uses at most the first value. */
    value?: readonly TValue[]
    /**
     * Initial selection.
     * @default []
     */
    defaultValue?: readonly TValue[]
    /** Called when selection changes. */
    onChange?: (value: TValue[]) => void
  }
  export type Props<TItem extends Item = Item> = Base<TItem> & Selection<ItemValue<TItem>>
  export interface TriggerState<TItem extends Item = Item> {
    /** Whether the popup is open. */
    open: boolean
    /** Current selected value or values. */
    value: readonly ItemValue<TItem>[]
    /** Whether the control is disabled. */
    disabled: boolean
    /** Whether selection is read-only. */
    readOnly: boolean
  }
  export type TriggerProps<T extends ValidComponent = 'button', TItem extends Item = Item> = Omit<
    ModalT.TriggerProps<T>,
    'children'
  > & {
    /** Label or reactive presentation function. */
    children?: JSX.Element | ((state: TriggerState<TItem>) => JSX.Element)
  }
  export interface ItemState<TItem extends Item = Item> {
    /** Canonical raw item. */
    item: TItem
    /** Whether selected. */
    selected: boolean
    /** Whether highlighted. */
    highlighted: boolean
    /** Whether disabled. */
    disabled: boolean
  }
  export type PartProps = ElementProps<HTMLDivElement>
  export type ControlProps = PartProps
  export type ContentProps = PartProps & {
    /** Called once after an open popup completes its exit. */
    onExitComplete?: () => void
    /**
     * Gap between anchor and popup.
     * @default 0
     */
    gutter?: number
    /**
     * Viewport collision padding.
     * @default 4
     */
    overflowPadding?: number
  }
  export type ItemProps<TItem extends Item = Item> = Omit<PartProps, 'children'> & {
    /** Raw item belonging to the current navigation collection. */
    item: TItem
    /** Visual content or reactive row presentation. */
    children?: JSX.Element | ((state: ItemState<TItem>) => JSX.Element)
  }
}
export type BaseSelectProps<TItem extends BaseSelectT.Item = BaseSelectT.Item> =
  BaseSelectT.Props<TItem>
