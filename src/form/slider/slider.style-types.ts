import type { ComponentSize, Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface SliderStyleSlot<T = unknown> {
  /**
   * Slider container that owns track, range, thumbs, and labels.
   */
  root?: T

  /** Background rail representing the full slider range. */
  track?: T

  /** Filled segment between the start of the range and active thumb values. */
  range?: T

  /** Visual marker for one slider step. */
  marker?: T

  /** Draggable handle for one slider value. */
  thumb?: T
}

export interface SliderStyleVariant {
  /** Layout axis used by the component Recipe. */
  orientation?: Orientation

  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual treatment of the component.
   * @default 'default'
   */
  variant?: 'default' | 'bold'
}

export type SliderStyleConfig = ComponentStyleConfig<SliderStyleSlot, SliderStyleVariant>
