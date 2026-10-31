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

  /** List (`ul`) of menu items. */
  menu?: T

  /** List item (`li`) that wraps a menu button, an optional action, or a sub-menu. */
  menuItem?: T

  /** Interactive button or link of a menu item. */
  menuButton?: T

  /** Leading icon for a menu button. */
  menuButtonLeading?: T

  /** Label text for a menu button. */
  menuButtonLabel?: T

  /** Trailing icon for a menu button. */
  menuButtonTrailing?: T

  /** Action container placed over the end of a menu item. */
  menuAction?: T

  /** Expandable sub-navigation inside a menu item. */
  menuSub?: T

  /** Menu button that expands or collapses sub-navigation. */
  menuSubTrigger?: T

  /** Collapsible list (`ul`) of sub-navigation items. */
  menuSubContent?: T
}

export interface SidebarStyleVariants {
  side?: 'left' | 'right'
  variant?: 'default' | 'floating' | 'inset'
}

export type SidebarStyleConfig = ComponentStyleConfig<SidebarStyleSlot, SidebarStyleVariants>
