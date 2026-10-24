import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'

export interface TreeStyleSlot<T = unknown> {
  /** Tree container that owns the `tree` role and the item collection. */
  root?: T

  /** `treeitem` host for one node. In nested mode it also contains the node's child group. */
  item?: T

  /** Interactive row inside an item that carries indentation, hover, and selection styling. */
  row?: T

  /** Expand and collapse affordance at the start of a row. */
  trigger?: T

  /** Optional node icon, such as a folder or file. */
  icon?: T

  /** Node text. */
  label?: T

  /** `group` that contains the child items of an expanded node. */
  content?: T
}

export interface TreeStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** How the selected row is highlighted.
   * @default 'subtle'
   */
  variant?: 'subtle' | 'solid'
}

export type TreeStyleConfig = ComponentStyleConfig<TreeStyleSlot, TreeStyleVariants>
