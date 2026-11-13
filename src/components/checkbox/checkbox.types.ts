import type { JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form/form-options.types'

import type { CheckboxStyleSlot, CheckboxStyleVariants } from './checkbox.style-types'

export namespace CheckboxT {
  export type Kind = 'single'

  export type Slot<T = unknown> = CheckboxStyleSlot<T>

  export type Variants = CheckboxStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Base props for the Checkbox component. */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /** Native input element ref. */
    inputRef?: Ref<HTMLInputElement>

    /**
     * The id of a `<form>` the hidden input belongs to, instead of the closest
     * ancestor form.
     */
    form?: string

    /** Pointer down handler for the checkbox control. */
    onPointerDown?: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent>

    /**
     * Native value submitted when the checkbox is checked. Defaults to a string or number
     * `trueValue`, otherwise `'on'`.
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

    /** Callback when the checked state changes. */
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
