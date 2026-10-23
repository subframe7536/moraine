import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { ResizableOrientation, ResizableSize } from './hook'
import type { defaultResizableMessages } from './resizable.messages'
import type { ResizableStyleSlot, ResizableStyleVariants } from './resizable.style-types'

export namespace ResizableT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = ResizableStyleSlot<T>

  export type Variants = ResizableStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultResizableMessages>
  export type Translations = Partial<Messages>

  export interface HandleRenderProps {
    orientation: ResizableOrientation
    disabled: boolean
    action: 'resize' | 'collapse'
    active: boolean
    dragging: boolean
    canCollapse: boolean
    collapsed: boolean
  }

  /** Base props for the Resizable component. */
  export interface Base {
    /** Localized message overrides for this resizable instance. */
    translations?: Translations

    /** Unique identifier for the resizable root. */
    id?: string

    /** Ordered `Resizable.Panel` and `Resizable.Handle` children. */
    children?: JSX.Element

    /** Controlled panel sizes. Numbers are pixels; percentage strings are relative to the root. */
    value?: readonly ResizableSize[]

    /** Initial panel sizes for uncontrolled usage. */
    defaultValue?: readonly ResizableSize[]

    /** Callback when panel sizes change. Values are in pixels. */
    onValueChange?: (sizes: number[]) => void

    /** Callback when a resize operation starts. Values are in pixels. */
    onResizeStart?: (sizes: number[]) => void

    /** Callback when a resize operation ends. Values are in pixels. */
    onResizeEnd?: (sizes: number[]) => void

    /** Callback when a key is pressed on a handle. */
    onHandleKeyDown?: (context: {
      event: KeyboardEvent
      handleIndex: number
      sizes: number[]
    }) => void

    /**
     * Whether the resizable component is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * The amount to resize when using keyboard shortcuts.
     * @default '10%'
     */
    keyboardDelta?: ResizableSize
  }

  /** Props for the Resizable component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>

  export interface PanelBase {
    /**
     * Minimum size of the panel.
     * - Use string as percent, like `20%`
     * - Use number as px, like `328`
     * @default 0
     */
    min?: ResizableSize

    /**
     * Maximum size of the panel.
     * - Use string as percent, like `20%`
     * - Use number as px, like `328`
     * @default 1
     */
    max?: ResizableSize

    /**
     * Whether the panel is resizable.
     * @default true
     */
    resizable?: boolean

    /**
     * Whether the panel is collapsible.
     * @default false
     */
    collapsible?: boolean

    /**
     * Size of the panel when collapsed. Only applies when `collapsible` is true.
     * - Use string as percent, like `20%`
     * - Use number as px, like `328`
     * @default 0
     */
    collapsibleMin?: ResizableSize

    /** Callback when the panel is collapsed. Size is in pixels. */
    onCollapse?: (size: number) => void

    /** Callback when the panel is expanded. Size is in pixels. */
    onExpand?: (size: number) => void

    /** Content rendered inside the panel. */
    children?: JSX.Element
  }

  export type PanelProps = BaseProps<'div', PanelBase, never, never, never>

  export interface HandleBase {
    /**
     * Handle interaction behavior.
     * @default 'resize'
     */
    action?: 'resize' | 'collapse'

    /**
     * Whether this handle participates in intersection resizing.
     * @default false
     */
    intersection?: boolean

    /**
     * Content or render function receiving the live handle state.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children?: JSX.Element | Component<HandleRenderProps>
  }

  export type HandleProps = BaseProps<'div', HandleBase, never, never, never>
}

/** Props for the Resizable component. */
export type ResizableProps = ResizableT.Props
