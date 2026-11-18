import type { ReferenceElement } from '@floating-ui/dom'
import type { ClassValue } from 'cn'
import type { Accessor, Component, JSX } from 'solid-js'

import type { OverlayAlign, OverlayPlacement } from '../../../../theme/style-types'
import type { SlotBinding as ComponentSlotBinding } from '../../../../theme/use-recipe'
import type { IconT } from '../../../icon'

import type {
  OverlayMenuAnchorRect,
  OverlayMenuCloseOptions,
  OverlayMenuFocusStrategy,
  OverlayMenuLayerState,
} from './menu.utils'
import type { OverlayMenuStyleSlot } from './style-types'

export interface OverlayMenuContentSlotProps {
  /** `true` when the content is rendered inside a submenu, `false` for the root menu. */
  sub: boolean
}

export type OverlayMenuItemType =
  | 'item'
  | 'separator'
  | 'checkbox'
  | 'radio-group'
  | 'radio'
  | 'group'

export interface OverlayMenuBaseItem {
  /**
   * Text or element shown as the item's primary text. A string `label` is also what typeahead
   * matches; otherwise the item's rendered text is used. When the menu content has an `itemRender`,
   * it replaces the default rendering of `label`, `description`, `icon` and `kbds`.
   */
  label?: JSX.Element

  /**
   * Secondary text shown below the label.
   */
  description?: JSX.Element

  /**
   * Name of the icon shown at the start of the item.
   */
  icon?: IconT.Name

  /**
   * Keys shown as keycaps at the end of the item, for example `['Ctrl', 'S']`. Display only: it
   * does not register a keyboard shortcut. Not shown on items that open a submenu.
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
   * Visual treatment of the menu item. `'danger'` uses the danger text color for destructive
   * actions and sets `data-danger` on the item.
   * @default 'default'
   */
  variant?: 'default' | 'danger'

  /**
   * Whether the item is non-interactive: it ignores activation (no `onSelect`, no closing) and
   * exposes `aria-disabled`.
   * @default false
   */
  disabled?: boolean
}

export interface OverlayMenuActionItem extends OverlayMenuBaseItem {
  type?: 'item'

  /**
   * Controlled open state of the submenu. Only applies to items with `children`; leave it
   * `undefined` to let the item manage its own state (see `defaultOpen`).
   */
  open?: boolean

  /**
   * Initial open state of the submenu when `open` is not set.
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Called with the next open state when the submenu opens (pointer hover delay, click or arrow
   * key) or closes. Not called when `open` is changed from outside.
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Items of the submenu, in the same shape as the menu `items` (flat items and `group` objects).
   * A non-empty list makes the item open a submenu instead of calling `onSelect`, and shows the
   * menu's `submenuIcon` in place of `kbds`.
   * @example
   * ```tsx
   * import { Button, DropdownMenu } from 'moraine'
   *
   * <DropdownMenu>
   *   <DropdownMenu.Trigger as={Button}>Share</DropdownMenu.Trigger>
   *   <DropdownMenu.Content
   *     items={[
   *       { label: 'Copy link', onSelect: () => console.log('copied') },
   *       { label: 'Send to', children: [{ label: 'Email' }, { label: 'Slack' }] },
   *     ]}
   *   />
   * </DropdownMenu>
   * ```
   */
  children?: OverlayMenuItem[]

  /**
   * Called when the item is activated by click, Enter or Space, before the whole menu closes and
   * focus returns to the trigger. Not called for disabled items or items that open a submenu.
   */
  onSelect?: () => void
}

export interface OverlayMenuCheckboxItem extends OverlayMenuBaseItem {
  type: 'checkbox'

  /**
   * Controlled checked state. Leave it `undefined` to let the item manage its own state (see
   * `defaultChecked`); when set, update it from `onCheckedChange`.
   */
  checked?: boolean

  /**
   * Initial checked state when `checked` is not set.
   * @default false
   */
  defaultChecked?: boolean

  /**
   * Called with the next checked state each time the user toggles the item. The menu stays open.
   */
  onCheckedChange?: (checked: boolean) => void

  /**
   * Called after `onCheckedChange` each time the item is toggled. The menu stays open.
   */
  onSelect?: () => void
}

export interface OverlayMenuRadioItem extends OverlayMenuBaseItem {
  type: 'radio'

  /**
   * Value this item selects in its parent radio group; the item shows as checked while the
   * group's selected value equals it.
   */
  value: string

  /**
   * Called after the group's `onValueChange` each time the item is chosen. The menu stays open.
   */
  onSelect?: () => void
}

export interface OverlayMenuRadioGroupItem extends OverlayMenuBaseItem {
  type: 'radio-group'

  /**
   * Radio items in this group. Selecting one unchecks the others. The group's `label`, when set,
   * is rendered as its heading.
   */
  items?: OverlayMenuRadioItem[]

  /**
   * Controlled selected value, matched against each radio item's `value`. Leave it `undefined`
   * to let the group manage its own state (see `defaultValue`).
   */
  value?: string

  /**
   * Initial selected value when `value` is not set.
   */
  defaultValue?: string

  /**
   * Called with the `value` of the radio item the user chose. The menu stays open.
   */
  onValueChange?: (value: string) => void
}

export interface OverlayMenuGroupItem extends OverlayMenuBaseItem {
  type: 'group'

  /**
   * Child items in this group. The group's `label`, when set, is rendered as a non-interactive
   * heading above the items.
   */
  items?: OverlayMenuItem[]
}

export interface OverlayMenuSeparatorItem extends OverlayMenuBaseItem {
  type: 'separator'
}

export type OverlayMenuItem =
  | OverlayMenuActionItem
  | OverlayMenuCheckboxItem
  | OverlayMenuRadioGroupItem
  | OverlayMenuGroupItem
  | OverlayMenuSeparatorItem

export type OverlayMenuSharedSlots<T = unknown> = OverlayMenuStyleSlot<T>
export type OverlayMenuSlotBinding = (slot: keyof OverlayMenuSharedSlots) => ComponentSlotBinding

/**
 * Props provided to custom menu item render components.
 */
export interface OverlayMenuItemRenderProps<TItem = OverlayMenuItem> {
  /** The item being rendered; a radio item (`type: 'radio'`) for entries of a radio group. */
  item: TItem | OverlayMenuRadioItem
  /** Nesting level of the menu that holds the item: `0` for the root menu, plus one per submenu level. */
  depth: number
  /** Whether the item opens a submenu. */
  hasChildren: boolean
}

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
   * @default 4
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
   * Whether to flip placement when the preferred side lacks space.
   * @default true
   */
  flip?: boolean | string

  /**
   * Whether the menu may slide along its main axis to remain visible.
   * @default true
   */
  slide?: boolean

  /**
   * Whether Escape dismisses the menu.
   * @default true
   */
  closeOnEscape?: boolean

  /**
   * Whether outside interaction, pointer or focus, dismisses the menu.
   * @default true
   */
  closeOnOutsideClick?: boolean

  /** Called when a dismissal attempt is blocked. */
  onClosePrevented?: () => void

  /**
   * Whether outside content is hidden from assistive technology and outside pointer events have
   * their native default action prevented while the menu is open.
   * @default false
   */
  modal?: boolean

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
  headerRender?: JSX.Element | Component<OverlayMenuContentSlotProps>

  /**
   * Content rendered after the resolved item groups.
   */
  footerRender?: JSX.Element | Component<OverlayMenuContentSlotProps>

  /**
   * Renderer for each menu item.
   */
  itemRender?: Component<OverlayMenuItemRenderProps<TItem>>

  /**
   * Pointer down handler for the content wrapper.
   */
  onContentPointerDown?: JSX.EventHandler<HTMLDivElement, PointerEvent>

  /**
   * Context menu handler for the content wrapper.
   */
  onContentContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent>
}

export interface OverlayMenuLayerProps<
  TItem extends OverlayMenuItem = OverlayMenuItem,
> extends Omit<OverlayMenuProps<TItem>, 'onClose'> {
  ariaLabelledBy?: string
  close: (options?: OverlayMenuCloseOptions) => void
  closeOnTab: (direction: 'forward' | 'backward') => void
  closeRoot: (options?: OverlayMenuCloseOptions) => void
  depth: number
  getReferenceElement: () => ReferenceElement | undefined
  parentLayer?: OverlayMenuLayerState
  present: Accessor<boolean>
  refState?: (state: OverlayMenuLayerState | undefined) => void
  registerBranch: (element: HTMLElement) => () => void
  /** Keeps this layer's content mounted through its exit animation. */
  registerPresenceElement: (element: HTMLElement) => () => void
}
