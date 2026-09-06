import type { Ref } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

export namespace SliderT {
  export type Value = number | number[]

  export interface Slot<T = unknown> {
    /**
     * Slider container that owns track, range, thumbs, and labels.
     */
    root?: T

    /** Background rail representing the full slider range. */
    track?: T

    /** Filled segment between the start of the range and active thumb values. */
    range?: T

    /** Visual marker for one slider step. */
    divider?: T

    /** Draggable handle for one slider value. */
    thumb?: T
  }

  export interface Variant {
    orientation?: 'horizontal' | 'vertical' | null
    size?: 'sm' | 'md' | 'lg' | null
    variant?: 'default' | 'bold' | null
    inverted?: boolean | 'true' | 'false' | null
    multiple?: boolean | 'true' | 'false' | null
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Slider component.
   */
  export interface Base<TValue = Value>
    extends
      FormIdentityOptions,
      FormValueOptions<TValue>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /**
     * Minimum value of the slider.
     * @default 0
     */
    min?: number

    /**
     * Maximum value of the slider.
     * @default 100
     */
    max?: number

    /**
     * Step increment between values.
     * When omitted, pointer movement is continuous.
     */
    step?: number

    /**
     * Minimum steps required between thumbs in a multi-thumb slider.
     * @default 0
     */
    minStepsBetweenThumbs?: number

    /**
     * Whether to show visual step dividers on the track, only applicable when `step` is defined and greater than 0.
     * @default false
     */
    divider?: boolean

    /**
     * Whether dragging can continue across another thumb when there is no minimum gap.
     * @default true
     */
    allowThumbCrossing?: boolean

    /**
     * Optional inner input element ref.
     */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Callback when the slider selection changes during interaction.
     */
    onValueChange?: (value: TValue) => void

    /**
     * Callback when the slider selection change is committed.
     */
    onChange?: (value: TValue) => void
  }

  /**
   * Props for the Slider component.
   */
  export type Props<TValue = Value> = BaseProps<'div', Base<TValue>, Variant, Classes, Styles>
}

/**
 * Props for the Slider component.
 */
export interface SliderProps<TValue = SliderT.Value> extends SliderT.Props<TValue> {}
