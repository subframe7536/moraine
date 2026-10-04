import type { ComponentSize, Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
import type { ButtonStyleVariant } from '../button/button.style-types'

export interface ButtonGroupStyleSlot<T = unknown> {
  /** Container that joins the edges of its direct button children. */
  root?: T

  /** Explicit divider between adjacent ButtonGroup parts. */
  separator?: T
}

export interface ButtonGroupStyleVariant {
  /** Shared button size. @default 'md' */
  size?: ComponentSize
  /** Shared button treatment. @default 'default' */
  variant?: ButtonStyleVariant['variant']
  /** Visual layout direction.
   * @default 'horizontal'
   */
  orientation?: Orientation
}

export type ButtonGroupRecipeVariant = ButtonGroupStyleVariant
export type ButtonGroupThemeVariant = ButtonGroupStyleVariant

export type ButtonGroupStyleConfig = ComponentStyleConfig<
  ButtonGroupStyleSlot,
  ButtonGroupThemeVariant
>
