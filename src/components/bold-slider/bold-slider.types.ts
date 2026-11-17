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
     * Controls the value text shown at the end of the track. `false` hides it, `true` shows the
     * number, and a function returns the text to show. The function receives the current `value`,
     * the `max` (100 when not set), and `percent`, the filled share of the track from 0 to 100.
     * With `true`, the value is formatted with `formatOptions` when set; otherwise it is rounded to
     * the decimal places of `step` (2 places without `step`) with no digit grouping.
     * @default true
     * @example
     * ```tsx
     * import { BoldSlider } from 'moraine'
     *
     * <BoldSlider
     *   label="Volume"
     *   defaultValue={40}
     *   valueLabel={({ value, max }) => `${value} / ${max}`}
     * />
     * ```
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
