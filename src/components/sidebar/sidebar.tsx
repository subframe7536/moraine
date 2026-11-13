import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, on, splitProps, untrack } from 'solid-js'

import { useRecipe } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createMediaQuery } from '../../shared/media-query'
import { createId } from '../../shared/utils'

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

/** Responsive sidebar layout with a mobile Drawer fallback. */
export function Sidebar(props: SidebarProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'breakpoint',
    'children',
    'classes',
    'class',
    'defaultOpen',
    'isMobile',
    'onOpenChange',
    'open',
    'panelId',
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
  ])
  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(sidebarRecipe, local, {
    data: {
      root: sidebarDataAttributes.root(() => ({
        mobile: isMobile,
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

  const panelId = createId(() => local.panelId, 'sidebar-panel')
  const mediaMatches = createMediaQuery(
    () => `(max-width: ${local.breakpoint ?? SIDEBAR_DEFAULT_BREAKPOINT}px)`,
    false,
  )
  const isMobile = createMemo(() => local.isMobile ?? mediaMatches())

  // Uncontrolled state is remembered per layout. `defaultOpen` seeds both, because the media
  // query resolves asynchronously and the active layout is unknown during setup. The
  // 'desktop-only' value seeds only the panel so a restored desktop state does not open the drawer.
  const [desktopOpen, setDesktopOpen] = createSignal(
    untrack(() => local.defaultOpen === 'desktop-only' || (local.defaultOpen ?? true)),
  )
  const [mobileOpen, setMobileOpen] = createSignal(untrack(() => local.defaultOpen === true))

  const [width, setWidth] = createControllableValue<number | undefined>({
    value: () => local.width,
    defaultValue: () => local.defaultWidth,
    onChange: (nextWidth) => {
      if (nextWidth !== undefined) {
        local.onWidthChange?.(nextWidth)
      }
    },
  })
  const minWidth = () => local.minWidth ?? 224
  const maxWidth = () => Math.max(minWidth(), local.maxWidth ?? 480)
  const [resizing, setResizing] = createSignal(false)
  const [panelElement, setPanelElement] = createSignal<HTMLElement>()

  createEffect(
    on(isMobile, (mobile, previous) => {
      if (previous === true && mobile === false) {
        setMobileOpen(false)
      }
    }),
  )

  const isOpen = createMemo(() => {
    if (local.open !== undefined) {
      return local.open
    }
    return isMobile() ? mobileOpen() : desktopOpen()
  })

  const state = createMemo<SidebarT.State>(() => (isOpen() ? 'expanded' : 'collapsed'))

  function setOpen(nextOpen: boolean): void {
    if (nextOpen === isOpen()) {
      return
    }
    if (local.open === undefined) {
      if (isMobile()) {
        setMobileOpen(nextOpen)
      } else {
        setDesktopOpen(nextOpen)
      }
    }
    local.onOpenChange?.(nextOpen)
  }

  const context = {
    get slotOverrides() {
      return { classes: local.classes, styles: local.styles }
    },
    isMobile,
    state,
    panelId,
    isOpen,
    setOpen,
    toggle: () => setOpen(!isOpen()),
    get variant(): SidebarT.Context['variant'] {
      return variants.variant
    },
    get side(): SidebarT.Context['side'] {
      return variants.side
    },
    translations: () => local.translations,
    width,
    setWidth,
    commitWidth: (nextWidth: number) => local.onWidthCommit?.(nextWidth),
    minWidth,
    maxWidth,
    resizing,
    setResizing,
    panelElement,
    setPanelElement,
  }

  return (
    <SidebarProvider value={context}>
      <div data-slot="sidebar" {...rootSlot} {...rest}>
        {local.children}
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
Sidebar.useContext = function useContext(): SidebarT.Context {
  return useSidebarContext()
}
