import type { JSX, Ref } from 'solid-js'

import type { InputModifiers, ModifierValue } from '../../shared/input-modifiers'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'

import type { InputStyleSlot, InputStyleVariants } from './input.style-types'

export namespace InputT {
  export type Kind = 'single'
  export type Slot<T = unknown> = InputStyleSlot<T>
  export type Variants = InputStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Value = string | number | null

  /**
   * Base props for the Input component.
   */
  export interface Base<TModifiers extends InputModifiers | undefined = InputModifiers | undefined>
    extends FieldT.ControlBase {
    /**
     * The current value (controlled). `undefined` leaves the input uncontrolled and `null` is a
     * controlled empty value; the displayed text is restored to this value after every edit, so
     * update it from `onValueChange`.
     */
    value?: Value
    /**
     * Initial value for uncontrolled usage; `null` starts empty. Also the value restored when the
     * owning form is reset.
     */
    defaultValue?: Value

    /**
     * The native `type` of the input element, such as `'email'`, `'password'`, or `'search'`.
     * @default 'text'
     */
    type?: JSX.InputHTMLAttributes<HTMLInputElement>['type']

    /**
     * Hint text shown while the input is empty. It is not a substitute for a label.
     */
    placeholder?: string

    /**
     * The native `autocomplete` attribute, such as `'email'` or `'current-password'`. Browser
     * autofill is off unless set.
     * @default 'off'
     */
    autoComplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']

    /**
     * Whether the input is focused after mounting, by script rather than the native `autofocus`
     * attribute. Focus is skipped when the input is disabled, and `autoFocusDelay` postpones it.
     * @default false
     */
    autoFocus?: boolean

    /**
     * Delay in milliseconds between mount and focusing the input. Only used with `autoFocus`.
     * @default 0
     */
    autoFocusDelay?: number

    /**
     * Native `maxlength`: the maximum number of characters the user can type. Numeric strings are accepted.
     */
    maxLength?: number | string

    /**
     * Transforms the text before it reaches `onValueChange` and form state, and sets the callback's
     * value type.
     *
     * - `trim`: strips surrounding whitespace, also from the displayed text on `change` (blur or Enter).
     * - `lazy`: updates the value on `change` instead of on every keystroke.
     * - `number`: parses the text to a `number`; empty or non-numeric text gives `null`.
     * - `empty`: `'null'` turns an empty (whitespace-only) string into `null`; `'preserve'` keeps the string.
     * @example
     * ```tsx
     * import { Input } from 'moraine'
     *
     * <Input
     *   modifiers={{ number: true, empty: 'null' }}
     *   onValueChange={(value) => console.log(value)} // number | null
     * />
     * ```
     */
    modifiers?: TModifiers

    /**
     * Ref callback or variable that receives the native `<input>` element.
     */
    ref?: Ref<HTMLInputElement>

    /**
     * Called with the new value, after `modifiers` are applied, as the user edits. It fires on
     * every keystroke, or on `change` (blur or Enter) with `modifiers.lazy`. Its argument type
     * follows `modifiers`: `string` by default, `number | null` with `number`, and `string | null`
     * with `empty: 'null'`.
     */
    onValueChange?: (value: ModifierValue<TModifiers>) => void

    /**
     * Native change event, after value synchronization and Field notification.
     */
    onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>

    /**
     * Native `input` event handler, called after the component has handled the event. It fires on every keystroke, also with `modifiers.lazy`.
     */
    onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>

    /**
     * Event handler for the blur event.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Event handler for the focus event.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>
  }

  /**
   * Props for the Input component.
   */
  export type Props<TModifiers extends InputModifiers | undefined = InputModifiers | undefined> =
    Omit<
      BaseProps<'input', Base<TModifiers>, Variants, Classes, Styles>,
      'autofocus' | 'autocomplete'
    >
}

/**
 * Props for the Input component.
 */
export type InputProps<TModifiers extends InputModifiers | undefined = InputModifiers | undefined> =
  InputT.Props<TModifiers>
