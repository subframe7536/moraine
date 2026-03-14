import type { JSX } from 'solid-js'

import type { IconName } from '../../elements/icon'
import type { SlotClasses, SlotStyles } from '../../shared/slot'

import type { OverlayMenuItems } from './utils'

export type OverlayMenuItemType = 'item' | 'label' | 'separator' | 'checkbox'

/**
 * Shared interface for menu items used in overlays like ContextMenu and DropdownMenu.
 */
export interface OverlayMenuSharedItem<TColor extends string, TItem> {
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
  icon?: IconName | JSX.Element

  /**
   * Array of keyboard shortcuts to display as keys.
   */
  kbds?: string[]

  /**
   * Color theme variant for the menu item.
   */
  color?: TColor

  /**
   * Whether the item is non-interactive.
   * @default false
   */
  disabled?: boolean

  /**
   * Controlled checked state for checkbox items.
   */
  checked?: boolean

  /**
   * Initial checked state for uncontrolled checkbox items.
   */
  defaultChecked?: boolean

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
  children?: OverlayMenuItems<TItem>

  /**
   * Event handler called when the item is activated.
   */
  onSelect?: () => void

  /**
   * Event handler called when a checkbox item's state changes.
   */
  onCheckedChange?: (checked: boolean) => void
}

type OverlayMenuSharedSlots =
  | 'trigger'
  | 'content'
  | 'group'
  | 'label'
  | 'separator'
  | 'item'
  | 'itemLeading'
  | 'itemWrapper'
  | 'itemLabel'
  | 'itemDescription'
  | 'itemTrailing'
  | 'itemKbds'
  | 'itemIndicator'
  | 'itemSub'

export type OverlayMenuSharedClasses = SlotClasses<OverlayMenuSharedSlots>

export type OverlayMenuSharedStyles = SlotStyles<OverlayMenuSharedSlots>

/**
 * Context provided to custom menu item render functions.
 */
export interface OverlayMenuSharedItemRenderContext<TItem> {
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
   * Whether the item has nested children and triggers a submenu.
   */
  hasChildren: boolean
}
