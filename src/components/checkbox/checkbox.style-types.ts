import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface CheckboxStyleSlot<T = unknown> {
  /** Labelable checkbox wrapper that coordinates input, indicator, and text content. */
  root?: T

  /** Visible checkbox control users recognize as the toggle target. */
  control?: T

  /** Visual checked or indeterminate state layer inside the control; holds the state icon. */
  indicator?: T

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
  /**
   * Layout of the checkbox. `list` is a plain row of control, label, and description, where only
   * the control and label toggle. `card` wraps them in a bordered, padded card that toggles when
   * clicked anywhere outside nested interactive elements. When omitted, it renders like `list`.
   * @default 'list'
   */
  variant?: 'card' | 'list'
  /** Placement of the selection indicator relative to the label.
   * @default 'leading'
   */
  indicatorPosition?: 'leading' | 'trailing' | 'hidden'
}

export type CheckboxStyleConfig = ComponentStyleConfig<CheckboxStyleSlot, CheckboxStyleVariants>
