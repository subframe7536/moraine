import type { Orientation } from '../../theme/style/style-types.ts'
import type { InputStyleVariant } from '../input/input.style-types'

export interface InputGroupStyleSlot<T = unknown> {
  /** Shared frame around one Input or Textarea and its supporting content. */
  root?: T

  /** Content at the logical start or above the control. */
  leading?: T

  /** Content at the logical end or below the control. */
  trailing?: T

  /** Visual state frame driven by the grouped control. */
  frame?: T
}

export interface InputGroupStyleVariant extends InputStyleVariant {
  /** Axis shared by the group and its supporting parts.
   * @default 'horizontal'
   */
  orientation?: Orientation
}

export interface InputGroupRecipeVariant extends InputGroupStyleVariant {
  /**
   * Removes the padding between this part and the adjacent control.
   * @default false
   */
  compact?: boolean
}
