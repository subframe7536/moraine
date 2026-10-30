import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface CheckboxStyleSlot<T = unknown> {
  /** Labelable checkbox wrapper that coordinates input, indicator, and text content. */
  root?: T

  /** Visible checkbox control users recognize as the toggle target; holds the state icon. */
  control?: T

  /** Inner layout wrapper used by card and list checkbox variants. */
  wrapper?: T

  /** Vertical alignment wrapper for the checkbox control. */
  container?: T

  /** Primary checkbox label text. */
  label?: T

  /** Supporting text associated with the checkbox. */
  description?: T
}

export interface CheckboxStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual treatment of the component.
   */
  variant?: 'card' | 'list'
  /** Placement of the selection indicator.
   * @default 'start'
   */
  indicator?: 'start' | 'end' | 'hidden'
}

export type CheckboxStyleConfig = ComponentStyleConfig<CheckboxStyleSlot, CheckboxStyleVariants>
