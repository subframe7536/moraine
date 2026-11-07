import type { ComponentStyleConfig } from '../../theme/types'

export interface DrawerStyleSlot<T = unknown> {
  /** Element that opens the drawer. */
  trigger?: T

  /** Backdrop layer rendered behind the drawer panel. */
  overlay?: T

  /** Slide-in panel containing handle, header, body, footer, and close control. */
  content?: T

  /** Decorative grab bar rendered for `top` and `bottom` sides. */
  handle?: T

  /** Top region for drawer title and description. */
  header?: T

  /** Accessible title for the drawer. */
  title?: T

  /** Supporting text associated with the drawer title. */
  description?: T

  /** Automatic close affordance owned by Drawer.Content. */
  contentClose?: T

  /** Main drawer content region. */
  body?: T

  /** Bottom region for drawer actions. */
  footer?: T
}

export interface DrawerStyleVariants {
  /** Viewport edge used by the component Recipe.
   * @default 'bottom'
   */
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export type DrawerStyleConfig = ComponentStyleConfig<DrawerStyleSlot, DrawerStyleVariants>
