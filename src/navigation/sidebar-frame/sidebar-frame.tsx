import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  splitProps,
  untrack,
} from 'solid-js'

import { Resizable } from '../../elements/resizable/index.ts'
import type { ResizableT } from '../../elements/resizable/index.ts'
import { Sheet } from '../../overlays/sheet/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { createMediaQuery } from '../../shared/use-media-query.ts'
import { cn } from '../../shared/utils.ts'

import type { SidebarFrameProps, SidebarFrameT } from './sidebar-frame.types.ts'

export type { SidebarFrameProps, SidebarFrameT } from './sidebar-frame.types.ts'

function renderMobileSheet(ctx: SidebarFrameT.FrameContext, main: JSX.Element): JSX.Element {
  return (
    <>
      <Sheet open={ctx.isOpen()} onOpenChange={ctx.setOpen}>
        <Sheet.Content side={ctx.side} close={false} body={<ctx.sidebar />} />
      </Sheet>
      {main}
    </>
  )
}

/**
 * Default frame renderer: mobile uses `Sheet`, desktop uses animated split layout.
 */
export function SidebarFrameSheetOnlyRender(ctx: SidebarFrameT.FrameContext): JSX.Element {
  const resolved = createComponentStyles('sidebarFrame', ctx, { rootSlot: 'desktopLayout' })
  const main = createLazyMemo(() => <ctx.main />)
  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <div data-slot="layout" {...resolved.root}>
          <ctx.sidebar data-closed={ctx.isOpen() ? undefined : ''} />
          {main()}
        </div>
      }
    >
      {renderMobileSheet(ctx, main())}
    </Show>
  )
}

/**
 * Frame renderer with mobile `Sheet` and desktop `Resizable` behavior.
 */
export function SidebarFrameSheetResizableRender(
  ctx: SidebarFrameT.FrameContext & {
    /**
     * Additional options for the `Resizable` wrapper when on desktop layout.
     */
    resizableOptions?: Omit<ResizableT.Props, 'items' | 'panels'> & {
      classes?: ResizableT.Props['classes']
      styles?: ResizableT.Props['styles']
    }
    /**
     * Additional options for the sidebar panel when on desktop layout.
     */
    resizablePanelOptions?: Omit<ResizableT.Item, 'content'>
  },
): JSX.Element {
  const main = createLazyMemo(() => <ctx.main />)
  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <Resizable
          orientation="horizontal"
          data-frame-resizable=""
          panels={
            ctx.side === 'left'
              ? [
                  {
                    content: <ctx.sidebar />,
                    ...ctx.resizablePanelOptions,
                    class: cn(ctx.resizablePanelOptions?.class),
                  },
                  {
                    content: main(),
                  },
                ]
              : [
                  {
                    content: main(),
                  },
                  {
                    content: <ctx.sidebar />,
                    ...ctx.resizablePanelOptions,
                    class: cn(ctx.resizablePanelOptions?.class),
                  },
                ]
          }
          {...ctx.resizableOptions}
          classes={{
            root: 'h-full',
            ...ctx.resizableOptions?.classes,
          }}
          styles={ctx.resizableOptions?.styles}
        />
      }
    >
      {renderMobileSheet(ctx, main())}
    </Show>
  )
}

/** Sidebar + main frame with mobile Sheet support and desktop layout wrappers. */
export function SidebarFrame(props: SidebarFrameProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'isMobile',
    'scrollThreshold',
    'mainRef',
    'sidebarRef',
    'sidebarHeaderRender',
    'sidebarBodyRender',
    'sidebarFooterRender',
    'mainRender',
    'frameRender',
    'variant',
    'side',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const merged = mergeProps(
    {
      side: 'left' as const,
      scrollThreshold: 60,
      frameRender: SidebarFrameSheetOnlyRender,
    },
    local,
  )
  const resolved = createComponentStyles('sidebarFrame', merged)

  const sidebarHeaderRender = createMemo(() => merged.sidebarHeaderRender)
  const sidebarFooterRender = createMemo(() => merged.sidebarFooterRender)

  const [internalIsMobile, setInternalIsMobile] = createSignal(false)
  const [isOpen, setOpen] = createSignal(untrack(() => local.isMobile !== true))
  const [scrolled, setScrolled] = createSignal(false)
  const isMobile = createMediaQuery('(max-width: 768px)', false)
  createEffect(
    on(
      () => isMobile(),
      (is) => {
        if (local.isMobile !== undefined) {
          return
        }
        setInternalIsMobile(is)
      },
    ),
  )

  const resolvedIsMobile = createMemo(() => local.isMobile ?? internalIsMobile())

  createEffect(() => {
    const isMobile = resolvedIsMobile()
    untrack(() => setOpen(!isMobile))
  })

  const context: SidebarFrameT.BaseContext = {
    isMobile: resolvedIsMobile,
    scrolled,
    isOpen,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
    get variant() {
      return resolved.variants.variant
    },
    get side() {
      return merged.side
    },
  }

  return (
    <div data-slot="root" {...resolved.root} {...rest}>
      {renderComponentOrElement(merged.frameRender, {
        isMobile: context.isMobile,
        scrolled: context.scrolled,
        isOpen: context.isOpen,
        setOpen: context.setOpen,
        toggle: context.toggle,
        get variant() {
          return context.variant
        },
        get side() {
          return context.side
        },
        get classes() {
          return local.classes
        },
        get styles() {
          return local.styles
        },
        sidebar: (props) => (
          <div
            ref={merged.sidebarRef}
            data-slot="sidebar"
            data-mobile={context.isMobile() ? '' : undefined}
            aria-hidden={!isOpen()}
            {...props}
            class={cn(resolved.slot('sidebar').class, props.classes)}
            style={{ ...props.styles, ...resolved.slot('sidebar').style }}
          >
            <Show when={sidebarHeaderRender() !== undefined}>
              <div data-slot="sidebarHeader" {...resolved.slot('sidebarHeader')}>
                {renderComponentOrElement(sidebarHeaderRender(), context)}
              </div>
            </Show>

            <div data-slot="sidebarBody" {...resolved.slot('sidebarBody')}>
              {renderComponentOrElement(merged.sidebarBodyRender, context)}
            </div>

            <Show when={sidebarFooterRender() !== undefined}>
              <div data-slot="sidebarFooter" {...resolved.slot('sidebarFooter')}>
                {renderComponentOrElement(sidebarFooterRender(), context)}
              </div>
            </Show>
          </div>
        ),
        main: (props) => (
          <div
            ref={merged.mainRef}
            data-slot="main"
            {...props}
            class={cn(resolved.slot('main').class, props.classes)}
            style={{ ...props.styles, ...resolved.slot('main').style }}
            onScroll={(event) => {
              setScrolled(event.currentTarget.scrollTop > (merged.scrollThreshold ?? 60))
            }}
          >
            {renderComponentOrElement(merged.mainRender, context)}
          </div>
        ),
      })}
    </div>
  )
}
