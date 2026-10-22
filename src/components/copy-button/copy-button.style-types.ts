import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonStyleVariants } from '../button/button.style-types'

export interface CopyButtonStyleSlot<T = unknown> {
  /**
   * Interactive button element, or the polymorphic element provided through `as`.
   */
  root?: T

  /**
   * Copy icon element or container holding the copy and check icons.
   */
  icon?: T

  /**
   * Button content region after render-prop resolution.
   */
  label?: T
}

export type CopyButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost'

export interface CopyButtonStyleVariants {
  /** Visual treatment while uncopied. @default 'ghost' */
  variant?: CopyButtonVariant
  /** Visual treatment while copied. */
  copiedVariant?: CopyButtonVariant
  /** Color tone while uncopied. @default 'neutral' */
  tone?: ButtonStyleVariants['tone']
  /** Color tone while copied. */
  copiedTone?: ButtonStyleVariants['tone']
  /** Button size, including icon-only sizes. @default 'icon-md' */
  size?: ButtonStyleVariants['size']
}

export type CopyButtonStyleConfig = ComponentStyleConfig<
  CopyButtonStyleSlot,
  CopyButtonStyleVariants
>
