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

  /** Sidebar state returned by `Sidebar.useContext()` inside `Sidebar`. */
  export interface Context {
    /** Resolved `side` of the root. */
    side: 'start' | 'end'
    /** Resolved `variant` of the root. */
    variant?: Variants['variant'] | null
    /** Whether the panel currently renders in the mobile drawer. */
    mobile: Accessor<boolean>
    /** Open state of the active layout: the desktop panel or the mobile drawer. */
    open: Accessor<boolean>
    /**
     * Requests a new open state for the active layout; calls `onOpenChange` on desktop and
     * `onMobileOpenChange` on mobile when it differs.
     */
    setOpen: (open: boolean) => void
    /** Toggles the open state of the active layout. */
    toggle: () => void
    /** DOM `id` of `Sidebar.Panel`, for `aria-controls` on custom triggers. */
    panelId: Accessor<string>
    /** The root `translations` prop. */
    translations?: Accessor<Translations | undefined>
  }

  export interface Base {
    /**
     * Localized labels for this sidebar (`label` for the mobile drawer and `resize` for the rail
     * separator). Merged per key over the provider messages and English defaults.
     * @example
     * ```tsx
     * import { Sidebar } from 'moraine'
     *
     * <Sidebar translations={{ label: 'Navegación', resize: 'Cambiar tamaño' }}>
     *   <Sidebar.Panel />
     *   <Sidebar.Rail />
     * </Sidebar>
     * ```
     */
    translations?: Translations
    /**
     * Controlled open state of the desktop panel. The mobile drawer has its own state in
     * `mobileOpen`, so this value never opens the drawer.
     */
    open?: boolean
    /**
     * Initial open state of the desktop panel when `open` is uncontrolled.
     * @default true
     */
    defaultOpen?: boolean
    /**
     * Called with the next desktop open state when the user toggles the panel with
     * `Sidebar.Trigger` or `Sidebar.Rail` (click, `Enter`, or a drag that closes or reopens it).
     * Not called on mobile or when the layout switches.
     */
    onOpenChange?: (open: boolean) => void
    /**
     * Controlled open state of the mobile drawer. Ignored by the desktop panel.
     */
    mobileOpen?: boolean
    /**
     * Initial open state of the mobile drawer when `mobileOpen` is uncontrolled. Leaving the
     * mobile layout closes an uncontrolled drawer without calling `onMobileOpenChange`.
     * @default false
     */
    defaultMobileOpen?: boolean
    /**
     * Called with the next drawer open state when the user opens or closes the mobile drawer:
     * `Sidebar.Trigger`, Escape or overlay dismissal, and `Sidebar.MenuButton` with
     * `closeOnSelect`. Not called when the layout switches.
     */
    onMobileOpenChange?: (open: boolean) => void
    /**
     * Controlled mobile mode: `true` renders the panel in a drawer, `false` inline. When omitted,
     * a `matchMedia` query on `breakpoint` decides, and the server renders the desktop layout.
     */
    mobile?: boolean
    /**
     * Controlled desktop panel width in pixels. When `undefined` the
     * `--mo-sidebar-width` custom property is left unset and the recipe
     * default (`var(--sidebar-width, clamp(14rem, 25%, 20rem))`) applies.
     */
    width?: number
    /**
     * Initial desktop panel width in pixels for uncontrolled usage. Ignored while `width` is
     * controlled. When omitted, the recipe default width applies until the rail is resized.
     */
    defaultWidth?: number
    /**
     * Called with the new pixel width on every width change, including each step of a
     * `Sidebar.Rail` drag; use `onWidthCommit` to persist only the final value.
     */
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
     * Used as `(max-width: ${breakpoint}px)` when `mobile` is omitted.
     * @default 768
     */
    breakpoint?: number
    children?: JSX.Element
  }

  /** Props for the Sidebar component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>

  export interface RailBase<T extends ValidComponent = 'button'> {
    /**
     * Element or component to render as. A tag name (`'div'`) renders that element and narrows the
     * other props to its attributes; a Solid component receives the props the rail would put on
     * its element, so it should spread them onto its root and forward `ref`. `type="button"` and
     * the native `disabled` attribute are emitted only for a `'button'` host.
     */
    as?: T
    /**
     * Disables dragging, keyboard resizing, and toggling the sidebar with a click or `Enter`, and
     * removes the rail from the tab order.
     * @default false
     */
    disabled?: boolean
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
  }
  export type RailProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    RailBase<T>,
    never,
    never,
    never,
    'button'
  >

  export interface PanelBase<T extends ValidComponent = 'aside'> {
    children?: JSX.Element
    as?: T
    /**
     * DOM `id` of the panel, referenced by `aria-controls` on `Sidebar.Trigger` and
     * `Sidebar.Rail`. A unique id is generated when omitted.
     */
    id?: string
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
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
    /**
     * Link target. Makes the button render as an `<a>` (unless `as` picks another element or
     * component, which still receives `href`). A disabled `<a>` has its `href` removed.
     */
    href?: string
    /**
     * Whether the button is highlighted as the current item. On a link (`href` set or rendered as
     * `<a>`) it also sets `aria-current="page"` unless you pass your own `aria-current`.
     */
    active?: boolean
    /** Icon rendered before the label. */
    leading?: IconT.Name
    /** Icon rendered after the label. */
    trailing?: IconT.Name
    /**
     * Whether activating this button on mobile closes the drawer. Has no effect on desktop, when
     * the button is disabled, or when the click handler calls `preventDefault()`; modified and
     * non-primary clicks never close it. When omitted, buttons with `href` close the drawer and
     * others stay open.
     * @default Boolean(href)
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
    /**
     * Called with the next expanded state when the user toggles the sub-menu with its trigger, or
     * when in-page search reveals `forceMount`ed content. Not called while `disabled` or when
     * `open` changes from outside.
     */
    onOpenChange?: (open: boolean) => void
    /**
     * Whether the `MenuSubTrigger` cannot toggle the sub-menu. The current expanded state is kept.
     * @default false
     */
    disabled?: boolean
    /**
     * Whether to animate the content height when expanding and collapsing. Skipped with
     * `prefers-reduced-motion`.
     * @default true
     */
    transition?: boolean
    /**
     * Whether closed content stays mounted. When `false`, content mounts on first open and
     * unmounts once it closes; when `true`, content mounts even before the first open.
     * @default false
     */
    forceMount?: boolean
  }

  export type MenuSubProps = BaseProps<'div', MenuSubBase, never, never, never>

  export type MenuSubTriggerBase<T extends ValidComponent = 'button'> = SharedTriggerBase<T> & {
    ref?: Ref<T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement>
    /** Icon rendered before the label. */
    leading?: IconT.Name
    /**
     * Disclosure icon rendered after the label; it rotates a quarter turn while the sub-menu is
     * expanded.
     * @default 'icon-chevron-right'
     */
    expandIcon?: IconT.Name
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

/** Props for the Sidebar component. */
export type SidebarProps = SidebarT.Props
