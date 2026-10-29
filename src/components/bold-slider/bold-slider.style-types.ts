import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
import type { SliderStyleSlot } from '../slider/slider.style-types'

export interface BoldSliderStyleSlot<T = unknown> extends SliderStyleSlot<T> {
  /** Decorative overlay above the track that holds the label, value, and indicator. */
  content?: T

  /** Text label shown at the start of the track. */
  label?: T

  /** Formatted current value shown at the end of the track. */
  value?: T

  /** Capsule that follows the edge of the filled range. */
  indicator?: T
}

export interface BoldSliderStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
}

export type BoldSliderStyleConfig = ComponentStyleConfig<
  BoldSliderStyleSlot,
  BoldSliderStyleVariants
>
