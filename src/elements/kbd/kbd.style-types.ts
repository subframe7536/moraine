export interface KbdStyleSlot<T = unknown> {
  /** Keyboard keycap element. */
  root?: T
}

export interface KbdStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Visual treatment of the component.
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'invert'
}
