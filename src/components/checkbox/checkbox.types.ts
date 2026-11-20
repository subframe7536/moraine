import type { JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'
import type { IconT } from '../icon'

import type { CheckboxStyleSlot, CheckboxStyleVariants } from './checkbox.style-types'

export namespace CheckboxT {
  export type Kind = 'single'

  export type Slot<T = unknown> = CheckboxStyleSlot<T>

  export type Variants = CheckboxStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Base props for the Checkbox component. */
  export interface Base<TTrue = boolean, TFalse = boolean> extends FieldT.ControlBase {
    /**
     * Ref to the hidden native `<input type="checkbox">` that carries the form value. The visible
     * control is a separate `<button role="checkbox">`.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * The id of a `<form>` the hidden input belongs to, instead of the closest
     * ancestor form.
     */
    form?: string

    /**
     * Handler for `pointerdown` on the checkbox control button. Call `event.preventDefault()` to
     * skip the built-in handling, which keeps focus on the hidden input when it is already
     * focused.
     */
    onPointerDown?: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent>

    /**
     * Native value submitted when the checkbox is checked. Defaults to a string or number
     * `trueValue`, otherwise `'on'`.
     */
    value?: string

    /**
     * Whether the checkbox is checked (controlled). Accepts `trueValue` or `true` for checked,
     * `falseValue` or `false` for unchecked, and `'indeterminate'` for the mixed state. Leave it
     * `undefined` for uncontrolled state; update it from `onCheckedChange`.
     */
    checked?: TTrue | TFalse | 'indeterminate'

    /**
     * Initial checked state when uncontrolled; also the state restored when the surrounding
     * native form is reset. Accepts `trueValue` or `true` for checked, `falseValue` or `false`
     * for unchecked, and `'indeterminate'` for the mixed state.
     * @default false
     */
    defaultChecked?: TTrue | TFalse | 'indeterminate'

    /**
     * Value that represents the checked state: it is passed to `onCheckedChange`, stored as the
     * value of a bound `Field`, and compared with `checked`. A string or number `trueValue` is
     * also the native value submitted when `value` is not set.
     * @default true
     * @example
     * ```tsx
     * import { Checkbox } from 'moraine'
     *
     * <Checkbox
     *   trueValue="yes"
     *   falseValue="no"
     *   label="Accept the terms"
     *   onCheckedChange={(value) => console.log(value)} // 'yes' or 'no'
     * />
     * ```
     */
    trueValue?: TTrue

    /**
     * Value that represents the unchecked state, passed to `onCheckedChange` and stored as the
     * value of a bound `Field`.
     * @default false
     */
    falseValue?: TFalse

    /**
     * Label rendered beside the control and linked to it. With `variant="card"` the whole card
     * toggles the checkbox when clicked.
     */
    label?: JSX.Element

    /** Description rendered under the label and linked to the control with `aria-describedby`. */
    description?: JSX.Element

    /**
     * Called when the user toggles the checkbox, with `trueValue` (now checked) or `falseValue`
     * (now unchecked). Toggling from `'indeterminate'` checks it. Not called while `disabled` or
     * `readOnly`, nor when `checked` changes from outside.
     */
    onCheckedChange?: (value: TTrue | TFalse) => void

    /**
     * Icon to show when checked.
     * @default 'icon-check'
     */
    checkedIcon?: IconT.Name

    /**
     * Icon to show when indeterminate.
     * @default 'icon-minus'
     */
    indeterminateIcon?: IconT.Name
  }

  /** Props for the Checkbox component. */
  export type Props<TTrue = boolean, TFalse = boolean> = BaseProps<
    'div',
    Base<TTrue, TFalse>,
    Variants,
    Classes,
    Styles
  >
}

/** Props for the Checkbox component. */
export type CheckboxProps<TTrue = boolean, TFalse = boolean> = CheckboxT.Props<TTrue, TFalse>
