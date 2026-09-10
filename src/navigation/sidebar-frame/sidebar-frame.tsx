import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  splitProps,
  untrack,
} from 'solid-js'

import { Sheet } from '../../overlays/sheet'
import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'
import { createMediaQuery } from '../../shared/use-media-query'
import { callHandler } from '../../shared/utils'

import { SidebarFrameProvider, useSidebarFrameContext } from './sidebar-frame-context'
import type { SidebarFrameProps, SidebarFrameT } from './sidebar-frame.types'

function SidebarFrameSidebar(props: SidebarFrameT.SidebarProps): JSX.Element {
  const cn = useCn()
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const content = resolveChildren(() => local.children)

  const SidebarContent = (contentProps: { mobile: boolean }) => (
    <div
      data-slot="sidebar"
      data-mobile={contentProps.mobile ? '' : undefined}
      data-closed={context.isOpen() ? undefined : ''}
      hidden={!contentProps.mobile && context.isMobile()}
      aria-hidden={
        contentProps.mobile ? !context.isOpen() : context.isMobile() || !context.isOpen()
      }
      {...rest}
      class={cn(context.resolved.slot('sidebar').class, local.class)}
      style={{ ...context.resolved.slot('sidebar').style, ...local.style }}
    >
      <Show
        when={contentProps.mobile}
        fallback={<Show when={!context.isMobile()}>{content()}</Show>}
      >
        {content()}
      </Show>
    </div>
  )

  return (
    <>
      <SidebarContent mobile={false} />
      <Show when={context.isMobile()}>
        <Sheet open={context.isOpen()} onOpenChange={context.setOpen}>
          <Sheet.Content side={context.side} close={false} body={<SidebarContent mobile />} />
        </Sheet>
      </Show>
    </>
  )
}

function SidebarFrameSidebarHeader(props: SidebarFrameT.SidebarHeaderProps): JSX.Element {
  const cn = useCn()
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const content = resolveChildren(() => local.children)

  return (
    <div
      data-slot="sidebarHeader"
      {...rest}
      class={cn(context.resolved.slot('sidebarHeader').class, local.class)}
      style={{ ...context.resolved.slot('sidebarHeader').style, ...local.style }}
    >
      {content()}
    </div>
  )
}

function SidebarFrameSidebarBody(props: SidebarFrameT.SidebarBodyProps): JSX.Element {
  const cn = useCn()
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const content = resolveChildren(() => local.children)

  return (
    <div
      data-slot="sidebarBody"
      {...rest}
      class={cn(context.resolved.slot('sidebarBody').class, local.class)}
      style={{ ...context.resolved.slot('sidebarBody').style, ...local.style }}
    >
      {content()}
    </div>
  )
}

function SidebarFrameSidebarFooter(props: SidebarFrameT.SidebarFooterProps): JSX.Element {
  const cn = useCn()
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const content = resolveChildren(() => local.children)

  return (
    <div
      data-slot="sidebarFooter"
      {...rest}
      class={cn(context.resolved.slot('sidebarFooter').class, local.class)}
      style={{ ...context.resolved.slot('sidebarFooter').style, ...local.style }}
    >
      {content()}
    </div>
  )
}

function SidebarFrameMain(props: SidebarFrameT.MainProps): JSX.Element {
  const cn = useCn()
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'onScroll'])
  const content = resolveChildren(() => local.children)

  return (
    <div
      data-slot="main"
      {...rest}
      class={cn(context.resolved.slot('main').class, local.class)}
      style={{ ...context.resolved.slot('main').style, ...local.style }}
      onScroll={(event) => {
        const result = callHandler(event, local.onScroll)
        if (!result.defaultPrevented) {
          context.setScrolled(event.currentTarget.scrollTop > context.scrollThreshold())
        }
      }}
    >
      {content()}
    </div>
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
  const merged = mergeProps({ side: 'left' as const, scrollThreshold: 60 }, local)
  const resolved = createComponentStyles('sidebarFrame', merged)

  const [internalIsMobile, setInternalIsMobile] = createSignal(false)
  const [isOpen, setOpen] = createSignal(untrack(() => local.isMobile !== true))
  const [scrolled, setScrolled] = createSignal(false)
  const mediaMatches = createMediaQuery('(max-width: 768px)', false)

  createEffect(
    on(mediaMatches, (matches) => {
      if (local.isMobile === undefined) {
        setInternalIsMobile(matches)
      }
    }),
  )

  const isMobile = createMemo(() => local.isMobile ?? internalIsMobile())

  createEffect(() => {
    const mobile = isMobile()
    untrack(() => setOpen(!mobile))
  })

  const context = {
    resolved,
    scrollThreshold: () => merged.scrollThreshold,
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
      return merged.side
    },
  }

  return (
    <SidebarFrameProvider value={context}>
      <div data-slot="root" {...rest} {...resolved.root}>
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
