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

  /** Actions positioned beside the title. */
  action?: T

  /** Automatic close affordance owned by Sheet.Content. */
  contentClose?: T

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
