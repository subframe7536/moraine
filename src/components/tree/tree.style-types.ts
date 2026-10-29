import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'

export interface TreeStyleSlot<T = unknown> {
  /** Tree container that owns the `tree` role: a `ul`. */
  root?: T

  /** `treeitem` host for one node: an `li`. In nested mode it also contains the node's child group. */
  item?: T

  /** Interactive row inside an item that carries indentation, hover, and selection styling. */
  row?: T

  /** Expand and collapse affordance at the start of a row. */
  trigger?: T

  /** Optional node icon, such as a folder or file. */
  icon?: T

  /** Bound check control shown for each item when `checkable`. */
  checkbox?: T

  /** Check or indeterminate icon inside the checkbox. */
  checkboxIcon?: T

  /** Node text. */
  label?: T

  /** Collapsible wrapper around the `group` list that contains the child items of an expanded node. */
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
  /** Whether nested items draw vertical guide lines for their ancestor levels.
   * @default true
   */
  indentGuide?: boolean
  /** Whether the content group animates its height while expanding or collapsing.
   * @default false
   */
  transition?: boolean
}

export type TreeStyleConfig = ComponentStyleConfig<TreeStyleSlot, TreeStyleVariants>
