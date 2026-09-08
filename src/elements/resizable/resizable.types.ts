import type { JSX } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { ResizableOrientation, ResizablePanelItem, ResizableSize } from './hook/index.ts'

export namespace ResizableT {
  export type Kind = 'composite'

  export interface HandleContext {
    orientation: ResizableOrientation
    disabled: boolean
    action: 'resize' | 'collapse'
    active: boolean
    dragging: boolean
    canCollapse: boolean
    collapsed: boolean
  }

  export interface Slot<T = unknown> {
    /** Layout container that owns resizable panels and handles. */
    root?: T

    /** Content pane whose size is controlled by adjacent resize handles. */
    panel?: T

    /** Visual separator between adjacent panels. */
    divider?: T

    /** Interactive target users drag or focus to resize panels. */
    handle?: T

    /** Extra hit target used when nested handles meet across axes. */
    crossTarget?: T
  }

  export interface Variant {
    /** Layout axis used by the component Recipe. */
    orientation?: ResizableOrientation | null
  }

  export type SlotName = keyof Slot

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Base props for the Resizable component. */
  export interface Base {
    /** Axis along which panels resize. @default 'horizontal' */
    orientation?: ResizableOrientation

    /** Unique identifier for the resizable root. */
    id?: string

    /** Ordered `Resizable.Panel` and `Resizable.Handle` children. */
    children?: JSX.Element

    /** Callback when any panel is resized. */
    onResize?: (sizes: number[]) => void

    /** Callback when a resize operation starts. */
    onResizeStart?: (sizes: number[]) => void

    /** Callback when a resize operation ends. */
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
    disable?: boolean

    /**
     * The amount to resize when using keyboard shortcuts.
     * @default '10%'
     */
    keyboardDelta?: ResizableSize
  }

  /** Props for the Resizable component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>

  export interface PanelBase extends Omit<
    ResizablePanelItem,
    'panelId' | 'content' | 'class' | 'style'
  > {
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

    /** Whether this handle participates in intersection resizing. @default false */
    intersection?: boolean

    /** Custom grip content, or a component receiving the live handle state. */
    children?: ComponentOrElement<HandleContext>
  }

  export type HandleProps = BaseProps<'div', HandleBase, never, never, never>
}

/** Props for the Resizable component. */
export interface ResizableProps extends ResizableT.Props {}
