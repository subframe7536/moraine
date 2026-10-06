import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  on,
  splitProps,
  untrack,
} from 'solid-js'

import { Sheet } from '../../overlay/sheet'
import { createStyles } from '../../provider'
import { createMediaQuery } from '../../shared/media-query'

import {
  SidebarFrameProvider,
  useSidebarFrameContext,
  useSidebarFrameStyles,
} from './sidebar-frame-context'
import { SidebarFrameItem } from './sidebar-frame-item'
import {
  SidebarFrameGroup,
  SidebarFrameGroupLabel,
  SidebarFrameMain,
  SidebarFrameMenu,
  SidebarFrameSidebarBody,
  SidebarFrameSidebarFooter,
  SidebarFrameSidebarHeader,
} from './sidebar-frame-region'
import { SidebarFrameSub } from './sidebar-frame-sub'
import { SidebarFrameTrigger } from './sidebar-frame-trigger'
import { sidebarFrameDataAttributes, sidebarFrameRecipe } from './sidebar-frame.recipe'
import type { SidebarFrameProps, SidebarFrameT } from './sidebar-frame.types'

const SIDEBAR_FRAME_MOBILE_QUERY = '(max-width: 768px)'

function SidebarFrameSidebar(props: SidebarFrameT.SidebarProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['ariaLabel', 'children', 'class', 'style'])
  const content = resolveChildren(() => local.children)
  const mobileAriaLabel = () =>
    rest['aria-label'] ?? local.ariaLabel ?? rest.title ?? 'Sidebar navigation'

  const SidebarContent = (contentProps: { mobile: boolean }) => {
    const resolved = useSidebarFrameStyles('sidebar', local)
    return (
      <div
        data-slot="sidebar-frame-sidebar"
        {...sidebarFrameDataAttributes.sidebar({
          mobile: () => contentProps.mobile,
          closed: () => !context.isOpen(),
        })}
        aria-hidden={!context.isOpen()}
        inert={!contentProps.mobile && !context.isOpen() ? true : undefined}
        {...rest}
        {...resolved.styles.sidebar}
      >
        {content()}
      </div>
    )
  }

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

/** Responsive sidebar layout with a mobile Sheet fallback. */
export function SidebarFrame(props: SidebarFrameProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'isMobile',
    'scrollThreshold',
    'children',
    'variant',
    'side',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(sidebarFrameRecipe, local)

  const mediaMatches = createMediaQuery(SIDEBAR_FRAME_MOBILE_QUERY, false)
  const isMobile = createMemo(() => local.isMobile ?? mediaMatches())
  const [isOpen, setOpen] = createSignal(untrack(() => !isMobile()))
  const [scrolled, setScrolled] = createSignal(false)

  createEffect(
    on(isMobile, (mobile) => {
      setOpen(!mobile)
    }),
  )

  const presentation = {
    get classes() {
      return local.classes
    },
    get styles() {
      return local.styles
    },
  }

  const context = {
    presentation,
    get scrollThreshold() {
      return local.scrollThreshold ?? 60
    },
    isMobile,
    scrolled,
    setScrolled,
    isOpen,
    setOpen,
    toggle: () => setOpen((open) => !open),
    get variant() {
      return resolved.variants.variant
    },
    get side() {
      return resolved.variants.side
    },
  }

  return (
    <SidebarFrameProvider value={context}>
      <div data-slot="sidebar-frame" {...rest} {...resolved.styles.root}>
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
SidebarFrame.Group = SidebarFrameGroup
SidebarFrame.GroupLabel = SidebarFrameGroupLabel
SidebarFrame.Menu = SidebarFrameMenu
SidebarFrame.Item = SidebarFrameItem
SidebarFrame.Sub = SidebarFrameSub
