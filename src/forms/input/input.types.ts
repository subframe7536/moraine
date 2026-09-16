import type { JSX, Ref } from 'solid-js'

import type { ModelModifiers, ModifierValue } from '../../shared/input-modifiers.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

export namespace InputT {
  export type Kind = 'single'

  export type Value = string | number | undefined

  export interface Slot<T = unknown> {
    /** Native text input element. */
    root?: T
  }

  export interface Variant {
    /** Visual size of the component.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'
    /** Visual treatment of the component.
     * @default 'outline'
     */
    variant?: 'outline' | 'subtle' | 'ghost' | 'none'
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Input component.
   */
  export interface Base<M extends ModelModifiers | undefined = ModelModifiers | undefined>
    extends
      Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'ref' | 'size'>,
      FormIdentityOptions,
      FormValueOptions<Value>,
      FormRequiredOption,
      FormReadOnlyOption,
      FormDisableOption {
    /** Native controls do not accept child content. */
    children?: never

    /**
     * The type of the input element.
     * @default 'text'
     */
    type?: JSX.InputHTMLAttributes<HTMLInputElement>['type']

    /**
     * The placeholder text for the input.
     */
    placeholder?: string

    /**
     * The autocomplete attribute for the input.
     * @default 'off'
     */
    autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']

    /**
     * Whether the input should automatically receive focus on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * The delay in milliseconds before automatically focusing the input.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * The maximum number of characters allowed in the input.
     */
    maxLength?: number | string

    /**
     * Modifiers for the input value (e.g., trim, lazy, number).
     */
    modelModifiers?: M

    /**
     * Ref for the native input element.
     */
    ref?: Ref<HTMLInputElement>

    /**
     * Callback when the input value changes during input.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Native change event, after value synchronization and Field notification.
     */
    onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>

    /**
     * Event handler for the input event.
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
  export type Props<M extends ModelModifiers | undefined = ModelModifiers | undefined> = BaseProps<
    'input',
    Base<M>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the Input component.
 */
export interface InputProps<
  M extends ModelModifiers | undefined = ModelModifiers | undefined,
> extends InputT.Props<M> {}
