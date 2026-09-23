import type { Orientation } from '../../theme/style/style-types.ts'
export interface ResizableStyleSlot<T = unknown> {
  /** Layout container that owns resizable panels and handles. */
  root?: T

  /** Content pane whose size is controlled by adjacent resize handles. */
  panel?: T

  /** Visual separator between adjacent panels. */
  handle?: T

  /** Interactive target users drag or focus to resize panels. */
  handleControl?: T

  /** Extra hit target used when nested handles meet across axes. */
  intersection?: T
}

export interface ResizableStyleVariant {
  /** Layout axis used by the component Recipe. */
  orientation?: Orientation | null
}
