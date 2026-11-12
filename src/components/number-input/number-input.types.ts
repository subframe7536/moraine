import type { JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form/form-options.types'

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

  export interface RepeatOptions {
    /**
     * Delay in milliseconds before repeated value changes start.
     * @default 500
     */
    delay?: number
    /**
     * Interval in milliseconds between repeated value changes.
     * @default 80
     */
    interval?: number
    /**
     * Minimum elapsed time in milliseconds between repeat triggers.
     * @default 0
     */
    throttle?: number
    /**
     * Pointer types that can trigger press-and-hold repeat.
     * @default 'all'
     */
    pointerTypes?: 'all' | PointerType
  }

  /**
   * Base props for the NumberInput component.
   */
  export interface Base
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
    /**
     * Localized message overrides for this number input instance.
     */
    translations?: Translations
    /**
     * The ID of an external form that owns the native spinbutton.
     */
    form?: string

    /**
     * Controlled displayed value.
     */
    value?: string | number

    /**
     * Default displayed value for uncontrolled usage.
     */
    defaultValue?: string | number

    /**
     * Controlled numeric value. Takes precedence over `value`.
     */
    rawValue?: number

    /**
     * Minimum allowed numeric value.
     */
    minValue?: number

    /**
     * Maximum allowed numeric value.
     */
    maxValue?: number

    /**
     * The increment/decrement step size.
     * @default 1
     */
    step?: number

    /**
     * The step size used for PageUp/PageDown.
     * @default step * 10
     */
    largeStep?: number

    /**
     * Locale for number formatting and parsing as a BCP 47 tag such as `en-US`.
     * Falls back to the provider locale, then `en-US`.
     */
    locale?: string

    /**
     * `Intl.NumberFormat` options for display formatting and parsing, such as
     * `{ style: 'currency', currency: 'USD' }`.
     */
    formatOptions?: Intl.NumberFormatOptions

    /**
     * Whether committed values snap to the nearest step grid anchored at `minValue`.
     * @default true
     */
    stepSnapping?: boolean

    /**
     * Callback when the canonical string value changes. Emits `''` when the input is cleared.
     */
    onValueChange?: (value: string) => void

    /**
     * Callback when the numeric value changes. Emits `undefined` when the input is cleared.
     */
    onRawValueChange?: (value: number | undefined) => void

    /**
     * Placeholder text for the input.
     */
    placeholder?: string

    /**
     * Whether to show the increment button.
     * @default true
     */
    increment?: boolean

    /**
     * Icon for the increment button.
     * @default orientation === 'vertical' ? 'icon-chevron-up' : 'icon-plus'
     */
    incrementIcon?: IconT.Name

    /**
     * Whether the increment button is disabled.
     */
    incrementDisabled?: boolean

    /**
     * Whether to show the decrement button.
     * @default true
     */
    decrement?: boolean

    /**
     * Icon for the decrement button.
     * @default orientation === 'vertical' ? 'icon-chevron-down' : 'icon-minus'
     */
    decrementIcon?: IconT.Name

    /**
     * Whether the decrement button is disabled.
     */
    decrementDisabled?: boolean

    /**
     * Whether to automatically focus the input on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * Whether mouse wheel changes the value while the input is focused.
     * @default false
     */
    wheel?: boolean

    /**
     * Delay in milliseconds before focusing the input.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * Optional inner input element ref.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Callback when the input loses focus.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Callback when the input gains focus.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>

    /**
     * Callback when the increment button is clicked.
     */
    onIncrementClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /**
     * Callback when the decrement button is clicked.
     */
    onDecrementClick?: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent>

    /**
     * Configuration for press-and-hold repeat, or boolean to toggle.
     * @default true
     */
    repeat?: boolean | RepeatOptions

    /**
     * Whether press-and-hold should trigger repeated value changes.
     * @default true
     * @deprecated Use `repeat` instead.
     */
    holdRepeat?: boolean

    /**
     * Delay in milliseconds before repeated value changes start.
     * @default 500
     * @deprecated Use `repeat={{ delay }}` instead.
     */
    repeatDelayMs?: number

    /**
     * Interval in milliseconds between repeated value changes.
     * @default 80
     * @deprecated Use `repeat={{ interval }}` instead.
     */
    repeatIntervalMs?: number

    /**
     * Minimum elapsed time in milliseconds between repeat triggers.
     * @default 0
     * @deprecated Use `repeat={{ throttle }}` instead.
     */
    repeatThrottleMs?: number

    /**
     * Pointer types that can trigger press-and-hold repeat.
     * @default 'all'
     * @deprecated Use `repeat={{ pointerTypes }}` instead.
     */
    repeatPointerTypes?: 'all' | PointerType
  }

  /**
   * Props for the NumberInput component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the NumberInput component.
 */
export type NumberInputProps = NumberInputT.Props
