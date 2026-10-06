import type { ComponentStyleConfig } from '../../theme/types'

export interface SidebarFrameStyleSlot<T = unknown> {
  /** Frame that contains the sidebar and main regions. */
  root?: T

  /** Sidebar region, rendered in a Sheet on mobile. */
  sidebar?: T

  /** Header region inside the sidebar. */
  sidebarHeader?: T

  /** Scrollable content region inside the sidebar. */
  sidebarBody?: T

  /** Footer region inside the sidebar. */
  sidebarFooter?: T

  /** Main application content region. */
  main?: T

  /** Navigation section / list container. */
  menu?: T

  /** Section heading within a menu. */
  label?: T

  /** Interactive nav item. */
  item?: T

  /** Leading icon for nav item. */
  itemLeading?: T

  /** Label text for nav item. */
  itemLabel?: T

  /** Trailing icon for nav item. */
  itemTrailing?: T

  /** Actions container for nav item. */
  itemActions?: T

  /** Expandable sub-navigation container. */
  submenu?: T

  /** Trigger button for sub-navigation. */
  submenuTrigger?: T

  /** Collapsible content for sub-navigation. */
  submenuContent?: T
}

export interface SidebarFrameStyleVariant {
  side?: 'left' | 'right'
  variant?: 'default' | 'floating' | 'inset'
}

export type SidebarFrameStyleConfig = ComponentStyleConfig<
  SidebarFrameStyleSlot,
  SidebarFrameStyleVariant
>
