export interface RadioGroupStyleSlot<T = unknown> {
  /**
   * Radio group container that owns selection state and layout.
   */
  root?: T

  /** Wrapper for one radio option. */
  item?: T

  /** Visible radio control for an individual option. */
  control?: T

  /** Vertical alignment wrapper for the radio control. */
  container?: T

  /** Selected-state layer inside an option control. */
  indicator?: T

  /** Inner layout wrapper used by grouped radio variants. */
  wrapper?: T

  /** Primary label text for an option. */
  label?: T

  /** Supporting description for an option. */
  description?: T
}

export interface RadioGroupStyleVariant {
  /** Layout axis used by the component Recipe. */
  orientation?: 'horizontal' | 'vertical'

  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Visual treatment of the component.
   * @default 'list'
   */
  variant?: 'card' | 'table' | 'list'
  /** Placement of the selection indicator.
   * @default 'start'
   */
  indicator?: 'start' | 'end' | 'hidden'
}
