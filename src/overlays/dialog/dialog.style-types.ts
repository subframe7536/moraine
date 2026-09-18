export interface DialogStyleSlot<T = unknown> {
  /** Element that opens the dialog. */
  trigger?: T

  /** Backdrop layer rendered behind the dialog panel. */
  overlay?: T

  /** Dialog panel containing header, body, footer, and close control. */
  content?: T

  /** Top region for dialog title and description. */
  header?: T

  /** Inner card wrapper that arranges dialog header, body, and footer. */
  wrapper?: T

  /** Accessible title for the dialog. */
  title?: T

  /** Supporting text associated with the dialog title. */
  description?: T

  /** Button that dismisses the dialog. */
  close?: T

  /** Main dialog content region. */
  body?: T

  /** Bottom region for dialog actions. */
  footer?: T
}

export interface DialogStyleVariant {
  /** Whether the surface fills the viewport.
   * @default false
   */
  fullscreen?: boolean
  /** Whether the overlay scrolls its content.
   * @default false
   */
  scrollable?: boolean
}
