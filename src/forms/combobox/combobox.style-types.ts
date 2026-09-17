import type { BaseSelectStyleSlot } from '../base-select/base-select.style-types.ts'
import type {
  SelectControlStyleVariant,
  SelectItemStyleSlot,
} from '../shared/select/style-types.ts'

export interface ComboboxControlStyleSlot<T = unknown> {
  /** Outer visual field and floating anchor. */ control?: T
  /** Icon shown before the editable input. */ leading?: T
  /** Editable query input and authoritative combobox focus owner. */ input?: T
  /** Button used to clear the selected value and query. */ clear?: T
  /** Secondary button that toggles the popup. */ trigger?: T
}
export interface ComboboxStyleSlot<T = unknown>
  extends BaseSelectStyleSlot<T>, ComboboxControlStyleSlot<T>, SelectItemStyleSlot<T> {}
export type ComboboxStyleVariant = SelectControlStyleVariant
