import type { JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'
import type { IconT } from '../icon'

import type { SwitchStyleSlot, SwitchStyleVariants } from './switch.style-types'

export namespace SwitchT {
  export type Kind = 'single'

  export type Slot<T = unknown> = SwitchStyleSlot<T>

  export type Variants = SwitchStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * Base props for the Switch component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean> extends FieldT.ControlBase {
    /**
     * The id of a `<form>` the hidden input belongs to, instead of the closest
     * ancestor form.
     */
    form?: string

    /**
     * Native value of the hidden checkbox, submitted under `name` when the switch is checked. Nothing
     * is submitted while it is unchecked. Defaults to a string or number `trueValue`, otherwise
     * `'on'`.
     */
    value?: string

    /**
     * Whether the switch is checked (controlled). Accepts `trueValue`, `falseValue`, or a boolean.
     * Leave it `undefined` for uncontrolled usage.
     */
    checked?: TTrue | TFalse

    /**
     * Whether the switch is initially checked (uncontrolled). Accepts `trueValue` or `true` for
     * checked and `falseValue` or `false` for unchecked. Form reset returns to this state.
     * @default false
     */
    defaultChecked?: TTrue | TFalse

    /**
     * Value that `onCheckedChange` receives when the switch becomes checked, and that `checked`
     * accepts for the checked state. Use it to map the state to a domain value. A string or number
     * `trueValue` is also the native value submitted when `value` is not set.
     * @default true
     * @example
     * ```tsx
     * import { Switch } from 'moraine'
     *
     * <Switch
     *   label="Theme"
     *   trueValue="dark"
     *   falseValue="light"
     *   defaultChecked
     *   onCheckedChange={(mode) => console.log(mode)}
     * />
     * ```
     */
    trueValue?: TTrue

    /**
     * Value that `onCheckedChange` receives when the switch becomes unchecked, and that `checked`
     * accepts for the unchecked state.
     * @default false
     */
    falseValue?: TFalse

    /**
     * Whether the switch is in a loading state. A loading switch is disabled and shows `loadingIcon`
     * on the thumb in place of the checked or unchecked icon.
     * @default false
     */
    loading?: boolean

    /**
     * Icon shown on the thumb while `loading` is set.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Icon shown on the thumb when the switch is checked. No icon is rendered when omitted.
     */
    checkedIcon?: IconT.Name

    /**
     * Icon shown on the thumb when the switch is unchecked. No icon is rendered when omitted.
     */
    uncheckedIcon?: IconT.Name

    /**
     * Label for the switch. It is a `<label>` for the control and its accessible name unless the
     * surrounding `Field` provides one.
     */
    label?: JSX.Element

    /**
     * Description shown with the label and linked to the control as its accessible description.
     */
    description?: JSX.Element

    /**
     * Ref to the hidden native `<input type="checkbox">` that submits the switch with a form. The
     * focusable control is a separate `<button role="switch">`.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Called when the user toggles the switch, with `trueValue` (checked) or `falseValue`
     * (unchecked), which are `true` and `false` by default. It does not fire for programmatic
     * changes to `checked`, or while the switch is `disabled`, `readOnly`, or `loading`.
     */
    onCheckedChange?: (value: TTrue | TFalse) => void

    /**
     * Called when the switch control button gains focus, before the `Field` focus
     * notification.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLButtonElement, FocusEvent>

    /**
     * Called when the switch control button loses focus, before the `Field` blur
     * notification.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLButtonElement, FocusEvent>
  }

  /**
   * Props for the Switch component.
   */
  export type Props<TTrue = boolean, TFalse = boolean> = BaseProps<
    'div',
    Base<TTrue, TFalse>,
    Variants,
    Classes,
    Styles
  >
}

/**
 * Props for the Switch component.
 */
export type SwitchProps<TTrue = boolean, TFalse = boolean> = SwitchT.Props<TTrue, TFalse>
