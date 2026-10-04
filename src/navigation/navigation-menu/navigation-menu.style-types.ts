import type { Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'

export interface NavigationMenuStyleSlot<T = unknown> {
  /** Navigation landmark. */
  root?: T
  /** List of top-level navigation items. */
  list?: T
  /** Container for a trigger and its content, or a direct link. */
  item?: T
  /** Button that opens a navigation panel. */
  trigger?: T
  /** Decorative chevron inside a trigger. */
  triggerIcon?: T
  /** Individual navigation panel. */
  content?: T
  /** Navigation link. */
  link?: T
}

export interface NavigationMenuStyleVariant {
  /** Axis of the top-level navigation list. @default 'horizontal' */
  orientation?: Orientation
}

export type NavigationMenuStyleConfig = ComponentStyleConfig<
  NavigationMenuStyleSlot,
  NavigationMenuStyleVariant
>
