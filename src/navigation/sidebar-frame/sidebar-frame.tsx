import type { ClassValue } from 'cls-variant'
import type { JSX, Component, Accessor } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, mergeProps, on, untrack } from 'solid-js'

import { Resizable } from '../../elements/resizable'
import type { ResizableT } from '../../elements/resizable'
import { Sheet } from '../../overlays/sheet'
import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { createMediaQuery } from '../../shared/use-media-query'
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
  export interface BaseContext extends Variant {
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
  }

  /**
   * Extended render context for frame composition.
   */
  export interface FrameContext extends BaseContext {
    /**
     * Processed sidebar block component.
     */
    sidebar: Component<{ classes?: ClassValue; styles?: JSX.CSSProperties; [x: string]: unknown }>
    /**
     * Processed main block component.
     */
    main: Component<{ classes?: ClassValue; styles?: JSX.CSSProperties; [x: string]: unknown }>
  }

  export type SidebarHeaderRenderProps = BaseContext
  export type SidebarBodyRenderProps = BaseContext
  export type SidebarFooterRenderProps = BaseContext
  export type MainRenderProps = BaseContext
  export type FrameRenderProps = FrameContext

  /**
   * Slot keys for classes/styles overrides.
   */
  export interface Slot<T = unknown> {
    /**
     * Frame container that coordinates sidebar and main content layout.
     */
    root?: T

    /** Sidebar region rendered inline on desktop or inside a sheet on mobile. */
    sidebar?: T

    /** Optional header region at the top of the sidebar. */
    sidebarHeader?: T

    /** Main sidebar content region. */
    sidebarBody?: T

    /** Optional footer region at the bottom of the sidebar. */
    sidebarFooter?: T

    /** Primary content region beside or beneath the sidebar. */
    main?: T
  }

  export type Variant = SidebarFrameVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  export interface Base {
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
    sidebarHeaderRender?: ComponentOrElement<SidebarHeaderRenderProps>
    /**
     * Render function for sidebar body section.
     */
    sidebarBodyRender: ComponentOrElement<SidebarBodyRenderProps>
    /**
     * Optional render function for sidebar footer section.
     */
    sidebarFooterRender?: ComponentOrElement<SidebarFooterRenderProps>
    /**
     * Render function for main content section.
     */
    mainRender: ComponentOrElement<MainRenderProps>
    /**
     * Optional frame renderer used to compose sidebar/main layout.
     * @default SidebarFrameSheetOnlyRender
     */
    frameRender?: ComponentOrElement<FrameRenderProps>
  }

  /**
   * Props for the SidebarFrame component.
   */
  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

/**
 * Props for the SidebarFrame component.
 */
export interface SidebarFrameProps extends SidebarFrameT.Props {}

function renderMobileSheet(ctx: SidebarFrameT.FrameContext): JSX.Element {
  return (
    <>
      <Sheet
        side={ctx.side}
        open={ctx.isOpen()}
        onOpenChange={ctx.setOpen}
        close={false}
        body={<ctx.sidebar />}
      >
        <span class="hidden" aria-hidden="true" />
      </Sheet>
      <ctx.main />
    </>
  )
}

/**
 * Default frame renderer: mobile uses `Sheet`, desktop uses animated split layout.
 */
export function SidebarFrameSheetOnlyRender(ctx: SidebarFrameT.FrameContext): JSX.Element {
  return (
    <Show
      when={ctx.isMobile()}
      fallback={
        <div
          data-slot="layout"
          class={sidebarFrameDesktopLayoutVariants({ variant: ctx.variant, side: ctx.side })}
        >
          <ctx.sidebar
            classes={[
              'transition-mo-enter min-h-0 transition-[width,opacity,transform] overflow-hidden motion-reduce:transition-none',
              ctx.isOpen()
                ? 'opacity-100 translate-x-0'
                : [
                    'opacity-0 w-0 pointer-events-none',
                    ctx.side === 'left' ? '-translate-x-2' : 'translate-x-2',
                  ],
            ]}
          />
          <ctx.main />
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
            ctx.side === 'left'
              ? [
                  {
                    content: <ctx.sidebar />,
                    ...ctx.resizablePanelOptions,
                    class: cn('rm-side-b', ctx.resizablePanelOptions?.class),
                  },
                  {
                    content: <ctx.main />,
                  },
                ]
              : [
                  {
                    content: <ctx.main />,
                  },
                  {
                    content: <ctx.sidebar />,
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
      variant: 'default' as SidebarFrameT.Variant['variant'],
      side: 'left' as SidebarFrameT.Variant['side'],
      scrollThreshold: 60,
      frameRender: SidebarFrameSheetOnlyRender,
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
      return merged.variant
    },
    get side() {
      return merged.side
    },
  }

  return (
    <div
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn('h-screen max-h-full min-h-0 overflow-hidden', merged.classes?.root, merged.class)}
    >
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
            data-slot="sidebar"
            data-mobile={context.isMobile() ? '' : undefined}
            data-side={context.side}
            aria-hidden={resolvedIsMobile() || !isOpen()}
            {...props}
            style={{
              ...props.styles,
              ...merged.styles?.sidebar,
            }}
            class={sidebarFrameSidebarVariants(
              { variant: merged.variant, side: merged.side, isMobile: resolvedIsMobile() },
              props.classes,
              merged.classes?.sidebar,
            )}
          >
            <Show when={merged.sidebarHeaderRender !== undefined}>
              <div
                data-slot="sidebarHeader"
                style={merged.styles?.sidebarHeader}
                class={cn(merged.classes?.sidebarHeader)}
              >
                {renderComponentOrElement(merged.sidebarHeaderRender, context)}
              </div>
            </Show>

            <div
              data-slot="sidebarBody"
              style={merged.styles?.sidebarBody}
              class={cn('flex-1 min-h-0 overflow-y-auto', merged.classes?.sidebarBody)}
            >
              {renderComponentOrElement(merged.sidebarBodyRender, context)}
            </div>

            <Show when={merged.sidebarFooterRender !== undefined}>
              <div
                data-slot="sidebarFooter"
                style={merged.styles?.sidebarFooter}
                class={cn(merged.classes?.sidebarFooter)}
              >
                {renderComponentOrElement(merged.sidebarFooterRender, context)}
              </div>
            </Show>
          </div>
        ),
        main: (props) => (
          <div
            data-slot="main"
            {...props}
            style={{
              ...props.styles,
              ...merged.styles?.main,
            }}
            class={cn(
              'scroll-smooth flex-1 h-full min-h-0 min-w-0 overflow-y-auto',
              merged.variant === 'inset' && 'surface-border rounded-2xl bg-background shadow-xs',
              props.classes,
              merged.classes?.main,
            )}
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
