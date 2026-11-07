import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form/form-options.types'

import type { defaultPinInputMessages } from './pin-input.messages'
import type { PinInputStyleSlot, PinInputStyleVariants } from './pin-input.style-types'

export namespace PinInputT {
  export type Kind = 'single'
  export type Slot<T = unknown> = PinInputStyleSlot<T>
  export type Variants = PinInputStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultPinInputMessages>
  export type Translations = Partial<Messages>

  export type Type = 'text' | 'number' | 'alphanumeric' | 'alpha'

  export interface SeparatorRenderProps {
    index: number
  }

  /**
   * Base props for the PinInput component.
   */
  export interface Base
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /**
     * Localized message overrides for this pin input instance.
     */
    translations?: Translations

    /**
     * The number of input fields.
     * @default 5
     */
    length?: number

    /**
     * Type of characters allowed in the inputs.
     * @default 'text'
     */
    type?: Type

    /**
     * Whether to treat the inputs like passwords by masking the value.
     * @default false
     */
    mask?: boolean

    /**
     * Whether to enable One-Time Password autocomplete (`one-time-code`).
     * @default false
     */
    otp?: boolean

    /**
     * Placeholder character displayed in empty inputs.
     */
    placeholder?: string

    /**
     * Group inputs by inserting a separator between them.
     * Pass a number to insert one after every Nth input, or an array of positions to insert after specific inputs.
     * @example 3 // after every 3rd input -> [X][X][X] • [X][X][X]
     * @example [3, 4] // after the 3rd and 4th inputs -> [X][X][X] • [X] • [X][X][X]
     */
    separator?: number | readonly number[]

    /**
     * Custom renderer for the separator between inputs.
     */
    separatorRender?: Component<SeparatorRenderProps>

    /**
     * Controlled value as an array of characters or joined string.
     */
    value?: string[] | string

    /**
     * Default uncontrolled value.
     */
    defaultValue?: string[] | string

    /**
     * Callback when the pin input value changes.
     */
    onValueChange?: (value: string[]) => void

    /**
     * Callback when all input fields are completely filled.
     */
    onComplete?: (value: string) => void

    /**
     * Native change event, after value synchronization and Field notification.
     */
    onChange?: (value: string) => void

    /**
     * Native focus event when focus enters the pin input group.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Native blur event when focus leaves the pin input group.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Whether the first input should automatically receive focus on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * Delay in milliseconds before automatically focusing.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * Form ID to associate with the hidden input.
     */
    form?: string

    /**
     * Ref for the root container element.
     */
    ref?: Ref<HTMLDivElement>

    /**
     * Ref collection for the individual input elements.
     */
    inputsRef?: Ref<HTMLInputElement[]>
  }

  /**
   * Props for the PinInput component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the PinInput component.
 */
export type PinInputProps = PinInputT.Props
