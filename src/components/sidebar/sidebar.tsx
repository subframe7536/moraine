import type { JSX } from '@solidjs/web'
import { createEffect, createMemo, createSignal, untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createMediaQuery } from '../../shared/media-query'
import { callRef, createId } from '../../shared/utils'
import { resolveDirection } from '../shared/overlay/direction'

import { SidebarContent } from './sidebar-content'
import { SidebarProvider, useSidebarContext } from './sidebar-context'
import { SidebarFooter } from './sidebar-footer'
import { SidebarGroup } from './sidebar-group'
import { SidebarGroupLabel } from './sidebar-group-label'
import { SidebarHeader } from './sidebar-header'
import { SidebarInset } from './sidebar-inset'
import { SidebarMenu } from './sidebar-menu'
import { SidebarMenuAction } from './sidebar-menu-action'
import { SidebarMenuButton } from './sidebar-menu-button'
import { SidebarMenuItem } from './sidebar-menu-item'
import { SidebarMenuSub } from './sidebar-menu-sub'
import { SidebarMenuSubContent } from './sidebar-menu-sub-content'
import { SidebarMenuSubTrigger } from './sidebar-menu-sub-trigger'
import { SidebarPanel } from './sidebar-panel'
import { SidebarRail } from './sidebar-rail'
import { SidebarTrigger } from './sidebar-trigger'
import { sidebarDataAttributes, sidebarRecipe } from './sidebar.recipe'
import type { SidebarProps, SidebarT } from './sidebar.types'
const SIDEBAR_DEFAULT_BREAKPOINT = 768

/**
 * Responsive application-shell sidebar: `Sidebar.Panel` renders inline on desktop and moves into a
 * mobile `Drawer` below `breakpoint`. Use it for persistent app navigation, `Drawer` for a
 * standalone drawer that is not a layout region, and `NavigationMenu` for a website header of
 * links. It is the state provider for all `Sidebar.*` parts. Each layout has its own open state:
 * `open` / `defaultOpen` / `onOpenChange` for the desktop panel and `mobileOpen` /
 * `defaultMobileOpen` / `onMobileOpenChange` for the mobile drawer. `Sidebar.Trigger` and
 * `Sidebar.useContext()` act on the active layout.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel>
 *     <Sidebar.Content>
 *       <Sidebar.Group>
 *         <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
 *         <Sidebar.Menu>
 *           <Sidebar.MenuItem>
 *             <Sidebar.MenuButton leading="i-lucide:home" active>
 *               Home
 *             </Sidebar.MenuButton>
 *           </Sidebar.MenuItem>
 *           <Sidebar.MenuItem>
 *             <Sidebar.MenuButton leading="i-lucide:settings">Settings</Sidebar.MenuButton>
 *           </Sidebar.MenuItem>
 *         </Sidebar.Menu>
 *       </Sidebar.Group>
 *     </Sidebar.Content>
 *   </Sidebar.Panel>
 *   <Sidebar.Inset>Content</Sidebar.Inset>
 * </Sidebar>
 * ```
 */
export function Sidebar(props: SidebarProps): JSX.Element {
  const rest = omit(
    props,
    'breakpoint',
    'children',
    'classes',
    'class',
    'defaultOpen',
    'defaultMobileOpen',
    'mobile',
    'mobileOpen',
    'onOpenChange',
    'onMobileOpenChange',
    'open',
    'ref',
    'side',
    'styles',
    'style',
    'variant',
    'translations',
    'width',
    'defaultWidth',
    'onWidthChange',
    'onWidthCommit',
    'minWidth',
    'maxWidth',
  )
  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(sidebarRecipe, props, {
    data: {
      root: sidebarDataAttributes.root(() => ({
        mobile,
        side: () => context.side,
        splitterRoot: true,
        variant: () => context.variant,
      })),
    },
    own: {
      root: () => ({
        style: {
          '--mo-sidebar-width': width() === undefined ? undefined : `${width()}px`,
        },
      }),
    },
  })

  const [panelIdProp, setPanelId] = createSignal<string | undefined>(undefined)
  const panelId = createId(panelIdProp, 'sidebar-panel')
  const [rootElement, setRootElement] = createSignal<HTMLElement>()
  const localeDirection = useLocale().dir
  const mediaMatches = createMediaQuery(
    () => `(max-width: ${props.breakpoint ?? SIDEBAR_DEFAULT_BREAKPOINT}px)`,
    false,
  )
  const mobile = createMemo(() => props.mobile ?? mediaMatches())

  // Each layout owns its open state, so a controlled desktop `open` never opens the drawer.
  const [desktopOpen, setDesktopOpen] = createControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? true,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const [uncontrolledMobileOpen, setUncontrolledMobileOpen] = createSignal(
    untrack(() => props.defaultMobileOpen ?? false),
  )
  const mobileOpen = () => props.mobileOpen ?? uncontrolledMobileOpen()

  function setMobileOpen(nextOpen: boolean): void {
    if (nextOpen === mobileOpen()) {
      return
    }
    if (props.mobileOpen === undefined) {
      setUncontrolledMobileOpen(nextOpen)
    }
    props.onMobileOpenChange?.(nextOpen)
  }

  const [width, setWidth] = createControllableValue<number | undefined>({
    value: () => props.width,
    defaultValue: () => props.defaultWidth,
    onChange: (nextWidth) => {
      if (nextWidth !== undefined) {
        props.onWidthChange?.(nextWidth)
      }
    },
  })
  const minWidth = () => props.minWidth ?? 224
  const maxWidth = () => Math.max(minWidth(), props.maxWidth ?? 480)
  const [resizing, setResizing] = createSignal(false)
  const [panelElement, setPanelElement] = createSignal<HTMLElement>()

  // Leaving mobile closes an uncontrolled drawer without reporting it.
  createEffect(mobile, (isMobileLayout, previous) => {
    if (previous === true && isMobileLayout === false) {
      setUncontrolledMobileOpen(false)
    }
  })

  const open = createMemo(() => (mobile() ? mobileOpen() : desktopOpen()))

  function setOpen(nextOpen: boolean): void {
    if (mobile()) {
      setMobileOpen(nextOpen)
    } else {
      setDesktopOpen(nextOpen)
    }
  }

  /** Physical edge for the mobile Drawer: `start` is the left edge in LTR and the right in RTL. */
  const drawerSide = (): 'left' | 'right' => {
    const rtl = resolveDirection(rootElement(), localeDirection()) === 'rtl'
    return (context.side === 'end') !== rtl ? 'right' : 'left'
  }

  const context = {
    get slotOverrides() {
      return { classes: props.classes, styles: props.styles }
    },
    mobile,
    panelId,
    setPanelId,
    open,
    setOpen,
    toggle: () => setOpen(!open()),
    get variant(): SidebarT.Context['variant'] {
      return variants.variant
    },
    get side(): SidebarT.Context['side'] {
      return variants.side
    },
    drawerSide,
    translations: () => props.translations,
    width,
    setWidth,
    commitWidth: (nextWidth: number) => props.onWidthCommit?.(nextWidth),
    minWidth,
    maxWidth,
    resizing,
    setResizing,
    panelElement,
    setPanelElement,
  }

  return (
    <SidebarProvider value={context}>
      <div
        data-slot="sidebar"
        {...rootSlot}
        {...rest}
        ref={(element) => {
          setRootElement(element)
          callRef(() => props.ref, element)
        }}
      >
        {props.children}
      </div>
    </SidebarProvider>
  )
}

Sidebar.Panel = SidebarPanel
Sidebar.Rail = SidebarRail
Sidebar.Header = SidebarHeader
Sidebar.Content = SidebarContent
Sidebar.Footer = SidebarFooter
Sidebar.Inset = SidebarInset
Sidebar.Trigger = SidebarTrigger
Sidebar.Group = SidebarGroup
Sidebar.GroupLabel = SidebarGroupLabel
Sidebar.Menu = SidebarMenu
Sidebar.MenuItem = SidebarMenuItem
Sidebar.MenuButton = SidebarMenuButton
Sidebar.MenuAction = SidebarMenuAction
Sidebar.MenuSub = SidebarMenuSub
Sidebar.MenuSubTrigger = SidebarMenuSubTrigger
Sidebar.MenuSubContent = SidebarMenuSubContent
Sidebar.useContext = useSidebarContext
