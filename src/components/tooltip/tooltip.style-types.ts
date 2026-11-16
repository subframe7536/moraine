import type { ComponentStyleConfig } from '../../theme/types'

export interface TooltipStyleSlot<T = unknown> {
  /** Element that opens the tooltip. */
  trigger?: T

  /** Tooltip bubble positioned next to its trigger. */
  content?: T

  /** Primary text region inside the tooltip bubble. */
  text?: T

  /** Container for shortcut hints displayed beside tooltip text. */
  kbds?: T
}

export interface TooltipStyleVariants {
  /** `invert` flips the colors (e.g. dark tooltip on light theme).
   * @default 'default'
   */
  variant?: 'default' | 'invert'
}

export type TooltipStyleConfig = ComponentStyleConfig<TooltipStyleSlot, TooltipStyleVariants>
