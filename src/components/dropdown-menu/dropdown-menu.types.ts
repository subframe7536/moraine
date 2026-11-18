import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type {
  SlotClassValue,
  SlotStyleValue,
  OverlayAlign,
  OverlayPlacement,
} from '../../theme/style-types'
import type { IconT } from '../icon'
import type {
  OverlayMenuContentSlotProps,
  OverlayMenuItem,
  OverlayMenuItemRenderProps,
} from '../shared/overlay/menu'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../shared/overlay/trigger'

import type { DropdownMenuStyleSlot, DropdownMenuStyleVariants } from './dropdown-menu.style-types'

export namespace DropdownMenuT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = DropdownMenuStyleSlot<T>
  export type Variants = DropdownMenuStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = OverlayMenuItem
  export type ItemRenderProps = OverlayMenuItemRenderProps
  export type HeaderRenderProps = OverlayMenuContentSlotProps
  export type FooterRenderProps = OverlayMenuContentSlotProps

  /**
   * Base props for the DropdownMenu root component.
   */
  export interface Base {
    /**
     * Base for the generated trigger and content ids; the content id is `<id>-content`. Generated
     * when omitted.
     */
    id?: string
    /**
     * Controlled open state. While `undefined` the menu is uncontrolled and follows `defaultOpen`;
     * update it from `onOpenChange`.
     */
    open?: boolean
    /**
     * Initial open state when uncontrolled. Ignored when `open` is set.
     * @default false
     */
    defaultOpen?: boolean
    /**
     * Called with the next open state when the user opens or closes the menu, and when `disabled`
     * becomes `true` while it is open. It fires in controlled and uncontrolled mode alike, so a
     * controlled menu must write the value back to `open`.
     */
    onOpenChange?: (open: boolean) => void
    /**
     * Disables the trigger so the menu cannot be opened, and closes the menu if it is open.
     * @default false
     */
    disabled?: boolean
    /**
     * Preferred side of the trigger the content opens on (`'top'`, `'right'`, `'bottom'` or `'left'`).
     * The content may move to another side when `flip` is enabled and the preferred side lacks space.
     * @default 'bottom'
     */
    placement?: OverlayPlacement
    /**
     * Alignment of the content along the cross axis relative to the anchor: `'start'`, `'center'` or `'end'`.
     * @default 'start'
     */
    align?: OverlayAlign
    /**
     * Distance in pixels between the anchor and the content along the placement axis.
     * @default 4
     */
    gutter?: number
    /**
     * Offset in pixels along the cross axis, applied on top of `align`.
     * @default 0
     */
    shift?: number
    /**
     * Locks body scroll while the menu is open and renders the `overlay` slot element behind the
     * content. Set `false` to keep the page scrollable.
     * @default true
     */
    preventScroll?: boolean
    /**
     * Minimum distance in pixels kept between the content and the viewport edge when `flip` and
     * `slide` position it.
     * @default 4
     */
    overflowPadding?: number
    /**
     * Whether the content moves to the opposite side when the preferred `placement` does not fit.
     * A space-delimited string such as `'top left'` is an ordered list of fallback placements
     * (`top`, `bottom`, `left` or `right`, each optionally followed by `-start` or `-end`); an
     * invalid entry throws.
     * @default true
     */
    flip?: boolean | string
    /**
     * Whether the content may slide along the edge of the anchor so it stays inside the viewport
     * instead of being clipped.
     * @default true
     */
    slide?: boolean
    /**
     * Whether pressing Escape closes the menu. When `false`, Escape is ignored and `onClosePrevented`
     * is called.
     * @default true
     */
    closeOnEscape?: boolean
    /**
     * Whether a pointer press or focus move outside the menu closes it. When `false`, the attempt
     * is ignored and `onClosePrevented` is called.
     * @default true
     */
    closeOnOutsideClick?: boolean
    /**
     * Called when Escape or an outside interaction tries to close the menu but `closeOnEscape` or
     * `closeOnOutsideClick` is `false`.
     */
    onClosePrevented?: () => void
    /**
     * Whether the menu is modal: while it is open, content outside it is hidden from assistive
     * technology and the native default action of outside pointer presses is prevented. Outside
     * presses still dismiss the menu unless `closeOnOutsideClick` is `false`.
     * @default false
     */
    modal?: boolean
    /** Composed trigger and content primitives. */
    children?: JSX.Element
  }
  export type Props = BaseProps<never, Base, Variants, Classes, Styles, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = OverlayTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = OverlayTriggerComponentProps<T>

  export interface ContentBase {
    /**
     * Items rendered in the menu body. Each entry is an item object or an array of items; consecutive
     * plain entries form one group, and every array starts a new group, with a separator drawn
     * between groups. An item's `type` is `'item'` (the default), `'checkbox'`, `'radio-group'`
     * (with radio `items`), `'group'` (with a `label` and child `items`) or `'separator'`. An `'item'`
     * with `children` opens a submenu, `danger` marks a destructive item, and `onSelect` runs
     * when an item is activated.
     * @example
     * ```tsx
     * import { createSignal } from 'solid-js'
     * import { DropdownMenu } from 'moraine'
     *
     * const [showHidden, setShowHidden] = createSignal(false)
     *
     * <DropdownMenu>
     *   <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
     *   <DropdownMenu.Content
     *     items={[
     *       [{ label: 'Rename', onSelect: () => console.log('rename') }, { label: 'Delete', danger: true }],
     *       [{ type: 'checkbox', label: 'Show hidden', checked: showHidden(), onCheckedChange: setShowHidden }],
     *       { label: 'Share', children: [{ label: 'Copy link' }] },
     *     ]}
     *   />
     * </DropdownMenu>
     * ```
     */
    items?: (Item | Item[])[]
    /**
     * Replaces the inner content of every item row (icon, label, description, shortcut keys, submenu
     * indicator and checkmark); the row keeps its role, keyboard handling and selection. It is
     * mounted as a component and receives `item`, `depth` (`0` in the root menu, `1` and up in
     * submenus) and `hasChildren`. Read `item.type` to tell checkbox and radio items apart.
     * @example
     * ```tsx
     * import { DropdownMenu } from 'moraine'
     *
     * <DropdownMenu>
     *   <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
     *   <DropdownMenu.Content
     *     items={[{ label: 'Rename' }, { label: 'Share', children: [{ label: 'Copy link' }] }]}
     *     itemRender={(props) => (
     *       <span>
     *         {props.item.label}
     *         {props.hasChildren ? ' ›' : ''}
     *       </span>
     *     )}
     *   />
     * </DropdownMenu>
     * ```
     */
    itemRender?: Component<ItemRenderProps>
    /**
     * Content rendered above the item groups, in the root menu and in every submenu. A function is
     * mounted as a component and receives `{ sub }`, which is `true` inside a submenu.
     * @example
     * ```tsx
     * import { DropdownMenu } from 'moraine'
     *
     * <DropdownMenu>
     *   <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
     *   <DropdownMenu.Content
     *     items={[{ label: 'Rename' }]}
     *     headerRender={(props) => <div>{props.sub ? 'More actions' : 'Actions'}</div>}
     *   />
     * </DropdownMenu>
     * ```
     */
    headerRender?: JSX.Element | Component<HeaderRenderProps>
    /**
     * Content rendered below the item groups, in the root menu and in every submenu. A function is
     * mounted as a component and receives `{ sub }`, which is `true` inside a submenu.
     */
    footerRender?: JSX.Element | Component<FooterRenderProps>
    /**
     * Icon shown on checked checkbox and radio items.
     * @default 'icon-check'
     */
    checkedIcon?: IconT.Name
    /**
     * Icon shown at the end of items that open a submenu.
     * @default 'icon-chevron-right'
     */
    expandIcon?: IconT.Name
  }

  /**
   * Props for the DropdownMenu content component.
   */
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never>
}

/**
 * Props for the DropdownMenu component.
 */
export type DropdownMenuProps = DropdownMenuT.Props
