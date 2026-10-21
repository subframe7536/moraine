import type { ComponentSize, Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonStyleVariants } from '../button/button.style-types'

export interface ButtonGroupStyleSlot<T = unknown> {
  /** Container that joins the edges of its direct button children. */
  root?: T

  /** Explicit divider between adjacent ButtonGroup parts. */
  separator?: T
}

export interface ButtonGroupStyleVariants {
  /** Shared button size. @default 'md' */
  size?: ComponentSize
  /** Shared button treatment. @default 'solid' */
  variant?: ButtonStyleVariants['variant']
  /** Shared button tone. @default 'primary' */
  tone?: ButtonStyleVariants['tone']
  /** Visual layout direction.
   * @default 'horizontal'
   */
  orientation?: Orientation
}

export type ButtonGroupRecipeVariants = ButtonGroupStyleVariants
export type ButtonGroupThemeVariants = ButtonGroupStyleVariants

export type ButtonGroupStyleConfig = ComponentStyleConfig<
  ButtonGroupStyleSlot,
  ButtonGroupThemeVariants
>
