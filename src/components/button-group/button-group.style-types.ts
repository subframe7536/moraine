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
  /**
   * Size inherited by descendant `Button`, `ToggleButton`, and `CopyButton` children that do not
   * set their own. When omitted, each child uses its own default size.
   */
  size?: ComponentSize
  /**
   * Variant inherited by descendant buttons that do not set their own (the unpressed `variant` of a
   * `ToggleButton`; `CopyButton` ignores `link`). When omitted, each child uses its own default,
   * such as `solid` for `Button` and `ghost` for `ToggleButton` and `CopyButton`.
   */
  variant?: ButtonStyleVariants['variant']
  /**
   * Tone inherited by descendant buttons that do not set their own (both `tone` and `activeTone` of
   * a `ToggleButton`). It also colors `ButtonGroup.Separator`. When omitted, each child uses its
   * own default tone.
   */
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
