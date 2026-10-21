import type { FieldElement, FieldStore, FormSchema, FormStore, RequiredPath } from '@formisch/solid'
import { useField } from '@formisch/solid'
import type { Accessor } from 'solid-js'
import { createMemo, onCleanup, untrack } from 'solid-js'

import type { FieldBinding } from '../field/field-context'

import type { InvalidFocusManager } from './invalid-focus-manager'

type LooseUseField = (form: FormStore, config: () => { path: RequiredPath }) => FieldStore

export function useFormischFieldBinding<TSchema extends FormSchema>(
  form: FormStore<TSchema>,
  path: Accessor<RequiredPath>,
  invalidFocusManager?: Pick<InvalidFocusManager, 'register'>,
): FieldBinding {
  // Formisch tracks its getter config and updates the field when the path changes.
  const field = (useField as unknown as LooseUseField)(form, () => ({ path: path() }))
  const invalid = createMemo(() => Boolean(field.errors?.length))
  const invalidFocusRegistration = untrack(() => invalidFocusManager?.register(invalid))

  onCleanup(() => invalidFocusRegistration?.unregister())

  return {
    get name() {
      return field.props.name
    },
    get path() {
      return field.path?.slice()
    },
    get value() {
      return field.input
    },
    get error() {
      return field.errors?.[0]
    },
    get runtimeState() {
      return {
        touched: field.isTouched,
        dirty: field.isDirty,
        focused: false,
        validating: false,
        valid: field.isValid,
      }
    },
    controlRef(element) {
      invalidFocusRegistration?.setControl(element)
      if (element) {
        // Formisch only types native controls, but its registry focuses any HTMLElement.
        field.props.ref(element as FieldElement)
      }
    },
    setValue(value) {
      field.onInput(value)
    },
    emit(type, event) {
      if (type === 'blur') {
        field.props.onBlur()
      } else if (type === 'focus') {
        field.props.onFocus()
      } else if (type === 'change') {
        if (event && 'currentTarget' in event) {
          field.props.onChange(event as Parameters<typeof field.props.onChange>[0])
        }
      } else if (type === 'input') {
        if (event && 'currentTarget' in event) {
          field.props.onInput(event as Parameters<typeof field.props.onInput>[0])
        }
      }
    },
  }
}
