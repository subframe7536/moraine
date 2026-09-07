import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { ResizableOrientation, ResizablePanelItem, ResizableSize } from './hook/index.ts'

export namespace ResizableT {
  export interface HandleRenderProps {
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
    orientation?: ResizableOrientation
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item extends ResizablePanelItem {}

  /** Base props for the Resizable component. */
  export interface Base {
    /** Unique identifier for the resizable root. */
    id?: string

    /** Array of panels to render. */
    panels?: Item[]

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
     * Whether to render handles between panels.
     * @default true
     */
    handle?: boolean

    /** Custom component rendered inside each handle. */
    handleRender?: ComponentOrElement<HandleRenderProps>

    /**
     * Handle interaction behavior.
     * - `resize`: handle area follows divider resize interactions.
     * - `collapse`: handle click toggles the nearest collapsible panel.
     * @default 'resize'
     */
    handleAction?: 'resize' | 'collapse'

    /**
     * Whether to use intersection-based handle sizing.
     * @default false
     */
    intersection?: boolean

    /**
     * The amount to resize when using keyboard shortcuts.
     * @default '10%'
     */
    keyboardDelta?: ResizableSize
  }

  /** Props for the Resizable component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the Resizable component. */
export interface ResizableProps extends ResizableT.Props {}
