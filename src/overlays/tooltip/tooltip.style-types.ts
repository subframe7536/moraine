export interface TooltipStyleSlot<T = unknown> {
  /** Positioning wrapper around the tooltip surface. */
  positioner?: T
  /** Element that opens the tooltip. */
  trigger?: T

  /** Tooltip bubble positioned next to its trigger. */
  content?: T

  /** Primary text region inside the tooltip bubble. */
  text?: T

  /** Container for shortcut hints displayed beside tooltip text. */
  kbds?: T

  /** Individual keyboard key hint inside the tooltip. */
  kbd?: T
}

export interface TooltipStyleVariant {
  /** Visual invert of the component.
   * @default false
   */
  invert?: boolean
}
