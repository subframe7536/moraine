import type { Component, JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon/icon.types'

import type { StepperStyleSlot, StepperStyleVariants } from './stepper.style-types'

export namespace StepperT {
  export type Kind = 'single'
  export type Slot<T = unknown> = StepperStyleSlot<T>

  export type Variants = StepperStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Value = string

  export interface ContentRenderProps {
    /** `value` of the active step. */
    value: Value
    /** Zero-based position of the active step in `items`. */
    index: number
  }

  /**
   * An individual step in the stepper.
   */
  export interface Item {
    /**
     * Unique value identifying the step in `value` and `onValueChange`. A step that repeats an
     * earlier step's value is disabled.
     */
    value: Value

    /**
     * Label of the step. It names the step trigger for assistive technology.
     */
    label?: JSX.Element

    /**
     * Secondary description of the step, shown with the label and used as the trigger's accessible description.
     */
    description?: JSX.Element

    /**
     * Icon to display in the step indicator. When omitted, the indicator shows the one-based step
     * number.
     */
    icon?: IconT.Name

    /**
     * Content to display in the panel below the steps while this step is active. Accepts static JSX
     * or a component receiving `{ value, index }`. A step without `content` renders no panel.
     * @example
     * ```tsx
     * import { Stepper } from 'moraine'
     *
     * <Stepper
     *   defaultValue="plan"
     *   items={[
     *     { value: 'plan', label: 'Plan', content: <p>Choose a plan.</p> },
     *     { value: 'pay', label: 'Pay', content: (props) => <p>Step {props.index + 1}: {props.value}</p> },
     *   ]}
     * />
     * ```
     */
    content?: JSX.Element | Component<ContentRenderProps>

    /**
     * Whether the step is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Extra class applied to this step's item element. It is merged after the `item` slot classes,
     * including `classes.item`, so its utilities win on conflict.
     */
    class?: SlotClassValue
  }

  /**
   * Base props for the Stepper component.
   */
  export interface Base {
    /**
     * DOM `id` of the stepper root element; the trigger and panel ids derive from it. Generated when omitted.
     */
    id?: string

    /**
     * Controlled active step value. When `undefined`, or when it matches no enabled step, the first enabled step is active.
     * Steps before the active one are marked completed.
     */
    value?: Value

    /**
     * Initially active step value for uncontrolled usage. The first enabled step is active when omitted.
     */
    defaultValue?: Value

    /**
     * Called with the step's `value` when the user activates a different step by click or keyboard.
     * It does not fire for programmatic `value` changes, for the already-active step, or while the
     * stepper is `disabled`.
     */
    onValueChange?: (value: Value) => void

    /**
     * Whether arrow-key focus movement activates the step immediately (`automatic`) or only moves
     * focus until `Enter` or `Space` confirms it (`manual`).
     * @default 'automatic'
     */
    activationMode?: 'automatic' | 'manual'

    /**
     * Array of steps to display, in order.
     * @example
     * ```tsx
     * import { Stepper } from 'moraine'
     *
     * <Stepper
     *   navigation="free"
     *   items={[
     *     { value: 'cart', label: 'Cart', description: '2 items' },
     *     { value: 'shipping', label: 'Shipping', icon: 'icon-truck' },
     *     { value: 'payment', label: 'Payment', disabled: true },
     *   ]}
     * />
     * ```
     */
    items?: Item[]

    /**
     * How users move between steps. `none` keeps only the active step enabled, `linear` also allows
     * completed steps and the next step, and `free` allows every enabled step.
     * @default 'none'
     */
    navigation?: 'none' | 'linear' | 'free'

    /**
     * Whether the entire stepper is disabled: no step can be activated by click or keyboard.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether arrow-key navigation wraps from the last step to the first and back. Disabled steps are skipped.
     * @default false
     */
    loop?: boolean
  }

  /**
   * Props for the Stepper component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the Stepper component.
 */
export type StepperProps = StepperT.Props
