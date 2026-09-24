import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { ProgressStyleSlot, ProgressStyleVariant } from './progress.style-types'

export namespace ProgressT {
  export type Kind = 'single'

  export type Slot<T = unknown> = ProgressStyleSlot<T>

  export type Variant = ProgressStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface StatusRenderProps {
    /** Current progress percentage (0-100). */
    percent?: number
  }

  export interface StepRenderProps {
    /** The label of the current step. */
    step: string
    /** The index of the current step. */
    index: number
    /** The state of the step relative to the active step. */
    state: 'active' | 'first' | 'last' | 'other'
  }

  /** Base props for the Progress component. */
  export interface Base {
    /**
     * The current value of the progress bar. If null/undefined, it is indeterminate.
     * @default null
     */
    value?: number | null

    /**
     * The maximum value of the progress bar, or an array of step labels.
     * @default 100
     */
    max?: number | string[]

    /**
     * Whether to show the status label.
     * @default false
     */
    status?: boolean

    /**
     * Callback to get a localized label for the current value.
     */
    getValueLabel?: (params: { value: number; min: number; max: number }) => string

    /**
     * Custom render function for the status label.
     */
    statusRender?: ComponentOrElement<StatusRenderProps>

    /**
     * Custom render function for each step when `max` is an array.
     */
    stepRender?: ComponentOrElement<StepRenderProps>
  }

  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the Progress component. */
export type ProgressProps = ProgressT.Props
