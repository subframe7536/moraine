import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options'

import type { SwitchStyleSlot, SwitchStyleVariant } from './switch.style-types'

export namespace SwitchT {
  export type Kind = 'single'

  export type Slot<T = unknown> = SwitchStyleSlot<T>

  export type Variant = SwitchStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Switch component.
   */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /**
     * Pointer down handler for the switch root container.
     */
    onPointerDown?: JSX.EventHandlerUnion<HTMLButtonElement, PointerEvent>

    /**
     * Native value submitted when the switch is checked.
     * @default 'on'
     */
    value?: string

    /**
     * Whether the switch is checked.
     */
    checked?: TTrue | TFalse

    /**
     * Whether the switch is checked by default.
     */
    defaultChecked?: boolean

    /**
     * Value to use when the switch is checked.
     * @default true
     */
    trueValue?: TTrue

    /**
     * Value to use when the switch is unchecked.
     * @default false
     */
    falseValue?: TFalse

    /**
     * Whether the switch is in a loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Icon shown during loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Icon shown when the switch is checked.
     */
    checkedIcon?: IconT.Name

    /**
     * Icon shown when the switch is unchecked.
     */
    uncheckedIcon?: IconT.Name

    /**
     * Label for the switch.
     */
    label?: JSX.Element

    /**
     * Description for the switch.
     */
    description?: JSX.Element

    /**
     * Optional inner input element ref.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Callback when the switch state changes.
     */
    onChange?: (value: TTrue | TFalse) => void
  }

  /**
   * Props for the Switch component.
   */
  export type Props<TTrue = boolean, TFalse = boolean> = BaseProps<
    'div',
    Base<TTrue, TFalse>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the Switch component.
 */
export interface SwitchProps<TTrue = boolean, TFalse = boolean> extends SwitchT.Props<
  TTrue,
  TFalse
> {}
