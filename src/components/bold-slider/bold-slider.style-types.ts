import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
import type { SliderStyleSlot } from '../slider/slider.style-types'

export interface BoldSliderStyleSlot<T = unknown> extends SliderStyleSlot<T> {
  /** Decorative overlay above the track that holds the label and value, and shows the keyboard focus ring. */
  content?: T

  /** Text label shown at the start of the track. */
  label?: T

  /** Formatted current value shown at the end of the track. */
  value?: T

  /** Clip box matching the filled range that holds the capsule at the fill edge; the capsule uses its text color. */
  indicator?: T
}

export interface BoldSliderStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize

  /**
   * Uses a solid neutral fill (`muted-active`) instead of the primary color, so the label, value,
   * and indicator keep the same colors over the fill and the track.
   * @default false
   */
  subtle?: boolean
}

export type BoldSliderStyleConfig = ComponentStyleConfig<
  BoldSliderStyleSlot,
  BoldSliderStyleVariants
>
