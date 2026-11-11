import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, on, splitProps } from 'solid-js'

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

  const [desktopOpen, setControlledDesktopOpen] = createControllableValue<boolean>({
    value: () => local.open,
    defaultValue: () => local.defaultOpen ?? true,
    onChange: (nextOpen) => local.onOpenChange?.(nextOpen),
  })
  const [mobileOpen, setMobileOpen] = createSignal(false)

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

  const state = createMemo<SidebarT.State>(() => (desktopOpen() ? 'expanded' : 'collapsed'))

  const isOpen = createMemo(() => {
    if (isMobile()) {
      return mobileOpen()
    }
    return desktopOpen()
  })

  function setOpen(nextOpen: boolean): void {
    const current = isMobile() ? mobileOpen() : desktopOpen()
    if (nextOpen === current) {
      return
    }
    if (isMobile()) {
      setMobileOpen(nextOpen)
      return
    }
    setControlledDesktopOpen(nextOpen)
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
