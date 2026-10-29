import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { SliderT } from '../slider'

import type { BoldSliderStyleSlot, BoldSliderStyleVariants } from './bold-slider.style-types'

export namespace BoldSliderT {
  export type Kind = 'single'
  export type Slot<T = unknown> = BoldSliderStyleSlot<T>

  export type Variants = BoldSliderStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Translations = SliderT.Translations

  /**
   * Base props for the BoldSlider component.
   */
  export type Base = Omit<
    SliderT.Base<number>,
    'minStepsBetweenThumbs' | 'allowThumbCrossing' | 'children'
  > & {
    /**
     * Text shown at the start of the track. Also used as the default `aria-label`.
     */
    label?: string

    /**
     * Whether to show the formatted value at the end of the track.
     * @default true
     */
    showValue?: boolean

    /**
     * Formats the displayed value.
     * By default the value is rounded to the decimal places of `step`, or to 2 decimal places without `step`.
     */
    formatValue?: (value: number) => string
  }

  /**
   * Props for the BoldSlider component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the BoldSlider component.
 */
export type BoldSliderProps = BoldSliderT.Props
