import type { BaseSelectStyleSlot } from '../base-select/base-select.style-types'
import type {
  SelectControlStyleVariant,
  SelectItemStyleSlot,
} from '../shared/select/style-types.ts'

export interface MultiSelectControlStyleSlot<T = unknown> {
  /** Multi-select control that displays selected tags and opens the popup. */ control?: T
  /** Search input used to filter or add selections. */ input?: T
  /** Icon shown before the selected tags and search input. */ leading?: T
  /** Button region that toggles the multi-select popup. */ trigger?: T
  /** Button used to clear all selected values. */ clear?: T
  /** Wrapper that lays out selected value tags inside the control. */ tagsContainer?: T
  /** Selected value tag. */ tag?: T
  /** Text label inside a selected value tag. */ tagLabel?: T
  /** Button used to remove one selected value. */ tagRemove?: T
  /** Counter shown when selected tags exceed the visible limit. */ tagOverflow?: T
}
export interface MultiSelectStyleSlot<T = unknown>
  extends BaseSelectStyleSlot<T>, MultiSelectControlStyleSlot<T>, SelectItemStyleSlot<T> {}
export type MultiSelectStyleVariant = SelectControlStyleVariant
