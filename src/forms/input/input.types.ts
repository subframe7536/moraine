import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
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
  export type Value = string | number | undefined

  export interface Slot<T = unknown> {
    /**
     * Input wrapper that positions icons, loading state, and the native input.
     */
    root?: T

    /** Native text input element. */
    input?: T

    /** Icon or loading indicator rendered before the input value. */
    leading?: T

    /** Icon or loading indicator rendered after the input value. */
    trailing?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg' | null
    variant?: 'outline' | 'subtle' | 'ghost' | 'none' | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Input component.
   */
  export interface Base<M extends ModelModifiers | undefined = ModelModifiers | undefined>
    extends
      FormIdentityOptions,
      FormValueOptions<Value>,
      FormRequiredOption,
      FormReadOnlyOption,
      FormDisableOption {
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
     * Leading icon name or custom content.
     */
    leading?: IconT.Name

    /**
     * Trailing icon name or custom content.
     */
    trailing?: IconT.Name

    /**
     * Whether the input is in a loading state.
     * @default false
     */
    loading?: boolean

    /**
     * The icon to show when the input is in a loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Modifiers for the input value (e.g., trim, lazy, number).
     */
    modelModifiers?: M

    /**
     * Optional inner input element ref.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Callback when the input value changes during input.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Callback when the input value change is committed.
     */
    onChange?: (value: ModifierValue<M>) => void

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

    /**
     * Additional content to render inside the input container.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Input component.
   */
  export type Props<M extends ModelModifiers | undefined = ModelModifiers | undefined> = BaseProps<
    'div',
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
