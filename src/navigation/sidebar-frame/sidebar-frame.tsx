import type { JSX, Component, Accessor } from 'solid-js'
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
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { createMediaQuery } from '../../shared/use-media-query.ts'
import { cn } from '../../shared/utils.ts'

import { SIDEBAR_FRAME_DESKTOP_SIDEBAR_CLASS, sidebarFrameRecipe } from './sidebar-frame.class.ts'
import type { SidebarFrameVariantProps } from './sidebar-frame.class.ts'

export namespace SidebarFrameT {
  /**
   * Render context exposed to sidebar/main render functions.
   */
  export interface BaseContext extends Omit<Variant, 'isMobile'> {
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
    sidebar: Component<{
      classes?: SlotClassValue
      styles?: JSX.CSSProperties
      [x: string]: unknown
    }>
    /**
     * Processed main block component.
     */
    main: Component<{ classes?: SlotClassValue; styles?: JSX.CSSProperties; [x: string]: unknown }>
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

    /** Desktop layout wrapper around sidebar and main. */
    desktopLayout?: T

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
     * Callback ref for the main scroll container element (`data-slot="main"`).
     * Useful for programmatic scrolling, e.g. scrolling to top on route change.
     */
    mainRef?: (el: HTMLDivElement) => void
    /**
     * Callback ref for the sidebar container element (`data-slot="sidebar"`).
     */
    sidebarRef?: (el: HTMLDivElement) => void
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
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
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
      />
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
          class={sidebarFrameRecipe({
            variant: ctx.variant,
            side: ctx.side,
            isMobile: false,
          }).desktopLayout()}
        >
          <ctx.sidebar
            classes={[
              SIDEBAR_FRAME_DESKTOP_SIDEBAR_CLASS,
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
                    class: cn(
                      '[&>[data-slot=sidebar]]:border-0!',
                      ctx.resizablePanelOptions?.class,
                    ),
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
                    class: cn(
                      '[&>[data-slot=sidebar]]:border-0!',
                      ctx.resizablePanelOptions?.class,
                    ),
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
  const config = useMoraineConfig()
  const providerSidebarFrame = () => config().sidebarFrame

  const merged = mergeProps(
    {
      variant: 'default' as const,
      side: 'left' as const,
      scrollThreshold: 60,
      frameRender: SidebarFrameSheetOnlyRender,
    },
    () => providerSidebarFrame()?.variants,
    local,
  )

  const [internalIsMobile, setInternalIsMobile] = createSignal(false)
  const [isOpen, setOpen] = createSignal(untrack(() => merged.isMobile !== true))
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

  const resolvedIsMobile = createMemo<boolean>(() => Boolean(merged.isMobile ?? internalIsMobile()))

  createEffect(() => {
    const isMobile = resolvedIsMobile()
    untrack(() => setOpen(!isMobile))
  })

  const slots = createMemo(() =>
    sidebarFrameRecipe({
      isMobile: resolvedIsMobile(),
      side: merged.side,
      variant: merged.variant,
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return providerSidebarFrame()
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
            aria-hidden={resolvedIsMobile() || !isOpen()}
            {...props}
            {...resolved.slotClassAndStyle('sidebar', {
              group: props.classes,
              groupStyle: props.styles,
            })}
          >
            <Show when={merged.sidebarHeaderRender !== undefined}>
              <div data-slot="sidebarHeader" {...resolved.slotClassAndStyle('sidebarHeader')}>
                {renderComponentOrElement(merged.sidebarHeaderRender, context)}
              </div>
            </Show>

            <div data-slot="sidebarBody" {...resolved.slotClassAndStyle('sidebarBody')}>
              {renderComponentOrElement(merged.sidebarBodyRender, context)}
            </div>

            <Show when={merged.sidebarFooterRender !== undefined}>
              <div data-slot="sidebarFooter" {...resolved.slotClassAndStyle('sidebarFooter')}>
                {renderComponentOrElement(merged.sidebarFooterRender, context)}
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
              group: props.classes,
              groupStyle: props.styles,
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
