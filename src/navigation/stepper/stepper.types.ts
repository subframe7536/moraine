import type { JSX } from 'solid-js'

import type { IconT } from '../../elements/icon/icon.types.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { StepperStyleSlot, StepperStyleVariant } from './stepper.style-types'

export namespace StepperT {
  export type Kind = 'single'

  export type Value = string

  export type Slot<T = unknown> = StepperStyleSlot<T>

  export type Variant = StepperStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * An individual step in the stepper.
   */
  export interface Item {
    /**
     * Unique value for the step.
     * @default index of the item
     */
    value?: Value

    /**
     * Title of the step.
     */
    title?: JSX.Element

    /**
     * Secondary description of the step.
     */
    description?: JSX.Element

    /**
     * Icon to display in the step indicator.
     * @default index + 1
     */
    icon?: IconT.Name

    /**
     * Content to display when the step is active.
     */
    content?: JSX.Element

    /**
     * Whether the step is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Additional class name for the step item.
     */
    class?: string
  }

  /**
   * Base props for the Stepper component.
   */
  export interface Base {
    /**
     * Unique identifier for the stepper root element.
     */
    id?: string

    /**
     * Controlled active step value.
     */
    value?: Value

    /**
     * Default active step value for uncontrolled usage.
     */
    defaultValue?: Value

    /**
     * Callback when the active step changes.
     */
    onChange?: (value: Value) => void

    /**
     * The orientation of the stepper.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'

    /**
     * Whether keyboard activation happens immediately or only after confirmation.
     * @default 'automatic'
     */
    activationMode?: 'automatic' | 'manual'

    /**
     * Array of steps to display.
     */
    items?: Item[]

    /**
     * Whether to enforce linear navigation (must complete steps in order).
     * @default true
     */
    linear?: boolean

    /**
     * Whether the entire stepper is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether steps are clickable for navigation.
     * @default false
     */
    clickable?: boolean
  }

  /**
   * Props for the Stepper component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Stepper component.
 */
export interface StepperProps extends StepperT.Props {}
