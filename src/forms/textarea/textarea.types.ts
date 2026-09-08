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

export namespace TextareaT {
  export type Value = string | number | undefined

  export interface Slot<T = unknown> {
    /**
     * Textarea wrapper that owns header, textarea, footer, and autoresize state.
     */
    root?: T

    /** Optional content rendered above the textarea. */
    header?: T

    /** Native textarea control used for multi-line text entry. */
    input?: T

    /** Optional content rendered below the textarea. */
    footer?: T
  }

  export interface Variant {
    /** Visual size of the component.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg' | null
    /** Visual treatment of the component.
     * @default 'outline'
     */
    variant?: 'outline' | 'subtle' | 'ghost' | 'none' | null
  }
  export type SlotName = keyof Slot

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Textarea component.
   */
  export interface Base<M extends ModelModifiers | undefined = ModelModifiers | undefined>
    extends
      Omit<
        JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
        'value' | 'defaultValue' | 'ref' | 'size'
      >,
      FormIdentityOptions,
      FormValueOptions<Value>,
      FormRequiredOption,
      FormReadOnlyOption,
      FormDisableOption {
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
     * Element to render above the textarea.
     */
    header?: JSX.Element

    /**
     * Element to render below the textarea.
     */
    footer?: JSX.Element

    /**
     * Modifiers for input processing (e.g., lazy, trim, number).
     */
    modelModifiers?: M

    /**
     * Optional inner textarea element ref.
     */
    ref?: Ref<HTMLDivElement>

    /** Ref for the editable textarea element. */
    textareaRef?: Ref<HTMLTextAreaElement>

    /**
     * Callback when the textarea value changes during input.
     */
    onValueChange?: (value: ModifierValue<M>) => void

    /**
     * Native change event, after value synchronization and FormField notification.
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

    /**
     * Children elements, rendered inside the root below the textarea.
     */
    children?: JSX.Element
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
