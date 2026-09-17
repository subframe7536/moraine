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

import type { TextareaStyleSlot, TextareaStyleVariant } from './textarea.style-types.ts'

export namespace TextareaT {
  export type Kind = 'single'

  export type Value = string | number | undefined

  export type Slot<T = unknown> = TextareaStyleSlot<T>

  export type Variant = TextareaStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Textarea component.
   */
  export interface Base<M extends ModelModifiers | undefined = ModelModifiers | undefined>
    extends
      FormIdentityOptions,
      FormValueOptions<Value>,
      FormRequiredOption,
      FormReadOnlyOption,
      FormDisableOption {
    /** Native controls do not accept child content. */
    children?: never

    /**
     * Placeholder text for the textarea.
     */
    placeholder?: string

    /**
     * Whether to automatically focus the textarea on mount.
     * @default false
     */
    autofocus?: boolean

    /**
     * Delay in milliseconds before focusing the textarea.
     * @default 0
     */
    autofocusDelay?: number

    /**
     * Maximum character length for the textarea.
     */
    maxLength?: number | string

    /**
     * Whether the textarea should automatically resize based on content.
     * @default false
     */
    autoResize?: boolean

    /**
     * Delay in milliseconds before triggering autoresize on mount.
     * @default 0
     */
    autoResizeDelay?: number

    /**
     * Default number of rows.
     * @default 3
     */
    rows?: number

    /**
     * Maximum number of rows allowed during autoresize.
     * @default 0
     */
    maxRows?: number

    /**
     * Modifiers for input processing (e.g., lazy, trim, number).
     */
    modelModifiers?: M

    /**
     * Ref for the native textarea element.
     */
    ref?: Ref<HTMLTextAreaElement>

    /**
     * Callback when the textarea value changes during input.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Native change event, after value synchronization and Field notification.
     */
    onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>

    /**
     * Native input event handler.
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
  export type Props<M extends ModelModifiers | undefined = ModelModifiers | undefined> = BaseProps<
    'textarea',
    Base<M>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the Textarea component.
 */
export interface TextareaProps<
  M extends ModelModifiers | undefined = ModelModifiers | undefined,
> extends TextareaT.Props<M> {}
