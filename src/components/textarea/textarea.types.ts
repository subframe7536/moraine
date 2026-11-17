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

  export type Value = string | number | undefined

  /**
   * Base props for the Textarea component.
   */
  export interface Base<M extends InputModifiers | undefined = InputModifiers | undefined>
    extends FieldT.ControlBase {
    /**
     * The current value (controlled). `undefined` leaves the textarea uncontrolled; the displayed
     * text is restored to this value after every edit, so update it from `onValueChange`.
     */
    value?: Value
    /** Initial value for uncontrolled usage. Also the value restored when the owning form is reset. */
    defaultValue?: Value

    /**
     * Hint text shown while the textarea is empty. It is not a substitute for a label.
     */
    placeholder?: string

    /**
     * Whether the textarea is focused after mounting, by script rather than the native `autofocus`
     * attribute. Focus is skipped when the textarea is disabled, and `autofocusDelay` postpones it.
     * @default false
     */
    autofocus?: boolean

    /**
     * Delay in milliseconds between mount and focusing the textarea. Only used with `autofocus`.
     * @default 0
     */
    autofocusDelay?: number

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
     * - `number`: parses the text to a `number`; non-numeric text gives `undefined`, and empty text follows `empty`.
     * - `empty`: `'null'` or `'undefined'` turns an empty (whitespace-only) string into that value; `'preserve'` keeps the string.
     * @example
     * ```tsx
     * import { Textarea } from 'moraine'
     *
     * <Textarea
     *   modifiers={{ trim: true, lazy: true, empty: 'undefined' }}
     *   onValueChange={(note) => console.log(note)} // string | undefined, once per blur
     * />
     * ```
     */
    modifiers?: M

    /**
     * Ref callback or variable that receives the native `<textarea>` element.
     */
    ref?: Ref<HTMLTextAreaElement>

    /**
     * Called with the new value, after `modifiers` are applied, as the user edits. It fires on
     * every keystroke, or on `change` (blur) with `modifiers.lazy`. Its argument type follows
     * `modifiers`: `string` by default, `number` with `number`, and may include `null` or
     * `undefined` through `empty`.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Native change event, after value synchronization and Field notification.
     */
    onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>

    /**
     * Native `input` event handler, called after the component has handled the event. It fires on every keystroke, also with `modifiers.lazy`.
     */
    onInput?: JSX.InputEventHandlerUnion<HTMLTextAreaElement, InputEvent>

    /**
     * Native blur event handler.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>

    /**
     * Native focus event handler.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLTextAreaElement, FocusEvent>
  }

  /**
   * Props for the Textarea component.
   */
  export type Props<M extends InputModifiers | undefined = InputModifiers | undefined> = BaseProps<
    'textarea',
    Base<M>,
    Variants,
    Classes,
    Styles
  >
}

/**
 * Props for the Textarea component.
 */
export type TextareaProps<M extends InputModifiers | undefined = InputModifiers | undefined> =
  TextareaT.Props<M>
