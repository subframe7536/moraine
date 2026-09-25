import type { Ref } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { Orientation } from '../../theme/style/style-types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.types.ts'

import type { SliderStyleSlot, SliderStyleVariant } from './slider.style-types'

export namespace SliderT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SliderStyleSlot<T>

  export type Variant = SliderStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Value = number | number[]

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
     * Direction of keyboard and pointer value movement.
     * @default 'horizontal'
     */
    orientation?: Orientation
    /**
     * Reverses value movement along the track.
     * @default false
     */
    inverted?: boolean

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
     * Whether to show visual step markers on the track, only applicable when `step` is defined and greater than 0.
     * @default false
     */
    marker?: boolean

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
    onValueCommit?: (value: TValue) => void
  }

  /**
   * Props for the Slider component.
   */
  export type Props<TValue = Value> = BaseProps<
    'div',
    Base<TValue>,
    Variant,
    Classes,
    Styles,
    'div',
    true
  >
}

/**
 * Props for the Slider component.
 */
export type SliderProps<TValue = SliderT.Value> = SliderT.Props<TValue>
