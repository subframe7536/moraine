import type { ClassValue } from 'cn'
import type { JSX } from 'solid-js'

import type { IconT } from '../../../element/icon'
import type { OverlayAlign, OverlayPlacement } from '../../../theme/style-types'
import type { SlotBinding as ComponentSlotBinding } from '../../../theme/use-recipe'

import type { OverlayMenuFocusStrategy, OverlayMenuAnchorRect } from './menu.utils'
import type { OverlayMenuStyleSlot } from './style-types'

export type OverlayMenuContentSlot = (context: { sub: boolean }) => JSX.Element

export type OverlayMenuItemType = 'item' | 'separator' | 'checkbox' | 'radio' | 'group'

export interface OverlayMenuBaseItem {
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
   * Custom CSS class applied to the item element.
   */
  class?: ClassValue

  /**
   * Custom inline styles applied to the item element.
   */
  style?: JSX.CSSProperties

  /**
   * Visual treatment of the menu item.
   * @default 'default'
   */
  variant?: 'default' | 'danger'

  /**
   * Whether the item is non-interactive.
   * @default false
   */
  disabled?: boolean
}

export interface OverlayMenuActionItem extends OverlayMenuBaseItem {
  type?: 'item'

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
  children?: OverlayMenuItem[]

  /**
   * Event handler called when the item is activated.
   */
  onSelect?: () => void
}

export interface OverlayMenuCheckboxItem extends OverlayMenuBaseItem {
  type: 'checkbox'

  /**
   * Controlled checked state for checkbox items.
   */
  checked?: boolean

  /**
   * Initial checked state for uncontrolled checkbox items.
   */
  defaultChecked?: boolean

  /**
   * Event handler called when a checkbox item's state changes.
   */
  onCheckedChange?: (checked: boolean) => void

  /**
   * Event handler called when the item is activated.
   */
  onSelect?: () => void
}

export interface OverlayMenuRadioItem extends OverlayMenuBaseItem {
  type: 'radio'

  /**
   * Radio group identifier. Radio items with the same group are mutually exclusive.
   */
  group?: string

  /**
   * Radio item value reported by onValueChange and used for grouped selection.
   */
  value?: string

  /**
   * Controlled checked state for radio items.
   */
  checked?: boolean

  /**
   * Initial checked state for uncontrolled radio items.
   */
  defaultChecked?: boolean

  /**
   * Event handler called when a radio item is selected.
   */
  onValueChange?: (value: string) => void

  /**
   * Event handler called when a radio item's checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void

  /**
   * Event handler called when the item is activated.
   */
  onSelect?: () => void
}

export interface OverlayMenuGroupItem extends OverlayMenuBaseItem {
  type: 'group'

  /**
   * Child items in this group.
   */
  items?: OverlayMenuItem[]

  /**
   * Backward-compatible alias for `items`.
   */
  children?: OverlayMenuItem[]
}

export interface OverlayMenuSeparatorItem extends OverlayMenuBaseItem {
  type: 'separator'
}

export type OverlayMenuItem =
  | OverlayMenuActionItem
  | OverlayMenuCheckboxItem
  | OverlayMenuRadioItem
  | OverlayMenuGroupItem
  | OverlayMenuSeparatorItem

/**
 * Backward-compatible alias for OverlayMenuItem.
 */
export type OverlayMenuSharedItem<_TItem = OverlayMenuItem> = OverlayMenuItem

export type OverlayMenuSharedSlots<T = unknown> = OverlayMenuStyleSlot<T>
export type OverlayMenuSlotBinding = (slot: keyof OverlayMenuSharedSlots) => ComponentSlotBinding

/**
 * Props provided to custom menu item render components.
 */
export interface OverlayMenuItemRenderProps<TItem = OverlayMenuItem> {
  item: TItem
  depth: number
  isCheckbox: boolean
  isRadio: boolean
  hasChildren: boolean
}

/**
 * Backward-compatible alias for OverlayMenuItemRenderProps.
 */
export type OverlayMenuSharedItemRenderProps<TItem = OverlayMenuItem> =
  OverlayMenuItemRenderProps<TItem>

export interface OverlayMenuProps<TItem extends OverlayMenuItem = OverlayMenuItem> {
  owner: 'dropdown-menu' | 'context-menu'

  /**
   * Additional HTML attributes to forward to the menu content element.
   */
  elementAttrs?: JSX.HTMLAttributes<HTMLDivElement>

  /**
   * Items rendered in the menu body. Supports flat items, explicit group objects, or array-of-arrays.
   */
  items?: (TItem | TItem[])[]

  /**
   * Whether the overlay menu is open.
   */
  open: boolean

  /**
   * Called when the overlay menu should close.
   */
  onClose: () => void

  /**
   * Trigger element used as the position reference.
   */
  triggerElement?: HTMLElement

  /**
   * Preferred content placement relative to the trigger or anchor point.
   */
  placement?: OverlayPlacement

  /**
   * Alignment along the cross axis.
   * @default 'start'
   */
  align?: OverlayAlign

  /**
   * Gap between the anchor and the content.
   * @default 0
   */
  gutter?: number

  /**
   * Cross-axis or alignment offset relative to the anchor.
   * @default 0
   */
  shift?: number

  /**
   * Padding applied to the overflow area when calculating the menu's position.
   * @default 4
   */
  overflowPadding?: number

  /**
   * Whether body scroll should be locked while the menu is open.
   * @default true
   */
  preventScroll?: boolean

  /**
   * Strategy used to auto-focus the menu after it is positioned.
   */
  autoFocusStrategy?: OverlayMenuFocusStrategy

  /**
   * Resolve a virtual anchor rectangle when the menu is anchored to a point.
   */
  getAnchorRect?: (anchor?: HTMLElement) => OverlayMenuAnchorRect | undefined

  /**
   * Called after an auto-focus strategy has been handled.
   */
  onAutoFocusHandled?: () => void

  /**
   * Unique base id used to derive trigger and content ids.
   */
  id?: string

  /**
   * Icon used for checked checkbox items.
   * @default 'icon-check'
   */
  checkedIcon?: IconT.Name

  /**
   * Icon used for submenu trigger items.
   * @default 'icon-chevron-right'
   */
  submenuIcon?: IconT.Name

  /**
   * Unified slot class and style resolver.
   */
  slotBinding: OverlayMenuSlotBinding

  /**
   * Content rendered before the resolved item groups.
   */
  contentTop?: OverlayMenuContentSlot

  /**
   * Content rendered after the resolved item groups.
   */
  contentBottom?: OverlayMenuContentSlot

  /**
   * Renderer for each menu item.
   */
  itemRender?: (props: OverlayMenuItemRenderProps<TItem>) => JSX.Element

  /**
   * Pointer down handler for the content wrapper.
   */
  onContentPointerDown?: JSX.EventHandler<HTMLDivElement, PointerEvent>

  /**
   * Context menu handler for the content wrapper.
   */
  onContentContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent>
}

/**
 * Backward-compatible alias for OverlayMenuProps.
 */
export type OverlayMenuSharedProps<TItem extends OverlayMenuItem = OverlayMenuItem> =
  OverlayMenuProps<TItem>

/**
 * Backward-compatible alias for root props.
 */
export interface OverlayMenuRootProps<
  TItem extends OverlayMenuItem = OverlayMenuItem,
> extends Partial<OverlayMenuProps<TItem>> {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}
