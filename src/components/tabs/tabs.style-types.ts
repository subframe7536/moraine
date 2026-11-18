import type { ComponentSize, Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface TabsStyleSlot<T = unknown> {
  /**
   * Tabs container that owns tab selection and panel rendering.
   */
  root?: T

  /** Tablist that contains all tab triggers and the selection indicator. */
  list?: T

  /** Moving indicator aligned with the active tab trigger. */
  indicator?: T

  /** Tab button users activate to select a panel. */
  trigger?: T

  /** Optional icon rendered before a tab label. */
  leading?: T

  /** Text or custom label rendered inside a tab trigger. */
  label?: T

  /** Tab panel rendered for the selected item. */
  content?: T
}

export interface TabsStyleVariants {
  /**
   * Direction in which tabs are laid out. It also decides which arrow keys move between tabs.
   * @default 'horizontal'
   */
  orientation?: Orientation

  /**
   * Visual treatment of the tab list. `pill` sets the tabs on a muted rounded track and marks the
   * selected tab with a raised background. `link` uses a transparent list, colors the selected
   * tab with the primary color, and marks it with a thin underline (an edge line when vertical).
   * @default 'pill'
   */
  variant?: 'pill' | 'link'
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
}

export type TabsStyleConfig = ComponentStyleConfig<TabsStyleSlot, TabsStyleVariants>
