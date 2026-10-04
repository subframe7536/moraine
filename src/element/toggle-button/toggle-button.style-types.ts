import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonT } from '../button'
import type { ButtonStyleSlot } from '../button/button.style-types'

export interface ToggleButtonStyleSlot<T = unknown> extends ButtonStyleSlot<T> {}

export interface ToggleButtonStyleVariant {
  /** Visual treatment while unpressed. @default 'ghost' */
  variant?: ButtonT.Variant['variant']
  /** Visual treatment while pressed. @default 'secondary' */
  activeVariant?: ButtonT.Variant['variant']
  /** Button size, including icon-only sizes. @default 'md' */
  size?: ButtonT.Variant['size']
}

export type ToggleButtonStyleConfig = ComponentStyleConfig<
  ToggleButtonStyleSlot,
  ToggleButtonStyleVariant
>
