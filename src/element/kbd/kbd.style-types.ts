import type { ComponentSize } from '../../theme/style/style-types.ts'
export interface KbdStyleSlot<T = unknown> {
  /** Keyboard keycap element. */
  root?: T
}

export interface KbdStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual treatment of the component.
   * @default 'default'
   */
  variant?: 'default' | 'outline' | 'invert'
}
