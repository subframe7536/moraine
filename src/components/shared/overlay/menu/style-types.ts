import type { ComponentSize } from '../../../../theme/style-types'

export interface OverlayMenuStyleSlot<T = unknown> {
  /** Element that opens the menu. */
  trigger?: T

  /** Positioned menu panel that contains groups, items, and submenus. */
  content?: T

  /** Section wrapper for related menu items. */
  group?: T

  /** Heading text for a menu group. */
  groupLabel?: T

  /** Non-interactive divider between menu sections. */
  separator?: T

  /** Action row inside menu content, including checkbox and radio items. */
  item?: T

  /** Leading icon or visual shown for a menu item. */
  itemLeading?: T

  /** Primary text for a menu item. */
  itemLabel?: T

  /** Trailing region for shortcuts, submenu arrows, or selection indicators. */
  itemTrailing?: T

  /** Container for keyboard shortcut hints at the end of a menu item. */
  itemKbds?: T

  /** Checked or selected-state indicator for checkbox and radio menu items. */
  itemIndicator?: T

  /** Indicator shown when a menu item opens a submenu. */
  itemSubIndicator?: T
}

export interface OverlayMenuStyleVariants {
  /**
   * Visual size of menu items.
   * @default 'md'
   */
  size?: ComponentSize
}
