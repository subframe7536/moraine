import type { JSX } from 'solid-js'

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
     * Content shown at the start of the track. Also used as the default `aria-label` when it is a
     * string. It renders in both the track and fill text layers, so pass JSX inline rather than a
     * shared node.
     */
    label?: JSX.Element

    /**
     * Whether to show the value at the end of the track, or a formatter for it. `percent` is the
     * filled share of the track from 0 to 100.
     * By default the value is rounded to the decimal places of `step`, or to 2 decimal places without `step`.
     * @default true
     */
    valueLabel?: boolean | ((props: { percent: number; value: number; max: number }) => string)
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
