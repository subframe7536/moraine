export type ResizableOrientation = 'vertical' | 'horizontal'

export const PRECISION = 6
export const EPSILON = 10 ** -PRECISION

/**
 * Panel constraints resolved to fractions of the layout (0..1).
 */
export interface ResizableResolvedPanel {
  panelId: string
  min: number
  max: number
  resizable: boolean
  collapsible: boolean
  collapsedSize: number
}
