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
    /** Layout axis of the group; a `horizontal` group places panels side by side. */
    orientation: ResizableOrientation
    /** Whether this handle cannot be used, because the group is `disabled` or a neighboring panel has `resizable={false}`. */
    disabled: boolean
    /** Whether the handle is hovered, focused, or being dragged. */
    active: boolean
    /** Whether a pointer drag on this handle is in progress. */
    dragging: boolean
    /** Whether a neighboring panel is `collapsible`, so `Enter` can toggle it. */
    canCollapse: boolean
    /** Whether the collapsible neighbor that `Enter` would toggle is currently collapsed. */
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
    /** DOM `id` of the group's root element. */
    id?: string
    children?: JSX.Element
    /**
     * Controlled layout keyed by panel id (percent 0-100).
     * When provided the component is fully controlled: user resizing only calls `onValueChange`
     * and the panels follow whatever `value` you pass back. Panels without an entry share the
     * remaining space, and sizes are clamped to each panel's `min` and `max`.
     */
    value?: Layout
    /**
     * Initial layout keyed by panel id (percent 0-100) for uncontrolled usage.
     * Panels without an entry share the remaining space.
     * @example
     * ```tsx
     * import { Resizable } from 'moraine'
     *
     * <Resizable defaultValue={{ sidebar: 25, editor: 50, preview: 25 }}>
     *   <Resizable.Panel id="sidebar">Sidebar</Resizable.Panel>
     *   <Resizable.Handle />
     *   <Resizable.Panel id="editor">Editor</Resizable.Panel>
     *   <Resizable.Handle />
     *   <Resizable.Panel id="preview">Preview</Resizable.Panel>
     * </Resizable>
     * ```
     */
    defaultValue?: Layout
    /**
     * Called with the full layout record for the current panel ids on every
     * layout change, including each step while a drag is in progress. Use
     * `onValueCommit` to react only once an interaction finishes.
     */
    onValueChange?: (layout: Layout) => void
    /**
     * Called once per completed interaction with the final layout record:
     * at drag end (only when the layout changed), on each keyboard step that
     * changed the layout, on collapse toggles, and on each
     * `Resizable.usePanel()` collapse/expand/resize call.
     * @example
     * ```tsx
     * import { Resizable } from 'moraine'
     *
     * <Resizable
     *   defaultValue={{ nav: 30, main: 70 }}
     *   onValueCommit={(layout) => localStorage.setItem('layout', JSON.stringify(layout))}
     * >
     *   <Resizable.Panel id="nav">Nav</Resizable.Panel>
     *   <Resizable.Handle />
     *   <Resizable.Panel id="main">Main</Resizable.Panel>
     * </Resizable>
     * ```
     */
    onValueCommit?: (layout: Layout) => void
    /**
     * Percent of the group a handle moves per `Arrow` key press. `Shift` + `Arrow` moves the handle
     * as far as the panels' `min` and `max` allow, as do `Home` and `End`.
     * @default 10
     */
    step?: number
    /**
     * Whether pointer and keyboard resizing are disabled for every handle in the group. Panel
     * sizes can still change through `value` or `Resizable.usePanel()`.
     */
    disabled?: boolean
  }

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>

  export interface PanelBase {
    /**
     * Panel id. Used as the key in layout records and as the DOM id.
     * Generated when omitted.
     */
    id?: string
    /** Minimum size as a percentage of the group (0-100). Handles cannot shrink the panel below it, except by collapsing a `collapsible` panel. @default 0 */
    min?: number
    /** Maximum size as a percentage of the group (0-100). It is never smaller than `min`. @default 100 */
    max?: number
    /** Whether the panel can be resized by handle interactions. When `false`, the handles next to it are disabled. @default true */
    resizable?: boolean
    /**
     * Whether the panel can collapse to `collapsedSize`. Dragging a handle past the midpoint between
     * `min` and `collapsedSize` collapses it, and `Enter` on a neighboring handle toggles it.
     * @default false
     */
    collapsible?: boolean
    /**
     * Size in percent applied when the panel is collapsed. It is clamped between `0` and `min`, and
     * only matters for `collapsible` panels; a panel counts as collapsed once it is at this size.
     * @default 0
     * @example
     * ```tsx
     * import { Resizable } from 'moraine'
     *
     * <Resizable defaultValue={{ nav: 20, main: 80 }}>
     *   <Resizable.Panel id="nav" min={15} collapsible collapsedSize={4}>
     *     Nav
     *   </Resizable.Panel>
     *   <Resizable.Handle />
     *   <Resizable.Panel id="main">Main</Resizable.Panel>
     * </Resizable>
     * ```
     */
    collapsedSize?: number
    /** Called when the panel transitions to collapsed, from a drag, key press, `Resizable.usePanel()` call, or a `value` change. Not called for the initial layout. */
    onCollapse?: () => void
    /** Called when the panel transitions out of collapsed, from any source that can collapse it. Not called for the initial layout. */
    onExpand?: () => void
    children?: JSX.Element
  }

  export type PanelProps = BaseProps<'div', PanelBase, never, never, never>

  export interface HandleBase {
    /**
     * Extends the hit target to the crossing handles of nested resizable
     * groups so the junction drags on both axes at once.
     * @default false
     */
    intersection?: boolean
    /**
     * Handle content. `false` hides the decorative grip; a function receives
     * `HandleRenderProps` and mounts as a component, so it must declare its parameter.
     * @example
     * ```tsx
     * import { Resizable } from 'moraine'
     *
     * <Resizable defaultValue={{ a: 50, b: 50 }}>
     *   <Resizable.Panel id="a">A</Resizable.Panel>
     *   <Resizable.Handle>
     *     {(state) => <span>{state.dragging ? 'Resizing' : 'Drag'}</span>}
     *   </Resizable.Handle>
     *   <Resizable.Panel id="b">B</Resizable.Panel>
     * </Resizable>
     * ```
     */
    children?: JSX.Element | Component<HandleRenderProps>
  }

  export type HandleProps = BaseProps<'div', HandleBase, never, never, never>
}

export type ResizableProps = ResizableT.Props
