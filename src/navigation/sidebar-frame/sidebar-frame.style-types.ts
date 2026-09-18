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
}

export interface SidebarFrameStyleVariant {
  side?: 'left' | 'right'
  variant?: 'default' | 'floating' | 'inset'
}
