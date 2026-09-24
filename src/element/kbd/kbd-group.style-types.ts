import type { ComponentSize } from '../../theme/style/style-types.ts'

import type { KbdStyleVariant } from './kbd.style-types'

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
  /** Visual style variant applied to rendered shortcut keys. */
  variant?: KbdStyleVariant['variant']
}
