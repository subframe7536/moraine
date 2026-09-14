import type { JSX, ValidComponent } from 'solid-js'

import type { ModalT } from '../../overlays/modal/modal.types.ts'
import type { SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormIdentityOptions,
  FormDisableOption,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'

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
  export interface Group<TItem extends Item> {
    /** Identifies a structural group. Reserved for groups. */
    type: 'group'
    /** Group heading. */
    label: JSX.Element
    /** One level of leaf items. */
    items: TItem[]
  }
  export type Entry<TItem extends Item> = TItem | Group<TItem>
  export interface Slot<T = unknown> {
    /** Floating popup panel. */
    content?: T
    /** Scrollable listbox. */
    listbox?: T
    /** Selectable row. */
    item?: T
    /** Group container. */
    group?: T
    /** Group heading. */
    groupLabel?: T
    /** Decorative divider. */
    separator?: T
    /** Empty collection message. */
    empty?: T
  }
  export interface Variant {
    /** Popup and item size. @default 'md' */
    size?: 'sm' | 'md' | 'lg'
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Base<TItem extends Item>
    extends
      FormIdentityOptions,
      FormDisableOption,
      FormReadOnlyOption,
      FormRequiredOption,
      Variant {
    /** Complete canonical collection, including currently hidden items. */
    items?: Entry<TItem>[]
    /** Machine-readable text for matching; does not change visual labels. */
    itemToLabelString?: (item: TItem) => string
    /** Controlled popup state. */
    open?: boolean
    /** Initial popup state. @default false */
    defaultOpen?: boolean
    /** Called when popup state changes. */
    onOpenChange?: (open: boolean) => void
    /** Close after selection. Defaults to true for single, false for multiple. */
    closeOnSelect?: boolean
    /** Classes for popup parts. */
    classes?: Classes
    /** Styles for popup parts. */
    styles?: Styles
    /** Composed trigger and popup parts. */
    children?: JSX.Element
  }
  export type Selection<TValue extends Value> =
    | {
        /** Single selection mode. */
        multiple?: false
        /** Controlled value. */
        value?: TValue | null
        /** Initial value. @default null */
        defaultValue?: TValue | null
        /** Called when the selection changes. */
        onChange?: (value: TValue | null) => void
      }
    | {
        /** Multiple selection mode. */
        multiple: true
        /** Controlled values. */
        value?: TValue[]
        /** Initial values. @default [] */
        defaultValue?: TValue[]
        /** Called when the selection changes. */
        onChange?: (value: TValue[]) => void
      }
  export type Props<TItem extends Item = Item> = Base<TItem> & Selection<ItemValue<TItem>>
  export interface TriggerState<TItem extends Item = Item> {
    /** Whether the popup is open. */
    open: boolean
    /** Current selected value or values. */
    value: ItemValue<TItem> | ItemValue<TItem>[] | null
    /** Canonical raw selected items, preserving consumer fields. */
    selectedItems: TItem[]
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
  export type PartProps = JSX.HTMLAttributes<HTMLDivElement>
  export type ContentProps = PartProps & {
    /** Gap between anchor and popup. @default 0 */
    gutter?: number
    /** Viewport collision padding. @default 4 */
    overflowPadding?: number
  }
  export type ItemProps<TItem extends Item = Item> = Omit<PartProps, 'children'> & {
    /** Raw item belonging to the canonical collection. */
    item: TItem
    /** Visual content or reactive row presentation. */
    children?: JSX.Element | ((state: ItemState<TItem>) => JSX.Element)
  }
}
export type BaseSelectProps<TItem extends BaseSelectT.Item = BaseSelectT.Item> =
  BaseSelectT.Props<TItem>
