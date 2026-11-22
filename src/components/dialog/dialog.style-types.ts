import type { ComponentStyleConfig } from '../../theme/types'

export interface DialogStyleSlot<T = unknown> {
  /** Element that opens the dialog. */
  trigger?: T

  /** Backdrop layer rendered behind the dialog panel. */
  overlay?: T

  /** Dialog panel containing header, body, footer, and close control. */
  content?: T

  /** Top region for dialog title and description. */
  header?: T

  /** Accessible title for the dialog. */
  title?: T

  /** Supporting text associated with the dialog title. */
  description?: T

  /** Automatic close affordance owned by Dialog.Content. */
  contentClose?: T

  /** Main dialog content region. */
  body?: T

  /** Bottom region for dialog actions. */
  footer?: T
}

export interface DialogStyleVariants {
  /**
   * Whether the surface fills the viewport, without border or radius.
   * @default false
   */
  fullscreen?: boolean
  /**
   * Whether a panel taller than the viewport scrolls as a whole inside the backdrop. When
   * `false`, the panel is capped to the viewport height and centered. Has no effect with
   * `fullscreen` or when `overlay` is `false`.
   * @default false
   */
  scrollable?: boolean
}

export type DialogStyleConfig = ComponentStyleConfig<DialogStyleSlot, DialogStyleVariants>
