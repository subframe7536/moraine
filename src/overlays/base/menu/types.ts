import type { JSX } from 'solid-js'

import type { IconT } from '../../../elements/icon'
import type { SlotBinding as ComponentSlotBinding } from '../../../shared/provider/create-component-styles'
import type { ComponentOrElement } from '../../../shared/render-prop'
import type { SlotClassValue, SlotStyleValue, ElementProps } from '../../../shared/types'

import type { OverlayMenuFocusStrategy, OverlayMenuAnchorRect } from './menu.utils'

export interface OverlayMenuItemVariantProps {
  color?: 'default' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

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
  /** Element that opens the menu. */
  trigger?: T
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

export type OverlayMenuSlotBinding = (slot: keyof OverlayMenuSharedSlots) => ComponentSlotBinding

/**
 * OverlayMenuProps provided to custom menu item render components.
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
/** Shared overlay menu props used by the shell, root wrappers, and layers. */
export interface OverlayMenuSharedProps<TItem extends OverlayMenuSharedItem<TItem>> {
  /**
   * Whether body scroll should be locked while the menu is open.
   * @default true
   */
  preventScroll?: boolean

  /** Unique base id used to derive trigger and content ids. */
  id?: string

  /**
   * Icon used for checked checkbox items.
   * @default 'icon-check'
   */
  checkedIcon?: IconT.Name

  /** Slot class overrides for menu sections. */
  classes?: OverlayMenuSharedClasses

  /** Unified slot class and style resolver. */
  slotBinding?: OverlayMenuSlotBinding

  /** Content rendered after the resolved item groups. */
  contentBottom?: OverlayMenuContentSlot

  /** Content rendered before the resolved item groups. */
  contentTop?: OverlayMenuContentSlot

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

  /** Custom renderer for individual items. */
  itemRender?: ComponentOrElement<OverlayMenuSharedItemRenderProps<TItem>>

  /** Additional attributes for each menu layer content element. */
  contentProps?: ElementProps<HTMLDivElement>

  /** Additional attributes for an interactive menu item. */
  itemProps?: (
    context: OverlayMenuSharedItemRenderProps<TItem>,
  ) => ElementProps<HTMLDivElement> | undefined

  /** Items rendered in the menu body. */
  items?: TItem[]

  /**
   * Padding applied to the overflow area when calculating the menu's position.
   * @default 4
   */
  overflowPadding?: number

  /**
   * Preferred content placement relative to the trigger or anchor point.
   */
  placement?: OverlayMenuPlacement

  /**
   * Menu item size variant.
   * @default 'md'
   */
  size?: NonNullable<OverlayMenuItemVariantProps['size']>

  /** Slot style overrides for menu sections. */
  styles?: OverlayMenuSharedStyles

  /**
   * Icon used for submenu trigger items.
   * @default 'icon-chevron-right'
   */
  submenuIcon?: IconT.Name
}

export interface OverlayMenuProps<
  TItem extends OverlayMenuSharedItem<TItem>,
> extends OverlayMenuSharedProps<TItem> {
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

  /** Called when the overlay menu should close. */
  onClose: () => void

  /** Pointer down handler for the content wrapper. */
  onContentPointerDown?: JSX.EventHandler<HTMLDivElement, PointerEvent>

  /** Context menu handler for the content wrapper. */
  onContentContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent>

  /** Whether the overlay menu content is open. */
  open: boolean

  /** Trigger element used as the position reference. */
  triggerElement?: HTMLElement
}

export interface OverlayMenuRootProps<TItem extends OverlayMenuSharedItem<TItem>> extends Omit<
  OverlayMenuSharedProps<TItem>,
  'slotBinding'
> {
  /** Controlled open state of the menu. */
  open?: boolean

  /**
   * Initial open state when the component is uncontrolled.
   * @default false
   */
  defaultOpen?: boolean

  /** Called whenever the menu requests an open state change. */
  onOpenChange?: (open: boolean) => void

  /**
   * Whether trigger interactions should be ignored.
   * @default false
   */
  disabled?: boolean
}
