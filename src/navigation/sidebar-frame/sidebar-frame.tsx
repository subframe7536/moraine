import { createMediaQuery } from '../../shared/create-media-query'
import type { JSX, Component, Accessor } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js'

import { Resizable } from '../../elements/resizable'
import type { ResizableT } from '../../elements/resizable'
import { Sheet } from '../../overlays/sheet'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'

import {
  sidebarFrameDesktopLayoutVariants,
  sidebarFrameSidebarVariants,
} from './sidebar-frame.class'
import type { SidebarFrameVariantProps } from './sidebar-frame.class'

export namespace SidebarFrameT {
  /**
   * Render context exposed to sidebar/main render functions.
   */
  export interface Context {
    /**
     * Whether current viewport is treated as mobile.
     */
    isMobile: Accessor<boolean>
    /**
     * Whether the main scroll container has crossed `scrollThreshold`.
     */
    scrolled: Accessor<boolean>
    /**
     * Current sidebar open state (mainly for mobile sheet).
     */
    isOpen: Accessor<boolean>
    /**
     * Set sidebar open state.
     */
    setOpen: (open: boolean) => void
    /**
     * Toggle sidebar open state.
     */
    toggle: () => void
    /**
     * Resolved visual variant.
     */
    variant: Accessor<Variant>
    /**
     * Resolved sidebar side.
     */
    side: Accessor<Side>
  }

  /**
   * Extended render context for frame composition.
   */
  export interface FrameContext extends Context {
    /**
     * Processed sidebar block component.
     */
    Sidebar: Component
    /**
     * Processed main block component.
     */
    Main: Component
  }

  /**
   * Shared render function signature for sidebar/main sections.
   */
  export type RenderFn = (ctx: Context) => JSX.Element
  /**
   * Render function signature for frame wrapper.
   */
  export type RenderFrame = (ctx: FrameContext) => JSX.Element
  /**
   * Slot keys for classes/styles overrides.
   */
  export type Slot = 'root' | 'sidebar' | 'sidebarHeader' | 'sidebarBody' | 'sidebarFooter' | 'main'

  export type Variant = NonNullable<SidebarFrameVariantProps['variant']>
  export type Side = NonNullable<SidebarFrameVariantProps['side']>
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = never

  export interface Item {}

  export interface Base {
    /**
     * The variant of the sidebar frame.
     */
    variant?: Variant
    /**
     * The side of the sidebar.
     */
    side?: Side
    /**
     * Controlled mobile mode state.
     * When omitted, mobile state is resolved from `matchMedia`.
     */
    isMobile?: boolean
    /**
     * Scroll threshold for `scrolled` state.
     * @default 60
     */
    scrollThreshold?: number
    /**
     * Optional render function for sidebar header section.
     */
    renderSidebarHeader?: RenderFn
    /**
     * Render function for sidebar body section.
     */
    renderSidebarBody: RenderFn
    /**
     * Optional render function for sidebar footer section.
     */
    renderSidebarFooter?: RenderFn
    /**
     * Render function for main content section.
     */
    renderMain: RenderFn
    /**
     * Optional frame renderer used to compose sidebar/main layout.
     * @default SidebarFrameSheetOnlyRender
     */
    renderFrame?: RenderFrame
  }

  /**
   * Props for the SidebarFrame component.
   */
  export interface Props extends BaseProps<Base, never, Extend, Slot> {}
}

/**
 * Props for the SidebarFrame component.
 */
export interface SidebarFrameProps extends SidebarFrameT.Props {}

function renderMobileSheet(ctx: SidebarFrameT.FrameContext): JSX.Element {
  return (
    <>
      <Sheet
        side={ctx.side()}
        open={ctx.isOpen()}
        onOpenChange={ctx.setOpen}
        close={false}
        classes={{
          body: '!p-0 !overflow-hidden',
        }}
        body={<ctx.Sidebar />}
      >
        <span class="hidden" aria-hidden="true" />
      </Sheet>
      <ctx.Main />
    </>
  )
}

/**
 * Default frame renderer: mobile uses `Sheet`, desktop uses static split layout.
 */
export function SidebarFrameSheetOnlyRender(ctx: SidebarFrameT.FrameContext): JSX.Element {
  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <div
          data-slot="layout"
          class={sidebarFrameDesktopLayoutVariants({ variant: ctx.variant(), side: ctx.side() })}
        >
          <ctx.Sidebar />
          <ctx.Main />
        </div>
      }
    >
      {renderMobileSheet(ctx)}
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
    resizableOptions?: Omit<ResizableT.Props, 'items' | 'panels'>
    /**
     * Additional options for the sidebar panel when on desktop layout.
     */
    resizablePanelOptions?: Omit<ResizableT.Item, 'content'>
  },
): JSX.Element {
  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <Resizable
          orientation="horizontal"
          panels={
            ctx.side() === 'left'
              ? [
                  {
                    content: <ctx.Sidebar />,
                    ...ctx.resizablePanelOptions,
                    class: cn('rm-side-b', ctx.resizablePanelOptions?.class),
                  },
                  {
                    content: <ctx.Main />,
                  },
                ]
              : [
                  {
                    content: <ctx.Main />,
                  },
                  {
                    content: <ctx.Sidebar />,
                    ...ctx.resizablePanelOptions,
                    class: cn('rm-side-b', ctx.resizablePanelOptions?.class),
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
      {renderMobileSheet(ctx)}
    </Show>
  )
}

/** Sidebar + main frame with mobile Sheet support and desktop layout wrappers. */
export function SidebarFrame(props: SidebarFrameProps): JSX.Element {
  const merged = mergeProps(
    {
      variant: 'default' as SidebarFrameT.Variant,
      side: 'left' as SidebarFrameT.Side,
      scrollThreshold: 60,
      renderFrame: SidebarFrameSheetOnlyRender,
    },
    props,
  )

  const [internalIsMobile, setInternalIsMobile] = createSignal(false)
  const [isOpen, setOpen] = createSignal(false)
  const [scrolled, setScrolled] = createSignal(false)
  const isMobile = createMediaQuery('(max-width: 768px)', false)
  createEffect(
    on(
      () => isMobile(),
      (is) => {
        if (merged.isMobile !== undefined) {
          return
        }
        setInternalIsMobile(is)
      },
    ),
  )

  const resolvedIsMobile = createMemo(() => merged.isMobile ?? internalIsMobile())

  createEffect(() => {
    if (!resolvedIsMobile()) {
      setOpen(false)
    }
  })

  const context: SidebarFrameT.Context = {
    isMobile: resolvedIsMobile,
    scrolled,
    isOpen,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
    variant: () => merged.variant,
    side: () => merged.side,
  }

  return (
    <div
      data-slot="root"
      style={merged.styles?.root}
      class={cn('h-full min-h-0 overflow-hidden', merged.classes?.root)}
    >
      <merged.renderFrame
        {...context}
        Sidebar={() => (
          <div
            data-slot="sidebar"
            style={merged.styles?.sidebar}
            class={sidebarFrameSidebarVariants(
              { variant: merged.variant, side: merged.side, isMobile: resolvedIsMobile() },
              merged.classes?.sidebar,
            )}
          >
            <Show when={merged.renderSidebarHeader}>
              {(renderSidebarHeader) => (
                <div
                  data-slot="sidebarHeader"
                  style={merged.styles?.sidebarHeader}
                  class={cn(merged.classes?.sidebarHeader)}
                >
                  {renderSidebarHeader()(context)}
                </div>
              )}
            </Show>

            <div
              data-slot="sidebarBody"
              style={merged.styles?.sidebarBody}
              class={cn('flex-1 min-h-0', merged.classes?.sidebarBody)}
            >
              {merged.renderSidebarBody(context)}
            </div>

            <Show when={merged.renderSidebarFooter}>
              {(renderSidebarFooter) => (
                <div
                  data-slot="sidebarFooter"
                  style={merged.styles?.sidebarFooter}
                  class={cn(merged.classes?.sidebarFooter)}
                >
                  {renderSidebarFooter()(context)}
                </div>
              )}
            </Show>
          </div>
        )}
        Main={() => (
          <div
            data-slot="main"
            style={merged.styles?.main}
            class={cn(
              'h-full min-h-0 overflow-y-auto',
              merged.variant === 'inset' && 'b-1 b-border rounded-2xl bg-background shadow-xs',
            )}
            data-docs-scroll-root="true"
            onScroll={(event) => {
              setScrolled(event.currentTarget.scrollTop > (merged.scrollThreshold ?? 60))
            }}
          >
            {merged.renderMain(context)}
          </div>
        )}
      />
    </div>
  )
}
