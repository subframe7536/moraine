import type { ComponentStyleConfig } from '../../theme/types'

export interface SidebarStyleSlot<T = unknown> {
  /** Frame that contains the panel and inset regions. */
  root?: T

  /** Sidebar panel, rendered in a Sheet on mobile. */
  panel?: T

  /** Header region inside the panel. */
  header?: T

  /** Scrollable content region inside the panel. */
  content?: T

  /** Footer region inside the panel. */
  footer?: T

  /** Main application content region beside the panel. */
  inset?: T

  /** Navigation section that holds a label and a menu. */
  group?: T

  /** Section heading within a group. */
  groupLabel?: T

  /** Container for menu items. */
  menu?: T

  /** Interactive menu item. */
  menuItem?: T

  /** Leading icon for a menu item. */
  menuItemLeading?: T

  /** Label text for a menu item. */
  menuItemLabel?: T

  /** Trailing icon for a menu item. */
  menuItemTrailing?: T

  /** Action container for a menu item. */
  menuAction?: T

  /** Expandable sub-navigation container. */
  menuSub?: T

  /** Trigger button for sub-navigation. */
  menuSubTrigger?: T

  /** Collapsible content for sub-navigation. */
  menuSubContent?: T
}

export interface SidebarStyleVariants {
  side?: 'left' | 'right'
  variant?: 'default' | 'floating' | 'inset'
}

export type SidebarStyleConfig = ComponentStyleConfig<SidebarStyleSlot, SidebarStyleVariants>
