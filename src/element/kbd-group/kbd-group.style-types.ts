import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
import type { KbdStyleVariant } from '../kbd/kbd.style-types'

export interface KbdGroupStyleSlot<T = unknown> {
  /** KbdGroup root element. */
  root?: T

  /** Generated Kbd item. */
  item?: T
}

export interface KbdGroupStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual style variant applied to rendered shortcut keys. @default 'default' */
  variant?: KbdStyleVariant['variant']
}

export type KbdGroupStyleConfig = ComponentStyleConfig<KbdGroupStyleSlot, KbdGroupStyleVariant>
