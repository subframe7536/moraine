import type { ComponentSize } from '../../theme/style-types'
import type { Tone } from '../../theme/tokens'
import type { ComponentStyleConfig } from '../../theme/types'
export interface BadgeStyleSlot<T = unknown> {
  /**
   * Inline badge container that carries the variant, size, and interactive state.
   */
  root?: T

  /** Optional icon displayed before the badge label. */
  leading?: T

  /** Badge text or children content between the optional visuals. */
  label?: T

  /** Optional trailing icon displayed after the label. */
  trailing?: T
}

export interface BadgeStyleVariants {
  /** Visual treatment of the component.
   * @default 'soft'
   */
  variant?: 'solid' | 'soft' | 'subtle' | 'outline'
  /** Color tone of the component.
   * @default 'neutral'
   */
  tone?: Tone
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
}

export interface BadgeRecipeVariant extends BadgeStyleVariants {
  square?: boolean
}

export type BadgeStyleConfig = ComponentStyleConfig<BadgeStyleSlot, BadgeRecipeVariant>
