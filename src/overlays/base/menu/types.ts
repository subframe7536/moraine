import type { JSX } from 'solid-js'

import type { IconT } from '../../../elements/icon/index'
import type { SlotClassValue, SlotStyleValue } from '../../../shared/types'

import type { OverlayMenuItemVariantProps } from './menu.class'

export type OverlayMenuSide = 'top' | 'right' | 'bottom' | 'left'

export type OverlayMenuPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'

export type OverlayMenuContentSlot = (context: { sub: boolean }) => JSX.Element

export type OverlayMenuItemType = 'item' | 'separator' | 'checkbox' | 'radio' | 'group'

/**
 * Shared interface for menu items used in overlays like ContextMenu and DropdownMenu.
 */
export interface OverlayMenuSharedItem<TItem> {
  /**
   * The type of menu item to render.
   * @default 'item'
   */
  type?: OverlayMenuItemType

  /**
   * Primary label text or element.
   */
  label?: JSX.Element

  /**
   * Secondary description text displayed below the label.
   */
  description?: JSX.Element

  /**
   * Icon name or custom element to display at the start of the item.
   */
  icon?: IconT.Name

  /**
   * Array of keyboard shortcuts to display as keys.
   */
  kbds?: string[]

  /**
   * Color theme variant for the menu item.
   */
  color?: NonNullable<OverlayMenuItemVariantProps['color']>

  /**
   * Whether the item is non-interactive.
   * @default false
   */
  disabled?: boolean

  /**
   * Controlled checked state for checkbox and radio items.
   */
  checked?: boolean

  /**
   * Initial checked state for uncontrolled checkbox and radio items.
   */
  defaultChecked?: boolean

  /**
   * Radio group identifier. Radio items with the same group are mutually exclusive.
   */
  group?: string

  /**
   * Radio item value reported by onValueChange and used for grouped selection.
   */
  value?: string

  /**
   * Controlled open state for submenus.
   */
  open?: boolean

  /**
   * Initial open state for submenus.
   */
  defaultOpen?: boolean

  /**
   * Nested menu items for creating submenus.
   */
  children?: TItem[]

  /**
   * Event handler called when the item is activated.
   */
  onSelect?: () => void

  /**
   * Event handler called when a checkbox item's state changes.
   */
  onCheckedChange?: (checked: boolean) => void

  /**
   * Event handler called when a radio item is selected.
   */
  onValueChange?: (value: string) => void
}

export interface OverlayMenuSharedSlots<T = unknown> {
  /** Optional backdrop rendered behind modal menu content. */
  overlay?: T
  /** Positioned menu panel that contains groups, items, and submenus. */
  content?: T
  /** Section wrapper for related menu items. */
  group?: T
  /** Heading text for a menu group. */
  label?: T
  /** Non-interactive divider between menu sections. */
  separator?: T
  /** Action row inside menu content, including checkbox and radio items. */
  item?: T
  /** Leading icon or visual shown for a menu item. */
  itemLeading?: T
  /** Text column that groups menu item label and description. */
  itemWrapper?: T
  /** Primary text for a menu item. */
  itemLabel?: T
  /** Supporting text for a menu item. */
  itemDescription?: T
  /** Trailing region for shortcuts, submenu arrows, or selection indicators. */
  itemTrailing?: T
  /** Container for keyboard shortcut hints at the end of a menu item. */
  itemKbds?: T
  /** Checked or selected-state indicator for checkbox and radio menu items. */
  itemIndicator?: T
  /** Indicator shown when a menu item opens a submenu. */
  itemSub?: T
}

export type OverlayMenuSharedClasses = OverlayMenuSharedSlots<SlotClassValue>

export type OverlayMenuSharedStyles = OverlayMenuSharedSlots<SlotStyleValue>

/**
 * Props provided to custom menu item render components.
 */
export interface OverlayMenuSharedItemRenderProps<TItem> {
  /**
   * The menu item object being rendered.
   */
  item: TItem

  /**
   * The nesting depth of the item (0 for root items).
   */
  depth: number

  /**
   * Whether the item is being rendered as a checkbox.
   */
  isCheckbox: boolean

  /**
   * Whether the item is being rendered as a radio item.
   */
  isRadio: boolean

  /**
   * Whether the item has nested children and triggers a submenu.
   */
  hasChildren: boolean
}
