import type { Accessor, Component, JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { ResizableOrientation } from './hook'
import type { ResizableStyleSlot, ResizableStyleVariants } from './resizable.style-types'

export namespace ResizableT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = ResizableStyleSlot<T>
  export type Variants = ResizableStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * Panel layout record: panel id -> size as a percentage of the group (0-100).
   */
  export type Layout = Record<string, number>

  /**
   * State provided to `Resizable.Handle` render-function children.
   */
  export interface HandleRenderProps {
    orientation: ResizableOrientation
    disabled: boolean
    active: boolean
    dragging: boolean
    canCollapse: boolean
    collapsed: boolean
  }

  /**
   * Imperative panel API returned by `Resizable.usePanel()` inside panel content.
   */
  export interface PanelContext {
    id: string
    /** Current size of the panel as a percentage of the group (0-100). */
    size: Accessor<number>
    collapsed: Accessor<boolean>
    /** Collapses the panel to `collapsedSize`. */
    collapse: () => void
    /** Expands the panel to its last expanded size, or `min`. */
    expand: () => void
    /** Resizes the panel to a percentage of the group (0-100). */
    resize: (size: number) => void
  }

  export interface Base {
    id?: string
    children?: JSX.Element
    /**
     * Controlled layout keyed by panel id (percent 0-100).
     * When provided the component is fully controlled.
     */
    value?: Layout
    /**
     * Initial layout keyed by panel id (percent 0-100) for uncontrolled usage.
     * Panels without an entry share the remaining space.
     */
    defaultValue?: Layout
    /**
     * Called with the full layout record for the current panel ids on every
     * layout change.
     */
    onValueChange?: (layout: Layout) => void
    /**
     * Called once per completed interaction with the final layout record:
     * at drag end (only when the layout changed), on each keyboard step that
     * changed the layout, on collapse toggles, and on each
     * `Resizable.usePanel()` collapse/expand/resize call.
     */
    onValueCommit?: (layout: Layout) => void
    /**
     * Keyboard resize step in percent of the group.
     * @default 10
     */
    keyboardDelta?: number
    disabled?: boolean
  }

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>

  export interface PanelBase {
    /**
     * Panel id. Used as the key in layout records and as the DOM id.
     * Generated when omitted.
     */
    id?: string
    /** Minimum size as a percentage of the group (0-100). @default 0 */
    min?: number
    /** Maximum size as a percentage of the group (0-100). @default 100 */
    max?: number
    /** Whether the panel can be resized by handle interactions. @default true */
    resizable?: boolean
    /** Whether the panel can collapse to `collapsedSize`. */
    collapsible?: boolean
    /** Size in percent applied when the panel is collapsed. @default 0 */
    collapsedSize?: number
    /** Called when the panel transitions to collapsed. */
    onCollapse?: () => void
    /** Called when the panel transitions out of collapsed. */
    onExpand?: () => void
    children?: JSX.Element
  }

  export type PanelProps = BaseProps<'div', PanelBase, never, never, never>

  export interface HandleBase {
    /**
     * Extends the hit target to the crossing handles of nested resizable
     * groups so the junction drags on both axes at once.
     */
    intersection?: boolean
    /**
     * Handle content. `false` hides the decorative grip; a function receives
     * {@link HandleRenderProps} and mounts as a component.
     */
    children?: JSX.Element | Component<HandleRenderProps>
  }

  export type HandleProps = BaseProps<'div', HandleBase, never, never, never>
}

export type ResizableProps = ResizableT.Props
