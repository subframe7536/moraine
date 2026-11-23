import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonStyleVariants } from '../button/button.style-types'
export interface CopyButtonStyleSlot<T = unknown> {
  /**
   * Interactive button element, or the polymorphic element provided through `as`.
   */
  root?: T

  /**
   * Status icon: `icon` while idle or after an error, `copiedIcon` while copied.
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
  /** Color tone while uncopied. @default 'neutral' */
  tone?: ButtonStyleVariants['tone']
  /**
   * Button scale. The square `icon-*` form is chosen from the content: an icon-only CopyButton uses
   * `icon-<size>` and a labeled one the text size, so `sm` and `icon-sm` render the same way.
   * @default 'md'
   */
  size?: ButtonStyleVariants['size']
}

export type CopyButtonStyleConfig = ComponentStyleConfig<
  CopyButtonStyleSlot,
  CopyButtonStyleVariants
>
