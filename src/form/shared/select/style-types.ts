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
  /** Text column containing the label and description. */
  itemWrapper?: T
  /** Primary label inside an item row. */
  itemLabel?: T
  /** Supporting description text inside an item row. */
  itemDescription?: T
  /** Selected-state indicator inside an item row. */
  itemIndicator?: T
}
