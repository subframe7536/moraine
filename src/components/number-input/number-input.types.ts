import type { JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'
import type { IconT } from '../icon'

import type { defaultNumberInputMessages } from './number-input.messages'
import type { NumberInputStyleSlot, NumberInputStyleVariants } from './number-input.style-types'

export namespace NumberInputT {
  export type Kind = 'single'
  export type Slot<T = unknown> = NumberInputStyleSlot<T>

  export type Variants = NumberInputStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultNumberInputMessages>
  export type Translations = Partial<Messages>

  export type PointerType = 'mouse' | 'touch' | 'pen'

  export interface StepDetails {
    /** Step direction. */
    type: 'increment' | 'decrement'
    /** What triggered the step: a step button, the keyboard, or the wheel. */
    emitter: 'button' | 'keyboard' | 'wheel'
    /**
     * Step amount applied: `step`, or `largeStep` for `PageUp` / `PageDown` and Shift + wheel.
     */
    offset: number
    /**
     * The stepped value, the same value `onValueChange` reports for the step. For a button
     * click cancelled with `preventDefault`, it is the value the step would have produced.
     */
    value: number
    /** The DOM event behind the step; a synthetic `click` for hold-repeat steps. */
    event: Event
  }

  export interface RepeatOptions {
    /**
     * Delay in milliseconds between pressing and holding a button and the first step. A quick
     * click steps once through the normal click path.
     * @default 500
     */
    delay?: number
    /**
     * Interval in milliseconds between repeated steps while the button is held. Values below 16 are raised to 16.
     * @default 80
     */
    interval?: number
    /**
     * Minimum time in milliseconds between two steps; steps that come sooner are skipped. `0` disables throttling.
     * @default 0
     */
    throttle?: number
    /**
     * Pointer type allowed to start press-and-hold repeat: `'all'` or one of `'mouse'`, `'touch'`, `'pen'`. Other pointers still step once per click.
     * @default 'all'
     */
    pointerTypes?: 'all' | PointerType
  }

  /**
   * Base props for the NumberInput component.
   */
  export interface Base extends FieldT.ControlBase {
    /**
     * Localized message overrides for this number input instance: `increment` and `decrement` are
     * the `aria-label`s of the step buttons.
     */
    translations?: Translations
    /**
     * The `id` of the `<form>` the control belongs to, for a control rendered outside that form.
     * It is set on the visible input and on the hidden input that submits the value under `name`.
     */
    form?: string

    /**
     * Controlled numeric value. `undefined` keeps the input uncontrolled; `null` keeps it
     * controlled and empty. The displayed value is clamped to `min` / `max`; update it from
     * `onValueChange`.
     */
    value?: number | null

    /**
     * Default numeric value for uncontrolled usage. Omit it or pass `null` to start empty.
     */
    defaultValue?: number | null

    /**
     * Minimum allowed value. Typed, stepped, and controlled values are clamped to it; it anchors
     * the step grid and is exposed as `aria-valuemin`. The `Home` key jumps to it. Unbounded by default.
     */
    min?: number

    /**
     * Maximum allowed value. Typed, stepped, and controlled values are clamped to it and it is
     * exposed as `aria-valuemax`. The `End` key jumps to it. Unbounded by default.
     */
    max?: number

    /**
     * Amount added or subtracted by the step buttons, `ArrowUp` / `ArrowDown`, and the mouse wheel.
     * @default 1
     */
    step?: number

    /**
     * Amount added or subtracted by `PageUp` / `PageDown`, and by the wheel while `Shift` is held.
     * @default step * 10
     */
    largeStep?: number

    /**
     * Locale for number formatting and parsing as a BCP 47 tag such as `en-US`.
     * Falls back to the provider locale, then `en-US`.
     */
    locale?: string

    /**
     * `Intl.NumberFormat` options for display formatting and parsing. The value stays a plain
     * number; only the displayed text is formatted.
     * @example
     * ```tsx
     * import { NumberInput } from 'moraine'
     *
     * <NumberInput
     *   defaultValue={19.99}
     *   locale="de-DE"
     *   formatOptions={{ style: 'currency', currency: 'EUR' }}
     * />
     * ```
     */
    formatOptions?: Intl.NumberFormatOptions

    /**
     * Whether stepping (buttons, arrow and `Page` keys, wheel) lands on the step grid anchored at
     * `min`, or at `0` without `min`; for example `step={5}` from `7` goes to `10`. Typed values are
     * only clamped, never snapped.
     * @default true
     */
    stepSnapping?: boolean

    /**
     * Called when the committed value changes, with the value clamped to `min` / `max`, or `null`
     * when the input is cleared. Typing commits as soon as the text is a complete number; partial
     * text such as `-` waits for blur or `Enter`. Not called when the value is unchanged.
     */
    onValueChange?: (value: number | null) => void

    /**
     * Hint text shown in the visible input while it is empty.
     */
    placeholder?: string

    /**
     * Whether to render the increment button. The button is also disabled automatically at `max`.
     * @default true
     */
    increment?: boolean

    /**
     * Icon for the increment button.
     * @default orientation === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
     */
    incrementIcon?: IconT.Name

    /**
     * Whether the increment button is disabled. Keyboard and wheel stepping stay available.
     * @default false
     */
    incrementDisabled?: boolean

    /**
     * Whether to render the decrement button. The button is also disabled automatically at `min`.
     * @default true
     */
    decrement?: boolean

    /**
     * Icon for the decrement button.
     * @default orientation === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
     */
    decrementIcon?: IconT.Name

    /**
     * Whether the decrement button is disabled. Keyboard and wheel stepping stay available.
     * @default false
     */
    decrementDisabled?: boolean

    /**
     * Whether the input is focused after mounting, by script rather than the native `autofocus`
     * attribute. Focus is skipped when the control is disabled, and `autoFocusDelay` postpones it.
     * @default false
     */
    autoFocus?: boolean

    /**
     * Whether scrolling the mouse wheel over the focused input steps the value: up increments,
     * down decrements, and holding `Shift` uses `largeStep`. The page does not scroll while it
     * steps; `Ctrl` + wheel (zoom) is ignored.
     * @default false
     */
    wheel?: boolean

    /**
     * Delay in milliseconds between mount and focusing the input. Only used with `autoFocus`.
     * @default 0
     */
    autoFocusDelay?: number

    /**
     * Ref callback or variable that receives the visible `<input role="spinbutton">` element.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Called when the input loses focus, before the typed text is committed and the `Field` blur
     * notification.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Called when the input gains focus, before the `Field` focus notification.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Called on each step: step button clicks, repeated steps while a button is held, keyboard
     * arrows (`ArrowUp` / `ArrowDown` / `PageUp` / `PageDown`), and wheel stepping. `details`
     * carries the direction (`type`), the trigger source (`emitter`), the step amount
     * (`offset`), the stepped `value`, and the DOM `event`. For a button click it runs before
     * the step and calling `preventDefault` on the event cancels it; repeated, keyboard, and
     * wheel steps cannot be cancelled. It is not called while the control is disabled or the
     * step is out of range. Use `onValueChange` to observe every value change.
     */
    onStep?: (details: StepDetails) => void

    /**
     * Press-and-hold repeat on the step buttons: `true` for the defaults, `false` to step only on
     * click, or an options object. Keyboard and wheel stepping are not affected.
     * @default true
     * @example
     * ```tsx
     * import { NumberInput } from 'moraine'
     *
     * <NumberInput repeat={{ delay: 300, interval: 50, pointerTypes: 'mouse' }} />
     * ```
     */
    repeat?: boolean | RepeatOptions
  }

  /**
   * Props for the NumberInput component.
   */
  export type Props = Omit<BaseProps<'div', Base, Variants, Classes, Styles>, 'autofocus'>
}

/**
 * Props for the NumberInput component.
 */
export type NumberInputProps = NumberInputT.Props
