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
import { SidebarTrigger } from './sidebar-trigger'
import { sidebarDataAttributes, sidebarRecipe } from './sidebar.recipe'
import type { SidebarProps, SidebarT } from './sidebar.types'

const SIDEBAR_DEFAULT_BREAKPOINT = 768

/** Responsive sidebar layout with a mobile Sheet fallback. */
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
  ])
  const { slots, variants } = useRecipe(sidebarRecipe, local, {
    vars: () => ({ '--mo-sidebar-width': local.width }),
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
    get variant() {
      return variants.variant
    },
    get side() {
      return variants.side
    },
    translations: () => local.translations,
  }

  return (
    <SidebarProvider value={context}>
      <div
        data-slot="sidebar"
        {...sidebarDataAttributes.root({
          mobile: isMobile,
          side: () => context.side,
          variant: () => context.variant,
        })}
        {...rest}
        {...slots.root}
      >
        {local.children}
      </div>
    </SidebarProvider>
  )
}

Sidebar.Panel = SidebarPanel
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
