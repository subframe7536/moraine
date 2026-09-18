import type { ComponentSize, TextControlVariant } from '../../../theme/style/style-types.ts'

/** Shared visual variants for Select-family field controls. */
export interface SelectControlStyleVariant {
  /**
   * Visual treatment of the component.
   * @default 'outline'
   */
  variant?: TextControlVariant
  /**
   * Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
}

/** Shared item-content slots for collection-backed Select-family controls. */
export interface SelectItemStyleSlot<T = unknown> {
  /** Message shown when filtering leaves no selectable items. */
  empty?: T
  /** Leading icon inside an item row. */
  itemLeading?: T
  /** Text region containing the primary label and optional description. */
  itemLabel?: T
  /** Supporting description text inside an item row. */
  itemDescription?: T
  /** Trailing region inside an item row, usually for selection state or custom content. */
  itemTrailing?: T
}
