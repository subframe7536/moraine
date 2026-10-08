import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, on, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createMediaQuery } from '../../shared/media-query'
import { createId } from '../../shared/utils'

import { SidebarFrameProvider } from './sidebar-frame-context'
import { SidebarFrameItem } from './sidebar-frame-item'
import { SidebarFrameLabel } from './sidebar-frame-label'
import { SidebarFrameMain } from './sidebar-frame-main'
import { SidebarFrameMenu } from './sidebar-frame-menu'
import { SidebarFrameSidebar } from './sidebar-frame-sidebar'
import { SidebarFrameSidebarBody } from './sidebar-frame-sidebar-body'
import { SidebarFrameSidebarFooter } from './sidebar-frame-sidebar-footer'
import { SidebarFrameSidebarHeader } from './sidebar-frame-sidebar-header'
import { SidebarFrameSubmenu } from './sidebar-frame-submenu'
import { SidebarFrameSubmenuContent } from './sidebar-frame-submenu-content'
import { SidebarFrameSubmenuTrigger } from './sidebar-frame-submenu-trigger'
import { SidebarFrameTrigger } from './sidebar-frame-trigger'
import { sidebarFrameDataAttributes, sidebarFrameRecipe } from './sidebar-frame.recipe'
import type { SidebarFrameProps, SidebarFrameT } from './sidebar-frame.types'

const SIDEBAR_FRAME_DEFAULT_BREAKPOINT = 768
const SIDEBAR_FRAME_DEFAULT_SCROLL_THRESHOLD = 60

/** Responsive sidebar layout with a mobile Sheet fallback. */
export function SidebarFrame(props: SidebarFrameProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'breakpoint',
    'children',
    'classes',
    'class',
    'defaultOpen',
    'isMobile',
    'onOpenChange',
    'open',
    'scrollThreshold',
    'sidebarId',
    'side',
    'styles',
    'style',
    'variant',
  ])
  const resolved = createStyles(sidebarFrameRecipe, local)

  const sidebarId = createId(() => local.sidebarId, 'sidebar-frame-sidebar')
  const mediaMatches = createMediaQuery(
    () => `(max-width: ${local.breakpoint ?? SIDEBAR_FRAME_DEFAULT_BREAKPOINT}px)`,
    false,
  )
  const isMobile = createMemo(() => local.isMobile ?? mediaMatches())

  const [desktopOpen, setControlledDesktopOpen] = createControllableValue<boolean>({
    value: () => local.open,
    defaultValue: () => local.defaultOpen ?? true,
  })
  const [mobileOpen, setMobileOpen] = createSignal(false)
  const [scrolled, setScrolled] = createSignal(false)

  createEffect(
    on(isMobile, (mobile, previous) => {
      if (previous === true && mobile === false) {
        setMobileOpen(false)
      }
    }),
  )

  const state = createMemo<SidebarFrameT.State>(() => (desktopOpen() ? 'expanded' : 'collapsed'))

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
    local.onOpenChange?.(nextOpen)
  }

  const context = {
    get presentation() {
      return { classes: local.classes, styles: local.styles }
    },
    get scrollThreshold() {
      return local.scrollThreshold ?? SIDEBAR_FRAME_DEFAULT_SCROLL_THRESHOLD
    },
    isMobile,
    state,
    sidebarId,
    scrolled,
    setScrolled,
    isOpen,
    setOpen,
    toggle: () => setOpen(!isOpen()),
    get variant() {
      return resolved.variants.variant
    },
    get side() {
      return resolved.variants.side
    },
  }

  return (
    <SidebarFrameProvider value={context}>
      <div
        data-slot="sidebar-frame"
        {...sidebarFrameDataAttributes.root({
          mobile: isMobile,
          side: () => context.side,
          variant: () => context.variant,
        })}
        {...rest}
        {...resolved.styles.root}
      >
        {local.children}
      </div>
    </SidebarFrameProvider>
  )
}

SidebarFrame.Sidebar = SidebarFrameSidebar
SidebarFrame.SidebarHeader = SidebarFrameSidebarHeader
SidebarFrame.SidebarBody = SidebarFrameSidebarBody
SidebarFrame.SidebarFooter = SidebarFrameSidebarFooter
SidebarFrame.Main = SidebarFrameMain
SidebarFrame.Trigger = SidebarFrameTrigger
SidebarFrame.Menu = SidebarFrameMenu
SidebarFrame.Label = SidebarFrameLabel
SidebarFrame.Item = SidebarFrameItem
SidebarFrame.Submenu = SidebarFrameSubmenu
SidebarFrame.SubmenuTrigger = SidebarFrameSubmenuTrigger
SidebarFrame.SubmenuContent = SidebarFrameSubmenuContent
