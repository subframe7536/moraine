import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createSignal,
  mergeProps,
  on,
  splitProps,
  untrack,
} from 'solid-js'

import { Sheet } from '../../overlay/sheet'
import { createStyles } from '../../provider'
import { useControllableValue } from '../../shared/use-controllable-value'
import { createMediaQuery } from '../../shared/use-media-query'
import { callHandler } from '../../shared/utils'

import { SidebarFrameProvider, useSidebarFrameContext } from './sidebar-frame-context'
import { SidebarFrameTrigger } from './sidebar-frame-trigger'
import { sidebarFrameDataAttributes, sidebarFrameRecipe } from './sidebar-frame.recipe'
import type { SidebarFrameProps, SidebarFrameT } from './sidebar-frame.types'

function SidebarFrameSidebar(props: SidebarFrameT.SidebarProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['ariaLabel', 'children', 'class', 'style'])
  const content = resolveChildren(() => local.children)
  const mobileAriaLabel = () =>
    rest['aria-label'] ?? local.ariaLabel ?? rest.title ?? 'Sidebar navigation'

  const SidebarContent = (contentProps: { mobile: boolean }) => {
    const resolved = createStyles(sidebarFrameRecipe, local, {
      rootSlot: 'sidebar',
      inheritedStyles: () => context.presentation,
      inheritedVariants: () => ({ side: context.side, variant: context.variant }),
    })
    return (
      <div
        data-slot="sidebar-frame-sidebar"
        {...sidebarFrameDataAttributes.sidebar({
          mobile: () => contentProps.mobile,
          closed: () => !context.isOpen(),
        })}
        hidden={!contentProps.mobile && context.isMobile()}
        aria-hidden={
          contentProps.mobile ? !context.isOpen() : context.isMobile() || !context.isOpen()
        }
        inert={!contentProps.mobile && !context.isOpen() ? true : undefined}
        {...rest}
        {...resolved.styles.sidebar}
      >
        <Show
          when={contentProps.mobile}
          fallback={<Show when={!context.isMobile()}>{content()}</Show>}
        >
          {content()}
        </Show>
      </div>
    )
  }

  return (
    <>
      <SidebarContent mobile={false} />
      <Show when={context.isMobile()}>
        <Sheet open={context.isOpen()} onOpenChange={context.setOpen}>
          <Sheet.Content side={context.side} close={false} ariaLabel={mobileAriaLabel()}>
            <Sheet.Body>
              <SidebarContent mobile />
            </Sheet.Body>
          </Sheet.Content>
        </Sheet>
      </Show>
    </>
  )
}

function SidebarFrameSidebarHeader(props: SidebarFrameT.SidebarHeaderProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const resolved = createStyles(sidebarFrameRecipe, local, {
    rootSlot: 'sidebarHeader',
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })

  return (
    <div data-slot="sidebar-frame-sidebar-header" {...rest} {...resolved.styles.sidebarHeader}>
      {local.children}
    </div>
  )
}

function SidebarFrameSidebarBody(props: SidebarFrameT.SidebarBodyProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const resolved = createStyles(sidebarFrameRecipe, local, {
    rootSlot: 'sidebarBody',
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })

  return (
    <div data-slot="sidebar-frame-sidebar-body" {...rest} {...resolved.styles.sidebarBody}>
      {local.children}
    </div>
  )
}

function SidebarFrameSidebarFooter(props: SidebarFrameT.SidebarFooterProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style'])
  const resolved = createStyles(sidebarFrameRecipe, local, {
    rootSlot: 'sidebarFooter',
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })

  return (
    <div data-slot="sidebar-frame-sidebar-footer" {...rest} {...resolved.styles.sidebarFooter}>
      {local.children}
    </div>
  )
}

function SidebarFrameMain(props: SidebarFrameT.MainProps): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, ['children', 'class', 'style', 'onScroll'])
  const resolved = createStyles(sidebarFrameRecipe, local, {
    rootSlot: 'main',
    inheritedStyles: () => context.presentation,
    inheritedVariants: () => ({ side: context.side, variant: context.variant }),
  })

  return (
    <div
      data-slot="sidebar-frame-main"
      {...rest}
      {...resolved.styles.main}
      onScroll={(event) => {
        const result = callHandler(event, local.onScroll)
        if (!result.defaultPrevented) {
          context.setScrolled(event.currentTarget.scrollTop > context.scrollThreshold())
        }
      }}
    >
      {local.children}
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
  const resolved = createStyles(sidebarFrameRecipe, local)
  const merged = mergeProps(
    {
      get side() {
        return resolved.variants.side
      },
      scrollThreshold: 60,
    },
    local,
  )

  const mediaMatches = createMediaQuery('(max-width: 768px)', false)
  const [isMobile, setIsMobile] = useControllableValue<boolean>({
    value: () => local.isMobile,
    defaultValue: mediaMatches,
  })
  const [isOpen, setOpen] = createSignal(untrack(() => !isMobile()))
  const [scrolled, setScrolled] = createSignal(false)

  createEffect(
    on(mediaMatches, (matches) => {
      setIsMobile(matches)
    }),
  )

  createEffect(
    on(isMobile, (mobile) => {
      setOpen(!mobile)
    }),
  )

  const context = {
    get presentation() {
      return { classes: local.classes, styles: local.styles }
    },
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
