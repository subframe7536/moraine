import type { JSX } from '@solidjs/web'
import type { Component } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue, OverlayAlign } from '../../theme/style-types'
import type { IconT } from '../icon'
import type {
  OverlayMenuContentSlotProps,
  OverlayMenuItem,
  OverlayMenuItemRenderProps,
} from '../shared/overlay/menu'
import type { OverlayTriggerBase, OverlayTriggerComponentProps } from '../shared/overlay/trigger'
import type {
  OverlayDisclosureProps,
  OverlayDismissProps,
  OverlayPortalProps,
  OverlayPositionProps,
} from '../shared/overlay/types'

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
  export interface Base
    extends OverlayDisclosureProps, OverlayDismissProps, OverlayPortalProps, OverlayPositionProps {
    /**
     * Base for the generated trigger and content ids; the content id is `<id>-content`. Generated
     * when omitted.
     */
    id?: string
    /**
     * Disables the trigger so the menu cannot be opened, and closes the menu if it is open.
     * @default false
     */
    disabled?: boolean
    /**
     * Alignment of the content along the cross axis relative to the anchor: `'start'`, `'center'` or `'end'`.
     * @default 'start'
     */
    align?: OverlayAlign
    /**
     * Locks body scroll while the menu is open. Set `false` to keep the page scrollable.
     * @default true
     */
    preventScroll?: boolean
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
     * (with radio `children`), `'group'` (with a `label` and `children`) or `'separator'`. An `'item'`
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
    items?: Array<Item | Array<Item>>
    /**
     * Replaces the inner content of every item row (icon, label, shortcut keys, submenu
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
     * Component mounted above the item groups, once in the root menu and once in every open
     * submenu. It receives `{ sub }`, which is `true` inside a submenu. A component rather than a
     * JSX element because each menu layer mounts its own instance.
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
    headerRender?: Component<HeaderRenderProps>
    /**
     * Component mounted below the item groups, once in the root menu and once in every open
     * submenu. It receives `{ sub }`, which is `true` inside a submenu.
     * @example
     * ```tsx
     * import { DropdownMenu } from 'moraine'
     *
     * <DropdownMenu>
     *   <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
     *   <DropdownMenu.Content
     *     items={[{ label: 'Rename' }]}
     *     footerRender={(props) => <small>{props.sub ? 'Submenu' : 'Signed in as Alex'}</small>}
     *   />
     * </DropdownMenu>
     * ```
     */
    footerRender?: Component<FooterRenderProps>
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
