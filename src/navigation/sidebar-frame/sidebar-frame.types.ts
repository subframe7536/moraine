import type { Accessor, Component, JSX } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

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

  export interface Variant {
    isMobile?: boolean | 'true' | 'false' | null
    side?: 'left' | 'right' | null
    variant?: 'default' | 'floating' | 'inset' | null
  }
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
