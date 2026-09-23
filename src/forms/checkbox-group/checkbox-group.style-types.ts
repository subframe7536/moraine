import type { ComponentSize, Orientation } from '../../theme/style/style-types.ts'
export interface CheckboxGroupStyleSlot<T = unknown> {
  /** Group container that owns checkbox collection state and layout. */
  root?: T

  /** Fieldset element that groups checkbox options for accessibility. */
  fieldset?: T

  /** Legend text that labels the checkbox group. */
  legend?: T

  /** Wrapper for one checkbox option in the group. */
  item?: T

  /** Text column for an option label and description. */
  container?: T

  /** Visible checkbox control for an individual option. */
  control?: T

  /** Visual checked or indeterminate state layer for an option. */
  indicator?: T

  /** Check or indeterminate icon rendered for an option state. */
  icon?: T

  /** Inner layout wrapper used by grouped checkbox variants. */
  wrapper?: T

  /** Primary label text for an option. */
  label?: T

  /** Supporting description for an option. */
  description?: T
}

export interface CheckboxGroupStyleVariant {
  /** Visual layout direction.
   * @default 'vertical'
   */
  orientation?: Orientation
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual treatment of the component.
   * @default 'list'
   */
  variant?: 'card' | 'table' | 'list'
}
