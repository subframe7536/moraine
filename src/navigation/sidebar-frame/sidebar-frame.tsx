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
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
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
  const design = useMoraineDesign()
  const main = createLazyMemo(() => <ctx.main />)
  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <div
          data-slot="layout"
          class={
            design().sidebarFrame.recipe({
              variant: ctx.variant,
              side: ctx.side,
              isMobile: false,
            }).desktopLayout
          }
        >
          <ctx.sidebar
            data-closed={ctx.isOpen() ? undefined : ''}
            classes={ctx.isOpen() ? undefined : 'w-0 pointer-events-none'}
          />
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
  const design = useMoraineDesign()
  const sidebarFrameDesign = () => design().sidebarFrame

  const merged = mergeProps(
    {
      variant: 'default' as const,
      side: 'left' as const,
      scrollThreshold: 60,
      frameRender: SidebarFrameSheetOnlyRender,
    },
    () => sidebarFrameDesign().defaultVariants,
    local,
  )

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

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return sidebarFrameDesign().recipe({
          isMobile: resolvedIsMobile(),
          side: merged.side,
          variant: merged.variant,
        })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const context: SidebarFrameT.BaseContext = {
    isMobile: resolvedIsMobile,
    scrolled,
    isOpen,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
    get variant() {
      return merged.variant
    },
    get side() {
      return merged.side
    },
  }

  return (
    <div data-slot="root" {...resolved.rootClassAndStyle()} {...rest}>
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
        sidebar: (props) => (
          <div
            ref={merged.sidebarRef}
            data-slot="sidebar"
            data-mobile={context.isMobile() ? '' : undefined}
            data-side={context.side}
            aria-hidden={!isOpen()}
            {...props}
            {...resolved.slotClassAndStyle('sidebar', {
              get group() {
                return { class: props.classes, style: props.styles }
              },
            })}
          >
            <Show when={sidebarHeaderRender() !== undefined}>
              <div data-slot="sidebarHeader" {...resolved.slotClassAndStyle('sidebarHeader')}>
                {renderComponentOrElement(sidebarHeaderRender(), context)}
              </div>
            </Show>

            <div data-slot="sidebarBody" {...resolved.slotClassAndStyle('sidebarBody')}>
              {renderComponentOrElement(merged.sidebarBodyRender, context)}
            </div>

            <Show when={sidebarFooterRender() !== undefined}>
              <div data-slot="sidebarFooter" {...resolved.slotClassAndStyle('sidebarFooter')}>
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
            {...resolved.slotClassAndStyle('main', {
              get group() {
                return { class: props.classes, style: props.styles }
              },
            })}
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
