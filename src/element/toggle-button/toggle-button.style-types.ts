import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonT } from '../button'
import type { ButtonStyleSlot } from '../button/button.style-types'

export interface ToggleButtonStyleSlot<T = unknown> extends ButtonStyleSlot<T> {}

export interface ToggleButtonStyleVariant {
  /** Visual treatment while unpressed. @default 'ghost' */
  variant?: ButtonT.Variant['variant']
  /** Visual treatment while pressed. @default 'soft' */
  activeVariant?: ButtonT.Variant['variant']
  /** Color tone while unpressed. @default 'neutral' */
  tone?: ButtonT.Variant['tone']
  /** Color tone while pressed. @default 'neutral' */
  activeTone?: ButtonT.Variant['tone']
  /** Button size, including icon-only sizes. @default 'md' */
  size?: ButtonT.Variant['size']
}

export type ToggleButtonStyleConfig = ComponentStyleConfig<
  ToggleButtonStyleSlot,
  ToggleButtonStyleVariant
>
