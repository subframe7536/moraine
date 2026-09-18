export interface SwitchStyleSlot<T = unknown> {
  /**
   * Switch wrapper that coordinates input, track, thumb, and text content.
   */
  root?: T

  /** Visible switch track that shows checked and unchecked state. */
  track?: T

  /** Movable knob inside the switch track. */
  thumb?: T

  /** Checked, unchecked, or loading icon rendered inside the thumb. */
  icon?: T

  /** Inner layout wrapper used by switch list and card variants. */
  wrapper?: T

  /** Primary switch label text. */
  label?: T

  /** Supporting text associated with the switch. */
  description?: T
}

export interface SwitchStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}
