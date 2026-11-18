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

  export interface ValueInvalidDetails {
    /**
     * The refused characters, joined: those dropped by `validationType` or `normalizeValue`, or
     * the valid characters beyond `length` for `'tooLong'`. When `normalizeValue` both transforms
     * and drops characters, the transformed originals may be included.
     */
    value: string
    /**
     * Why the text was refused, named after the matching `ValidityState` keys: `'patternMismatch'`
     * for characters the value rules drop, `'tooLong'` for a paste exceeding `length`.
     */
    reason: 'patternMismatch' | 'tooLong'
  }

  export interface SeparatorRenderProps {
    /** Zero-based index of the input the separator follows. */
    index: number
  }

  /**
   * Base props for the PinInput component.
   */
  export interface Base extends FieldT.ControlBase {
    /**
     * Localized message overrides for this pin input instance. `input` builds the `aria-label` of
     * each slot from its 1-based `index` and the `length`.
     * @example
     * ```tsx
     * import { PinInput } from 'moraine'
     *
     * <PinInput
     *   length={6}
     *   translations={{ input: ({ index, length }) => `Digit ${index} of ${length}` }}
     * />
     * ```
     */
    translations?: Translations

    /**
     * The number of single-character inputs, at least 1. Longer values are truncated to it.
     * @default 5
     */
    length?: number

    /**
     * Which characters a slot accepts: `'number'` digits `0-9`, `'alpha'` letters `a-z` / `A-Z`,
     * `'alphanumeric'` both, `'text'` any non-whitespace character. Rejected characters are dropped
     * and reported to `onValueInvalid`. It also picks the default `inputMode` (`numeric` for
     * `'number'`, `text` otherwise).
     * @default 'text'
     */
    validationType?: ValidationType

    /**
     * Whether to hide the entered characters by rendering the slots as `type="password"` inputs.
     * @default false
     */
    mask?: boolean

    /**
     * Whether to enable One-Time Password autofill by setting `autocomplete="one-time-code"` on
     * the first slot, and on the hidden input when `name` is set. A received code is spread across the slots.
     * @default false
     */
    otp?: boolean

    /**
     * Placeholder text shown in empty slots that are not focused, typically one character such as `○`.
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
     * Component that renders the separator content between groups, replacing the default `•`.
     * It receives the `index` of the input it follows and only appears when `groupSize` creates groups.
     * @example
     * ```tsx
     * import { PinInput } from 'moraine'
     *
     * <PinInput length={6} groupSize={3} separatorRender={() => <span>–</span>} />
     * ```
     */
    separatorRender?: Component<SeparatorRenderProps>

    /**
     * Controlled value as a joined string (`'123456'`) or an array with one character per slot
     * (an empty string `''` leaves that slot empty). `undefined` leaves the input uncontrolled. The
     * value is filtered by `validationType` and truncated to `length`; update it from `onValueChange`.
     */
    value?: string[] | string

    /**
     * Initial value for uncontrolled usage, as a joined string or one character per slot. Also
     * the value restored when the owning form is reset.
     */
    defaultValue?: string[] | string

    /**
     * Called whenever the entered characters change, with an array of `length` entries holding
     * one character per slot and `''` for empty slots. Use `.join('')` for the string.
     */
    onValueChange?: (value: string[]) => void

    /**
     * Called with the joined string when every slot is filled. For controlled values it fires once
     * the value is actually applied. Runs before the form is submitted when `autoSubmit` is set.
     */
    onComplete?: (value: string) => void

    /**
     * Called when entered text is refused: a typed, pasted, or autofilled batch containing
     * characters dropped by `validationType` or `normalizeValue` (`reason: 'patternMismatch'`),
     * or a paste with more valid characters than `length` (`reason: 'tooLong'`). Accepted
     * characters from the same input are still applied and reported through `onValueChange`; a
     * paste that breaks both rules calls it once per reason. Does not fire for whitespace and
     * dashes, which are stripped silently. It cannot cancel the input and is unrelated to the
     * native `invalid` event.
     * @example
     * ```tsx
     * import { PinInput } from 'moraine'
     *
     * <PinInput
     *   validationType="number"
     *   onValueInvalid={({ value, reason }) => console.warn(reason, value)}
     * />
     * ```
     */
    onValueInvalid?: (details: ValueInvalidDetails) => void

    /**
     * Whether to call `requestSubmit()` on the owning form, which runs native validation and
     * fires a `submit` event, right after `onComplete`. The form is found through `form`, the
     * inputs, or the closest ancestor `<form>`; nothing happens without one.
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
     * Native focus event when focus enters the pin input group from outside. Calling
     * `preventDefault` skips the `Field` focus notification.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Native blur event when focus leaves the pin input group. Calling `preventDefault` skips the
     * `Field` blur notification.
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
     * Whether to focus the first empty slot after mounting, or the last slot when all are filled.
     * Focus is skipped when the control is disabled, and `autofocusDelay` postpones it.
     * @default false
     */
    autofocus?: boolean

    /**
     * Delay in milliseconds between mount and focusing. Only used with `autofocus`.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * The `id` of the `<form>` the control belongs to, for a control rendered outside that form.
     * It is set on the slot inputs and on the hidden input that submits the joined value under `name`.
     */
    form?: string

    /**
     * Ref callback or variable that receives the root `<div>` container element.
     */
    ref?: Ref<HTMLDivElement>

    /**
     * Receives the array of the slot `<input>` elements, in order, after mount and whenever
     * `length` changes. It is called with an empty array on cleanup.
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
