import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'

export namespace SwitchT {
  export interface Slot<T = unknown> {
    /**
     * Switch wrapper that coordinates input, track, thumb, and text content.
     */
    root?: T

    /** Visible switch track that shows checked and unchecked state. */
    track?: T

    /** Movable knob inside the switch track. */
    thumb?: T

    /** Checked, unchecked, or loading icon rendered inside the thumb. */
    icon?: T

    /** Inner layout wrapper used by switch list and card variants. */
    wrapper?: T

    /** Primary switch label text. */
    label?: T

    /** Supporting text associated with the switch. */
    description?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg' | null
  }
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
