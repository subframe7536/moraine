import type { JSX, Ref } from 'solid-js'

import type { InputModifiers, ModifierValue } from '../../shared/input-modifiers'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'

import type { TextareaStyleSlot, TextareaStyleVariants } from './textarea.style-types'

export namespace TextareaT {
  export type Kind = 'single'
  export type Slot<T = unknown> = TextareaStyleSlot<T>

  export type Variants = TextareaStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Value = string | number | null

  /**
   * Base props for the Textarea component.
   */
  export interface Base<TModifiers extends InputModifiers | undefined = InputModifiers | undefined>
    extends FieldT.ControlBase {
    /**
     * The current value (controlled). `undefined` leaves the textarea uncontrolled and `null` is a
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
     * Hint text shown while the textarea is empty. It is not a substitute for a label.
     */
    placeholder?: string

    /**
     * The native `autocomplete` attribute, such as `'off'` or `'street-address'`. The browser
     * default applies when omitted.
     */
    autoComplete?: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>['autocomplete']

    /**
     * Whether the textarea is focused after mounting, by script rather than the native `autofocus`
     * attribute. Focus is skipped when the textarea is disabled, and `autoFocusDelay` postpones it.
     * @default false
     */
    autoFocus?: boolean

    /**
     * Delay in milliseconds between mount and focusing the textarea. Only used with `autoFocus`.
     * @default 0
     */
    autoFocusDelay?: number

    /**
     * Native `maxlength`: the maximum number of characters the user can type. Numeric strings are accepted.
     */
    maxLength?: number | string

    /**
     * Whether the height grows with the content. The textarea shows at least `rows` rows and, when
     * `maxRows` is set, at most `maxRows` rows before it scrolls. Overflow is hidden while it fits.
     * @default false
     */
    autoResize?: boolean

    /**
     * Delay in milliseconds before the first autoresize after mount. Later resizes run without it. Only used with `autoResize`.
     * @default 0
     */
    autoResizeDelay?: number

    /**
     * Number of visible text rows. With `autoResize` it is the minimum height in rows.
     * @default 3
     */
    rows?: number

    /**
     * Maximum number of rows the textarea grows to with `autoResize`; longer content scrolls.
     * `0` means unlimited. Ignored without `autoResize`.
     * @default 0
     */
    maxRows?: number

    /**
     * Transforms the text before it reaches `onValueChange` and form state, and sets the callback's
     * value type.
     *
     * - `trim`: strips surrounding whitespace, also from the displayed text on `change` (blur).
     * - `lazy`: updates the value on `change` instead of on every keystroke.
     * - `number`: parses the text to a `number`; empty or non-numeric text gives `null`.
     * - `empty`: `'null'` turns an empty (whitespace-only) string into `null`; `'preserve'` keeps the string.
     * @example
     * ```tsx
     * import { Textarea } from 'moraine'
     *
     * <Textarea
     *   modifiers={{ trim: true, lazy: true, empty: 'null' }}
     *   onValueChange={(note) => console.log(note)} // string | null, once per blur
     * />
     * ```
     */
    modifiers?: TModifiers

    /**
     * Ref callback or variable that receives the native `<textarea>` element.
     */
    ref?: Ref<HTMLTextAreaElement>

    /**
     * Called with the new value, after `modifiers` are applied, as the user edits. It fires on
     * every keystroke, or on `change` (blur) with `modifiers.lazy`. Its argument type follows
     * `modifiers`: `string` by default, `number | null` with `number`, and `string | null` with
     * `empty: 'null'`.
     */
    onValueChange?: (value: ModifierValue<TModifiers>) => void

    /**
     * Native change event, after value synchronization and Field notification.
     */
    onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>

    /**
     * Native `input` event handler, called after `onValueChange` and the `Field` notification and
     * before a controlled `value` is restored. It fires on every keystroke, also with
     * `modifiers.lazy`.
     */
    onInput?: JSX.InputEventHandlerUnion<HTMLTextAreaElement, InputEvent>

    /**
     * Native blur event handler, called after the `Field` blur notification.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>

    /**
     * Native focus event handler, called after the `Field` focus notification.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>
  }

  /**
   * Props for the Textarea component.
   */
  export type Props<TModifiers extends InputModifiers | undefined = InputModifiers | undefined> =
    Omit<
      BaseProps<'textarea', Base<TModifiers>, Variants, Classes, Styles>,
      'autofocus' | 'autocomplete'
    >
}

/**
 * Props for the Textarea component.
 */
export type TextareaProps<
  TModifiers extends InputModifiers | undefined = InputModifiers | undefined,
> = TextareaT.Props<TModifiers>
