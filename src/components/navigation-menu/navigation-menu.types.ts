import type { Component, JSX } from 'solid-js'

import type {
  BaseProps,
  ElementProps,
  TriggerBase as SharedTriggerBase,
  ValidComponent,
} from '../../shared/types'
import type { OverlayAlign, SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { PopperContentOptions } from '../shared/overlay/popper.types'

import type {
  NavigationMenuStyleSlot,
  NavigationMenuStyleVariants,
} from './navigation-menu.style-types'

export namespace NavigationMenuT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = NavigationMenuStyleSlot<T>
  export type Variants = NavigationMenuStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base extends Pick<
    PopperContentOptions,
    'placement' | 'shift' | 'overflowPadding' | 'flip' | 'slide'
  > {
    /**
     * Alignment of the panel relative to the active trigger: `'start'`, `'center'` or `'end'`.
     * @default center
     */
    align?: OverlayAlign
    /** Gap between the trigger and panel, in pixels. @default 8 */
    gutter?: number
    /**
     * Controlled `value` of the open `NavigationMenu.Item`. `undefined` keeps the menu
     * uncontrolled; `null` keeps it controlled and closed. A value that matches no enabled item
     * with content leaves the menu closed. Update it from `onValueChange`.
     */
    value?: string | null
    /**
     * `value` of the item that is open initially when uncontrolled; omit to start closed. Ignored
     * when `value` is set.
     */
    defaultValue?: string
    /**
     * Called with the `value` of the item that should open, or `null` when the menu should close,
     * after hover, click, keyboard or dismissal. It only fires when the value changes and fires in
     * controlled mode too, so a controlled menu must write it back to `value`.
     */
    onValueChange?: (value: string | null) => void
    /**
     * Disables every trigger and link in the menu: panels cannot open (an open panel closes) and
     * links lose their `href` and are marked `aria-disabled`.
     * @default false
     */
    disabled?: boolean
    /**
     * Delay in milliseconds between a mouse pointer entering a trigger and its panel opening while
     * no panel is open. Hovering another trigger while a panel is open switches immediately, and
     * click or keyboard activation never waits.
     * @default 50
     */
    openDelay?: number
    /**
     * Delay in milliseconds between the pointer leaving the menu and the open panel closing. The
     * panel stays open while focus is inside it, and moving across the gap toward the panel is
     * tolerated.
     * @default 50
     */
    closeDelay?: number
    /** Composed navigation parts. */
    children?: JSX.Element
  }
  export type Props = BaseProps<'nav', Base, Variants, Classes, Styles>

  export interface ListBase {}
  export type ListProps = BaseProps<'ul', ListBase, never, never, never, 'ul', true>

  export interface ItemBase {
    /** Unique item value. Generated when omitted; set explicitly for controlled usage. */
    value?: string
    /** Disable this item's trigger or direct links. @default false */
    disabled?: boolean
    children?: JSX.Element
  }
  export type ItemProps = BaseProps<'li', ItemBase, never, never, never>

  export type TriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T>
  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface ContentBase {}
  export type ContentProps = BaseProps<'div', ContentBase, never, never, never, 'div', true>

  /** Native anchor props passed to a custom link component, including its ref and handlers. */
  export type LinkRenderProps = ElementProps<
    HTMLAnchorElement,
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>
  >
  export interface LinkBase {
    /**
     * Marks this link as the current page by setting `aria-current="page"`.
     * @default false
     */
    active?: boolean
    /**
     * Disables the link: it loses its `href`, gets `aria-disabled` and `tabIndex={-1}`, and clicks
     * are prevented. A link is also disabled when its `NavigationMenu` or `NavigationMenu.Item` is.
     * @default false
     */
    disabled?: boolean
    /**
     * Closes the open panel when the link is clicked, unless a click handler calls
     * `preventDefault()`.
     * @default true
     */
    closeOnSelect?: boolean
    /**
     * Renders the link with a custom component, such as a router link, instead of `<a>`. It is
     * mounted as a component and receives the merged anchor props (`href`, `class`, `ref`, ARIA
     * attributes and event handlers), all of which it must forward to its anchor.
     * @example
     * ```tsx
     * import { NavigationMenu } from 'moraine'
     * import type { NavigationMenuT } from 'moraine'
     *
     * const RouterLink = (props: NavigationMenuT.LinkRenderProps) => <a {...props} />
     *
     * <NavigationMenu aria-label="Main navigation">
     *   <NavigationMenu.List>
     *     <NavigationMenu.Item>
     *       <NavigationMenu.Link href="/docs" linkRender={RouterLink}>
     *         Documentation
     *       </NavigationMenu.Link>
     *     </NavigationMenu.Item>
     *   </NavigationMenu.List>
     * </NavigationMenu>
     * ```
     */
    linkRender?: Component<LinkRenderProps>
    children?: JSX.Element
  }
  export type LinkProps = BaseProps<'a', LinkBase, never, never, never>
}

export type NavigationMenuProps = NavigationMenuT.Props
