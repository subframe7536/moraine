import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.types.ts'

import type { RadioGroupStyleSlot, RadioGroupStyleVariant } from './radio-group.style-types'

export namespace RadioGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = RadioGroupStyleSlot<T>

  export type Variant = RadioGroupStyleVariant

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
     * Whether keyboard navigation loops around when reaching the ends.
     * @default true
     */
    loop?: boolean

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
export type RadioGroupProps = RadioGroupT.Props
