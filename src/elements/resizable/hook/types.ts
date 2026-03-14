import type { JSX } from 'solid-js'

export type ResizableOrientation = 'vertical' | 'horizontal'

export type ResizableSize = number | `${number}%`
export interface ResizablePanelItem {
  /**
   * Unique identifier for the panel.
   */
  panelId?: string

  /**
   * Current size of the panel (controlled).
   */
  size?: ResizableSize

  /**
   * Default size of the panel (uncontrolled).
   */
  defaultSize?: ResizableSize

  /**
   * Minimum size of the panel.
   * @default 0
   */
  min?: ResizableSize

  /**
   * Maximum size of the panel.
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
   * Callback when the panel is resized.
   */
  onResize?: (size: number) => void

  /**
   * Callback when the panel is collapsed.
   */
  onCollapse?: (size: number) => void

  /**
   * Callback when the panel is expanded.
   */
  onExpand?: (size: number) => void

  /**
   * Additional CSS classes for the panel.
   */
  class?: string

  /**
   * Additional CSS styles for the panel.
   */
  style?: JSX.CSSProperties

  /**
   * Content to render inside the panel.
   */
  content?: JSX.Element
}

export const PRECISION = 6
export const EPSILON = 10 ** -PRECISION

export interface ResizableResolvedPanel extends Omit<
  ResizablePanelItem,
  'size' | 'defaultSize' | 'min' | 'max' | 'resizable' | 'collapsible'
> {
  panelId: string
  defaultSize?: ResizableSize
  min: number
  max: number
  resizable: boolean
  collapsible: boolean
}

export interface ResizableHandleAria {
  controls?: string
  valueNow: number
  valueMin: number
  valueMax: number
}
