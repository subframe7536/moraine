import type { JSX } from 'solid-js'

import type {
  BaseProps,
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
} from '../shared/form-options.types.ts'

import type { BaseSelectStyleSlot, BaseSelectStyleVariant } from './base-select.style-types'

export type BaseSelectValue = string | number

/**
 * Form identity and state forwarded to the selection machine.
 * @internal
 */
export interface BaseSelectFieldProps
  extends FormIdentityOptions, FormDisableOption, FormReadOnlyOption, FormRequiredOption {}

/**
 * Controlled and uncontrolled popup state.
 * @internal
 */
export interface BaseSelectDisclosureProps {
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

/**
 * Item policies used by navigation, filtering, and selection.
 * @internal
 */
export interface BaseSelectItemBehaviorProps<TItem extends BaseSelectT.Item> {
  /** Machine-readable text for matching; does not change visual labels. */
  itemToLabelString?: (item: TItem) => string

  /** Additional disabled policy evaluated against the current selection. */
  isItemDisabled?: (item: TItem, values: readonly TItem['value'][]) => boolean
}

/**
 * Selection behavior forwarded by visual single-value wrappers.
 * @internal
 */
export interface BaseSelectCloseOnSelectOption {
  /** Close after selection. Defaults to true for single, false for multiple. */
  closeOnSelect?: boolean
}

/**
 * Reset notification forwarded by higher-level collection controls.
 * @internal
 */
export interface BaseSelectResetProps {
  /** Post-reset notification after an unprevented native form reset. */
  onReset?: () => void
}

/**
 * Controlled and uncontrolled selection state.
 * @internal
 */
export interface BaseSelectSelection<TValue extends BaseSelectValue> {
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
  onValueChange?: (value: TValue[]) => void
}

/**
 * Shared props for unmodelled structural parts.
 * @internal
 */
export type BaseSelectPartProps = ElementProps<HTMLDivElement>

export namespace BaseSelectT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = BaseSelectStyleSlot<T>
  export type Variant = BaseSelectStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item<TValue extends string | number = string | number> {
    /** Unique selection and form value. */
    value: TValue
    /** Visual label. */
    label: JSX.Element
    /** Whether this item cannot be selected. */
    disabled?: boolean
  }

  export interface TriggerRenderProps<TItem extends Item = Item> {
    /** Whether the popup is open. */
    open: boolean
    /** Current selected value or values. */
    value: readonly TItem['value'][]
    /** Whether the control is disabled. */
    disabled: boolean
    /** Whether selection is read-only. */
    readOnly: boolean
  }

  export interface ItemRenderProps<TItem extends Item = Item> {
    /** Canonical raw item. */
    item: TItem
    /** Whether selected. */
    selected: boolean
    /** Whether highlighted. */
    highlighted: boolean
    /** Whether disabled. */
    disabled: boolean
  }

  export interface Base<TItem extends Item>
    extends
      BaseSelectFieldProps,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<TItem>,
      BaseSelectCloseOnSelectOption,
      BaseSelectResetProps,
      Variant {
    /** Current flat navigation collection. */
    items?: readonly TItem[]
    /**
     * Resolves an item from the canonical collection by value.
     *
     * Use this when `items` represents only the current navigation view,
     * such as a filtered collection. When omitted, items are resolved from
     * the current `items` collection.
     */
    getItemByValue?: (value: TItem['value']) => TItem | undefined
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
  export type Props<TItem extends Item = Item> = Base<TItem> & BaseSelectSelection<TItem['value']>

  export interface TriggerBase<T extends ValidComponent = 'button', TItem extends Item = Item> {
    /** Element or component to render as. */
    as?: T
    /** Whether this trigger is disabled. */
    disabled?: boolean
    /** Label or reactive presentation function. */
    children?: JSX.Element | ((state: TriggerRenderProps<TItem>) => JSX.Element)
  }

  export type TriggerProps<
    T extends ValidComponent = 'button',
    TItem extends Item = Item,
  > = BaseProps<T, TriggerBase<T, TItem>, never, never, never, 'button'>

  export interface ControlBase {}
  export type ControlProps = BaseProps<'div', ControlBase, never, never, never, 'div', true>

  export interface ContentBase {
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
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never, 'div', true>

  export type ListboxProps = BaseSelectPartProps
  export type GroupProps = BaseSelectPartProps
  export type GroupLabelProps = BaseSelectPartProps
  export type SeparatorProps = BaseSelectPartProps
  export type EmptyProps = BaseSelectPartProps

  export interface ItemBase<TItem extends Item = Item> {
    /** Raw item belonging to the current navigation collection. */
    item: TItem
    /** Item always renders a div; polymorphism belongs to Trigger. */
    as?: never
    /** Visual content or reactive row presentation. */
    children?: JSX.Element | ((state: ItemRenderProps<TItem>) => JSX.Element)
  }
  export type ItemProps<TItem extends Item = Item> = BaseProps<
    'div',
    ItemBase<TItem>,
    never,
    never,
    never
  >
}
export type BaseSelectProps<TItem extends BaseSelectT.Item = BaseSelectT.Item> =
  BaseSelectT.Props<TItem>
