import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
import type { KbdStyleVariants } from '../kbd/kbd.style-types'

export interface KbdGroupStyleSlot<T = unknown> {
  /** KbdGroup root element. */
  root?: T

  /** Generated Kbd item. */
  item?: T
}

export interface KbdGroupStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual style variant applied to rendered shortcut keys. @default 'default' */
  variant?: KbdStyleVariants['variant']
}

export type KbdGroupStyleConfig = ComponentStyleConfig<KbdGroupStyleSlot, KbdGroupStyleVariants>
