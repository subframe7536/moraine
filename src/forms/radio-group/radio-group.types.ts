import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

export namespace RadioGroupT {
  export type Kind = 'single'

  export interface Slot<T = unknown> {
    /**
     * Radio group container that owns selection state and layout.
     */
    root?: T

    /** Wrapper for one radio option. */
    item?: T

    /** Visible radio control for an individual option. */
    control?: T

    /** Vertical alignment wrapper for the radio control. */
    container?: T

    /** Selected-state layer inside an option control. */
    indicator?: T

    /** Inner layout wrapper used by grouped radio variants. */
    wrapper?: T

    /** Primary label text for an option. */
    label?: T

    /** Supporting description for an option. */
    description?: T
  }

  export interface Variant {
    /** Layout axis used by the component Recipe. */
    orientation?: 'horizontal' | 'vertical'

    /** Visual size of the component.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'
    /** Visual treatment of the component.
     * @default 'list'
     */
    variant?: 'card' | 'table' | 'list'
    /** Placement of the selection indicator.
     * @default 'start'
     */
    indicator?: 'start' | 'end' | 'hidden'
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * A radio item object.
   */
  export interface Item {
    /**
     * Value of the radio item.
     */
    value?: string

    /**
     * Label for the radio item.
     */
    label?: JSX.Element

    /**
     * Description for the radio item.
     */
    description?: JSX.Element

    /**
     * Whether the item is disabled.
     */
    disabled?: boolean
  }

  /**
   * Base props for the RadioGroup component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<string>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /**
     * The orientation of the radio group.
     * @default 'vertical'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Array of items to render in the group.
     */
    items?: (string | Item)[]

    /**
     * Callback when the selected value changes.
     */
    onChange?: (value: string) => void
  }

  /**
   * Props for the RadioGroup component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the RadioGroup component.
 */
export interface RadioGroupProps extends RadioGroupT.Props {}
