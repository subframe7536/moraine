import type { Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form/form-options.types'

import type { defaultSliderMessages } from './slider.messages'
import type { SliderStyleSlot, SliderStyleVariants } from './slider.style-types'

export namespace SliderT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SliderStyleSlot<T>

  export type Variants = SliderStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultSliderMessages>
  export type Translations = Partial<Messages>

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
    /** Localized message overrides for this slider instance. */
    translations?: Translations
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
    Variants,
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
