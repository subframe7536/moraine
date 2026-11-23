import type { OverlayPlacement } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface SheetStyleSlot<T = unknown> {
  /** Element that opens the sheet. */
  trigger?: T

  /** Backdrop layer rendered behind the sheet panel. */
  overlay?: T

  /** Slide-in panel containing header, body, footer, and close control. */
  content?: T

  /** Top region for sheet title and description. */
  header?: T

  /** Accessible title for the sheet. */
  title?: T

  /** Supporting text associated with the sheet title. */
  description?: T

  /** Automatic close affordance owned by Sheet.Content. */
  contentClose?: T

  /** Main sheet content region. */
  body?: T

  /** Bottom region for sheet actions. */
  footer?: T
}

export interface SheetStyleVariants {
  /**
   * Viewport edge the sheet is attached to and slides in from. `left` and `right` panels span the
   * full height; `top` and `bottom` panels span the full width.
   * @default 'right'
   */
  side?: OverlayPlacement

  /** Whether the surface is inset from viewport edges.
   * @default false
   */
  inset?: boolean
}

export type SheetStyleConfig = ComponentStyleConfig<SheetStyleSlot, SheetStyleVariants>
