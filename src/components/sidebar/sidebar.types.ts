import type { Accessor, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type {
  BaseProps,
  TriggerBase as SharedTriggerBase,
  ValidComponent,
} from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { defaultSidebarMessages } from './sidebar.messages'
import type { SidebarStyleSlot, SidebarStyleVariants } from './sidebar.style-types'

export namespace SidebarT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = SidebarStyleSlot<T>

  export type Variants = SidebarStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultSidebarMessages>
  export type Translations = Partial<Messages>

  export type State = 'expanded' | 'collapsed'

  export interface Context {
    side: 'left' | 'right'
    variant?: Variants['variant'] | null
    state: Accessor<State>
    isMobile: Accessor<boolean>
    isOpen: Accessor<boolean>
    setOpen: (open: boolean) => void
    toggle: () => void
    panelId: Accessor<string>
    translations?: Accessor<Translations | undefined>
  }

  export interface Base {
    /** Localized message overrides for this sidebar instance. */
    translations?: Translations
    /** Controlled open state on desktop. */
    open?: boolean
    /**
     * Default open state on desktop.
     * @default true
     */
    defaultOpen?: boolean
    /** Callback invoked when desktop open state changes. */
    onOpenChange?: (open: boolean) => void
    /** Controlled mobile mode. When omitted, `matchMedia` uses `breakpoint`. */
    isMobile?: boolean
    /**
     * Controlled desktop panel width in pixels. When `undefined` the
     * `--mo-sidebar-width` custom property is left unset and the recipe
     * default (`var(--sidebar-width, clamp(14rem, 25%, 20rem))`) applies.
     */
    width?: number
    /** Initial desktop panel width in pixels for uncontrolled usage. */
    defaultWidth?: number
    /** Called with the pixel width on every width change. */
    onWidthChange?: (width: number) => void
    /**
     * Called once per completed interaction with the final pixel width:
     * at the end of a `Sidebar.Rail` drag that changed the width, and on
     * each keyboard width change.
     */
    onWidthCommit?: (width: number) => void
    /** Minimum desktop panel width in pixels for `Sidebar.Rail` resizing. @default 224 */
    minWidth?: number
    /** Maximum desktop panel width in pixels for `Sidebar.Rail` resizing. @default 480 */
    maxWidth?: number
    /**
     * Max viewport width in pixels that counts as mobile.
     * Used as `(max-width: ${breakpoint}px)` when `isMobile` is omitted.
     * @default 768
     */
    breakpoint?: number
    /** Stable identifier used for associating Trigger `aria-controls` with Panel. */
    panelId?: string
    children?: JSX.Element
  }

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>

  export interface RailBase {
    /** Disables pointer, keyboard, and click resizing. */
    disabled?: boolean
    /**
     * Accessible name for the resize separator.
     * Localized via MoraineProvider messages when omitted. English default is `Resize sidebar`.
     */
    'aria-label'?: string
  }
  export type RailProps = BaseProps<'div', RailBase, never, never, never>

  export interface PanelBase<T extends ValidComponent = 'aside'> {
    children?: JSX.Element
    as?: T
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
    /**
     * Accessible name for the mobile navigation Drawer. Native aria-label takes precedence;
     * title is used when neither native aria-label nor this prop is provided.
     * Localized via MoraineProvider messages when omitted. English default is `Sidebar navigation`.
     */
    'aria-label'?: string
  }

  export type PanelProps<T extends ValidComponent = 'aside'> = BaseProps<
    T,
    PanelBase<T>,
    never,
    never,
    never,
    'aside'
  >

  export interface HeaderBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type HeaderProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    HeaderBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface ContentBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type ContentProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ContentBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface FooterBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type FooterProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    FooterBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface InsetBase<T extends ValidComponent = 'main'> {
    children?: JSX.Element
    as?: T
  }
  export type InsetProps<T extends ValidComponent = 'main'> = BaseProps<
    T,
    InsetBase<T>,
    never,
    never,
    never,
    'main'
  >

  export type TriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface GroupBase<T extends ValidComponent = 'div'> {
    as?: T
    children?: JSX.Element
  }
  export type GroupProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    GroupBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface GroupLabelBase<T extends ValidComponent = 'div'> {
    children?: JSX.Element
    as?: T
  }
  export type GroupLabelProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    GroupLabelBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface MenuBase<T extends ValidComponent = 'ul'> {
    as?: T
    /** `MenuItem` entries. */
    children?: JSX.Element
  }
  export type MenuProps<T extends ValidComponent = 'ul'> = BaseProps<
    T,
    MenuBase<T>,
    never,
    never,
    never,
    'ul'
  >

  export interface MenuItemBase<T extends ValidComponent = 'li'> {
    as?: T
    /** A `MenuButton` with an optional `MenuAction`, or a `MenuSub`. */
    children?: JSX.Element
  }

  export type MenuItemProps<T extends ValidComponent = 'li'> = BaseProps<
    T,
    MenuItemBase<T>,
    never,
    never,
    never,
    'li'
  >

  export type MenuButtonBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
    href?: string
    isActive?: boolean
    leading?: IconT.Name
    trailing?: IconT.Name
    /**
     * Whether activating this button on mobile closes the drawer.
     * When omitted, buttons with `href` close the drawer.
     */
    closeOnSelect?: boolean
  }

  export type MenuButtonProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    MenuButtonBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface MenuActionBase<T extends ValidComponent = 'div'> {
    as?: T
    /**
     * Controls placed over the end of the enclosing `MenuItem`'s first row, such as a dropdown
     * menu trigger. The `MenuButton` stays highlighted while the pointer is over these controls.
     */
    children?: JSX.Element
  }

  export type MenuActionProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    MenuActionBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface MenuSubBase {
    /** A `MenuSubTrigger` followed by a `MenuSubContent`. */
    children?: JSX.Element
    /** Controlled expanded state. */
    open?: boolean
    /**
     * Initial expanded state when uncontrolled.
     * @default false
     */
    defaultOpen?: boolean
    /** Callback invoked when the expanded state changes. */
    onOpenChange?: (open: boolean) => void
    /**
     * Whether the trigger is disabled.
     * @default false
     */
    disabled?: boolean
    /**
     * Whether to animate the content height.
     * @default false
     */
    transition?: boolean
    /**
     * Whether to unmount the content when collapsed.
     * @default true
     */
    unmountOnHide?: boolean
  }

  export type MenuSubProps = BaseProps<'div', MenuSubBase, never, never, never>

  export type MenuSubTriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
    leading?: IconT.Name
    /**
     * Disclosure icon that rotates while expanded.
     * @default 'i-lucide:chevron-right'
     */
    trailing?: IconT.Name
  }

  export type MenuSubTriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    MenuSubTriggerBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface MenuSubContentBase<T extends ValidComponent = 'ul'> {
    as?: T
    /** Nested `MenuItem` entries. */
    children?: JSX.Element
  }
  export type MenuSubContentProps<T extends ValidComponent = 'ul'> = BaseProps<
    T,
    MenuSubContentBase<T>,
    never,
    never,
    never,
    'ul'
  >
}

export type SidebarProps = SidebarT.Props
