import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonT } from '../button'
import type { ButtonStyleSlot } from '../button/button.style-types'

export interface ToggleButtonStyleSlot<T = unknown> extends ButtonStyleSlot<T> {}

export interface ToggleButtonStyleVariants {
  /** Visual treatment while unpressed. @default 'ghost' */
  variant?: ButtonT.Variants['variant']
  /** Visual treatment while pressed. @default 'soft' */
  activeVariant?: ButtonT.Variants['variant']
  /** Color tone while unpressed. @default 'neutral' */
  tone?: ButtonT.Variants['tone']
  /** Color tone while pressed. @default 'neutral' */
  activeTone?: ButtonT.Variants['tone']
  /** Button size, including icon-only sizes. @default 'md' */
  size?: ButtonT.Variants['size']
}

export type ToggleButtonStyleConfig = ComponentStyleConfig<
  ToggleButtonStyleSlot,
  ToggleButtonStyleVariants
>
