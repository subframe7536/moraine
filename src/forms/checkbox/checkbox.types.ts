import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options'

import type { CheckboxStyleSlot, CheckboxStyleVariant } from './checkbox.style-types'

export namespace CheckboxT {
  export type Kind = 'single'

  export type Slot<T = unknown> = CheckboxStyleSlot<T>

  export type Variant = CheckboxStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /** Base props for the Checkbox component. */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /** Native input element ref. */
    inputRef?: Ref<HTMLInputElement>

    /** Pointer down handler for the checkbox control. */
    onPointerDown?: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent>

    /**
     * Native value submitted when the checkbox is checked.
     * @default 'on'
     */
    value?: string

    /** Whether the checkbox is checked (controlled). */
    checked?: TTrue | TFalse | 'indeterminate'

    /**
     * Whether the checkbox is checked by default (uncontrolled).
     * @default false
     */
    defaultChecked?: boolean | 'indeterminate'

    /**
     * Value to use when the checkbox is checked.
     * @default true
     */
    trueValue?: TTrue

    /**
     * Value to use when the checkbox is unchecked.
     * @default false
     */
    falseValue?: TFalse

    /** Label for the checkbox. */
    label?: JSX.Element

    /** Description text for the checkbox. */
    description?: JSX.Element

    /**
     * Whether to bind the checkbox value to the parent Field.
     * @default true
     */
    fieldBind?: boolean

    /** Callback when the checked state changes. */
    onChange?: (value: TTrue | TFalse) => void

    /**
     * Whether the checkbox is in an indeterminate state.
     * @default false
     */
    indeterminate?: boolean

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
    Variant,
    Classes,
    Styles
  >
}

/** Props for the Checkbox component. */
export interface CheckboxProps<TTrue = boolean, TFalse = boolean> extends CheckboxT.Props<
  TTrue,
  TFalse
> {}
