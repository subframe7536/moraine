import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'

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

  export type ValidationType = 'text' | 'number' | 'alphanumeric' | 'alpha'

  export interface SeparatorRenderProps {
    index: number
  }

  /**
   * Base props for the PinInput component.
   */
  export interface Base extends FieldT.ControlBase {
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
    validationType?: ValidationType

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
     * Group inputs by inserting a separator between groups.
     * Pass `true` to split inputs in half, a number for groups of that size,
     * or an array of consecutive group sizes.
     * @example true // splits in half -> [X][X][X] • [X][X][X]
     * @example 3 // groups of 3 -> [X][X][X] • [X][X][X]
     * @example [3, 1, 3] // explicit sizes -> [X][X][X] • [X] • [X][X][X]
     */
    groupSize?: boolean | number | readonly number[]

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
     * Callback when the pin input value changes, passing the slot characters as an array.
     */
    onValueChange?: (value: string[]) => void

    /**
     * Callback when all input fields are completely filled.
     * For controlled values it fires once the value is actually applied.
     */
    onComplete?: (value: string) => void

    /**
     * Callback when entered text contains characters rejected by `validationType`
     * or `normalizeValue`. Receives the raw entered text before filtering.
     */
    onValueInvalid?: (value: string) => void

    /**
     * Whether to submit the owning form when the pin input becomes complete.
     * @default false
     */
    autoSubmit?: boolean

    /**
     * The virtual keyboard hint applied to the inputs and hidden input.
     * Overrides the `inputMode` derived from `validationType`.
     */
    inputMode?: JSX.HTMLAttributes<HTMLInputElement>['inputMode']

    /**
     * Normalizes a proposed value after `validationType` filtering; the result is
     * filtered again and clamped to `length`. Applied to string `value`/`defaultValue`
     * and to typed, pasted, or autofilled text.
     * Should be idempotent, since it may run on the same value more than once.
     */
    normalizeValue?: (value: string) => string

    /**
     * Native focus event when focus enters the pin input group.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Native blur event when focus leaves the pin input group.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Native focusin event for every slot focus, including moves between slots.
     * Calling `preventDefault` skips `onFocus`.
     */
    onFocusIn?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Native focusout event for every slot blur, including moves between slots.
     * Calling `preventDefault` skips `onBlur`.
     */
    onFocusOut?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

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
    inputRefs?: Ref<HTMLInputElement[]>
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
