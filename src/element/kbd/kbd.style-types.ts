import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
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

export type KbdStyleConfig = ComponentStyleConfig<KbdStyleSlot, KbdStyleVariant>
