import type { FormFieldContextOptions } from '../../form/form-context.ts'

/** BaseSelect ownership shared by the Select-family visual wrappers. */
export const BASE_SELECT_FORWARD_PROP_KEYS = [
  'items',
  'itemToLabelString',
  'id',
  'name',
  'required',
  'disabled',
  'readOnly',
  'value',
  'defaultValue',
  'onChange',
  'open',
  'defaultOpen',
  'onOpenChange',
  'closeOnSelect',
] as const

/** Popup slots resolved by Select and forwarded to BaseSelect. */
export const BASE_SELECT_SHARED_SLOTS = [
  'content',
  'listbox',
  'item',
  'group',
  'groupLabel',
  'separator',
  'empty',
] as const

/** Mirrors the invalid semantics used by the Select-owned form controller. */
export function isFormFieldInvalid(field: FormFieldContextOptions | null): boolean {
  const error = field?.error
  return error !== undefined && error !== null && error !== false && error !== ''
}
