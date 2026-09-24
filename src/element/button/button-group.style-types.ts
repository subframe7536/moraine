import type { ComponentSize, Orientation } from '../../theme/style/style-types.ts'

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
  orientation?: Orientation
}

export type ButtonGroupRecipeVariant = ButtonGroupStyleVariant
export type ButtonGroupThemeVariant = Omit<ButtonGroupStyleVariant, 'size'> & {
  size?: ComponentSize
}
