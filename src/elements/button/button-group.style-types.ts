import type { ComponentSize } from '../../theme/style/style-types'

import type { ButtonStyleVariant } from './button.style-types'

export interface ButtonGroupStyleSlot<T = unknown> {
  /** Container that joins the edges of its direct button children. */
  root?: T

  /** Explicit divider between adjacent ButtonGroup parts. */
  separator?: T
}

export interface ButtonGroupStyleVariant extends ButtonStyleVariant {
  /** Visual layout direction.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
}

export type ButtonGroupRecipeVariant = ButtonGroupStyleVariant
export type ButtonGroupThemeVariant = Omit<ButtonGroupStyleVariant, 'size'> & {
  size?: ComponentSize
}
