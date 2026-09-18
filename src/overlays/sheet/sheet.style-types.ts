export interface SheetStyleSlot<T = unknown> {
  /** Element that opens the sheet. */
  trigger?: T

  /** Backdrop layer rendered behind the sheet panel. */
  overlay?: T

  /** Slide-in panel containing header, body, footer, and close control. */
  content?: T

  /** Top region for sheet title and description. */
  header?: T

  /** Inner wrapper that arranges sheet header, body, footer, and actions. */
  wrapper?: T

  /** Accessible title for the sheet. */
  title?: T

  /** Supporting text associated with the sheet title. */
  description?: T

  /** Header action region, usually paired with the close control. */
  actions?: T

  /** Button that dismisses the sheet. */
  close?: T

  /** Main sheet content region. */
  body?: T

  /** Bottom region for sheet actions. */
  footer?: T
}

export interface SheetStyleVariant {
  /** Viewport edge used by the component Recipe. */
  side?: 'top' | 'right' | 'bottom' | 'left'

  /** Whether the surface is inset from viewport edges.
   * @default false
   */
  inset?: boolean
}
