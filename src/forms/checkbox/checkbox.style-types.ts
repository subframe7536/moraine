export interface CheckboxStyleSlot<T = unknown> {
  /** Labelable checkbox wrapper that coordinates input, indicator, and text content. */
  root?: T

  /** Visible checkbox control users recognize as the toggle target. */
  control?: T

  /** Visual checked or indeterminate state layer inside the control. */
  indicator?: T

  /** Check or indeterminate icon rendered for the current state. */
  icon?: T

  /** Inner layout wrapper used by card and list checkbox variants. */
  wrapper?: T

  /** Vertical alignment wrapper for the checkbox control. */
  container?: T

  /** Primary checkbox label text. */
  label?: T

  /** Supporting text associated with the checkbox. */
  description?: T
}

export interface CheckboxStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Visual treatment of the component.
   */
  variant?: 'card' | 'list'
  /** Placement of the selection indicator.
   * @default 'start'
   */
  indicator?: 'start' | 'end' | 'hidden'
}
