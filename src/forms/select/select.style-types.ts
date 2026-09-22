import type { BaseSelectStyleSlot } from '../base-select/base-select.style-types'
import type {
  SelectControlStyleVariant,
  SelectItemStyleSlot,
} from '../shared/select/style-types.ts'

export interface SelectControlStyleSlot<T = unknown> {
  /** Outer visual field and floating anchor. */
  control?: T

  /** Text presentation of the selected value. */
  value?: T

  /** Icon shown before the select input or value. */
  leading?: T

  /** Icon shown after the selected value. */
  trailing?: T

  /** Primary interactive button that toggles the popup. */
  trigger?: T

  /** Pointer-only affordance used to clear the selected value. */
  clear?: T
}
export interface SelectStyleSlot<T = unknown>
  extends BaseSelectStyleSlot<T>, SelectControlStyleSlot<T>, SelectItemStyleSlot<T> {}
export type SelectStyleVariant = SelectControlStyleVariant
