import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'

export namespace InputNumberT {
  export type Orientation = 'horizontal' | 'vertical'
  export type PointerType = 'mouse' | 'touch' | 'pen'

  export interface Slot<T = unknown> {
    /**
     * Number input wrapper that owns the input and step controls.
     */
    root?: T

    /** Native number input element. */
    input?: T

    /** Button that increases the current numeric value. */
    increment?: T

    /** Button that decreases the current numeric value. */
    decrement?: T

    /** Column container for vertical increment/decrement controls. */
    controls?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg' | null
    variant?: 'outline' | 'subtle' | 'ghost' | 'none' | null
    align?: 'center' | 'start' | null
    orientation?: 'horizontal' | 'vertical' | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the InputNumber component.
   */
  export interface Base
    extends FormIdentityOptions, FormDisableOption, FormRequiredOption, FormReadOnlyOption {
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
     * Locale for number formatting and parsing.
     * Uses browser default if not specified.
     */
    locale?: string

    /**
     * Callback when the formatted string value changes.
     */
    onChange?: (value: string) => void

    /**
     * Callback when the numeric value changes.
     */
    onRawValueChange?: (value: number) => void

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
     * Whether press-and-hold should trigger repeated value changes.
     * @default true
     */
    holdRepeat?: boolean

    /**
     * Delay in milliseconds before repeated value changes start.
     * @default 500
     */
    repeatDelayMs?: number

    /**
     * Interval in milliseconds between repeated value changes.
     * @default 80
     */
    repeatIntervalMs?: number

    /**
     * Minimum elapsed time in milliseconds between repeat triggers.
     * @default 0
     */
    repeatThrottleMs?: number

    /**
     * Pointer types that can trigger press-and-hold repeat.
     * @default 'all'
     */
    repeatPointerTypes?: 'all' | PointerType
  }

  /**
   * Props for the InputNumber component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the InputNumber component.
 */
export interface InputNumberProps extends InputNumberT.Props {}
