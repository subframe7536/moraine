import type { ComponentSize, Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface ProgressStyleSlot<T = unknown> {
  /** Progress container that owns the label, value, track, and indicator. */
  root?: T

  /** Text that names the operation. */
  label?: T

  /** Text that shows the current progress value. */
  value?: T

  /** Background rail that represents the full progress range. */
  track?: T

  /** Filled bar that represents the current progress value. */
  indicator?: T
}

export interface ProgressStyleVariants {
  /** Visual layout direction.
   * @default 'horizontal'
   */
  orientation?: Orientation
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /**
   * Indicator motion while the value is indeterminate: `carousel` slides the bar along the track,
   * `reverse` slides it in the opposite direction, `swing` moves it back and forth, and `elastic`
   * slides it while it grows to full length mid-track. Determinate progress does not animate.
   * @default 'carousel'
   */
  animation?: 'carousel' | 'reverse' | 'swing' | 'elastic'
}

export type ProgressStyleConfig = ComponentStyleConfig<ProgressStyleSlot, ProgressStyleVariants>
