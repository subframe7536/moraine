import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonStyleVariants } from '../button/button.style-types'

export interface CopyButtonStyleSlot<T = unknown> {
  /**
   * Interactive button element, or the polymorphic element provided through `as`.
   */
  root?: T

  /**
   * Relative container holding the copy and check icons with opacity transitions.
   */
  indicator?: T

  /**
   * Idle copy icon element.
   */
  icon?: T

  /**
   * Copied check icon element.
   */
  copiedIcon?: T

  /**
   * Button content region after render-prop resolution.
   */
  label?: T

  /**
   * Trailing content region.
   */
  trailing?: T
}

export interface CopyButtonStyleVariants {
  /** Visual treatment while uncopied. @default 'ghost' */
  variant?: ButtonStyleVariants['variant']
  /** Visual treatment while copied. */
  copiedVariant?: ButtonStyleVariants['variant']
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
