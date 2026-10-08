import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  on,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Sheet } from '../../overlay/sheet'
import { createStyles } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createMediaQuery } from '../../shared/media-query'
import type { ValidComponent } from '../../shared/types'
import { callHandler, createId } from '../../shared/utils'

import {
  SidebarFrameProvider,
  useSidebarFrameContext,
  useSidebarFrameStyles,
} from './sidebar-frame-context'
import { SidebarFrameItem } from './sidebar-frame-item'
import { SidebarFrameLabel } from './sidebar-frame-menu'
import {
  SidebarFrameMenu,
  SidebarFrameSidebarBody,
  SidebarFrameSidebarFooter,
  SidebarFrameSidebarHeader,
} from './sidebar-frame-region'
import {
  SidebarFrameSubmenu,
  SidebarFrameSubmenuContent,
  SidebarFrameSubmenuTrigger,
} from './sidebar-frame-submenu'
import { SidebarFrameTrigger } from './sidebar-frame-trigger'
import { defaultSidebarFrameMessages } from './sidebar-frame.messages'
import { sidebarFrameDataAttributes, sidebarFrameRecipe } from './sidebar-frame.recipe'
import type { SidebarFrameProps, SidebarFrameT } from './sidebar-frame.types'

const SIDEBAR_FRAME_DEFAULT_BREAKPOINT = 768
const SIDEBAR_FRAME_DEFAULT_SCROLL_THRESHOLD = 60

function SidebarFrameSidebar<T extends ValidComponent = 'aside'>(
  props: SidebarFrameT.SidebarProps<T>,
): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['as', 'ariaLabel', 'children', 'class', 'style'])
  const content = resolveChildren(() => local.children)
  const resolved = useSidebarFrameStyles('sidebar', local)
  const messages = useMessages('sidebarFrame', defaultSidebarFrameMessages)

  const mobileAriaLabel = () => {
    const restRecord = rest as Record<string, unknown>
    return (
      (restRecord['aria-label'] as string | undefined) ??
      local.ariaLabel ??
      (restRecord.title as string | undefined) ??
      messages().label
    )
  }

  const SidebarContent = (contentProps: { mobile: boolean }) => (
    <Dynamic
      component={(local.as ?? 'aside') as ValidComponent}
      id={context.sidebarId()}
      data-slot="sidebar-frame-sidebar"
      {...sidebarFrameDataAttributes.sidebar({
        closed: () => !context.isOpen(),
        expanded: () => context.isOpen(),
        mobile: () => contentProps.mobile,
        side: () => context.side,
        variant: () => context.variant,
      })}
      aria-hidden={!context.isOpen() ? true : undefined}
      inert={!contentProps.mobile && !context.isOpen() ? true : undefined}
      {...(rest as object)}
      {...resolved.styles.sidebar}
    >
      {content()}
    </Dynamic>
  )

  return (
    <Show when={context.isMobile()} fallback={<SidebarContent mobile={false} />}>
      <Sheet
        open={context.isOpen()}
        onOpenChange={context.setOpen}
        side={context.side}
        close={false}
        ariaLabel={mobileAriaLabel()}
      >
        <Sheet.Content>
          <Sheet.Body>
            <SidebarContent mobile />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    </Show>
  )
}

function SidebarFrameMain<T extends ValidComponent = 'div'>(
  props: SidebarFrameT.MainProps<T>,
): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style', 'onScroll'])
  const resolved = useSidebarFrameStyles('main', local)

  return (
    <Dynamic
      component={(local.as ?? 'div') as ValidComponent}
      data-slot="sidebar-frame-main"
      {...(rest as object)}
      {...resolved.styles.main}
      onScroll={(event: UIEvent & { currentTarget: HTMLElement }) => {
        const result = callHandler(event, local.onScroll)
        if (!result.defaultPrevented) {
          context.setScrolled(event.currentTarget.scrollTop > context.scrollThreshold)
        }
      }}
    >
      {local.children}
    </Dynamic>
  )
}

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
