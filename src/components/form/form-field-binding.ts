import type {
  FieldElement,
  FieldStore,
  FormSchema,
  FormStore,
  RequiredPath,
} from '@formisch/solid/v2'
import { useField } from '@formisch/solid/v2'
import { INTERNAL, getFieldStore } from '@formisch/solid/v2/internals'
import type { InternalFieldStore } from '@formisch/solid/v2/internals'
import type { Accessor } from 'solid-js'
import { untrack } from 'solid-js'

import type { FieldBinding } from '../field/field-context'
type LooseUseField = (form: FormStore, config: () => { path: RequiredPath }) => FieldStore

/**
 * Adapts a Formisch field to the Field binding contract. Native events go through
 * `field.props`; values from non-native controls go through `field.onInput`.
 */
export function useFormischFieldBinding<TSchema extends FormSchema>(
  form: FormStore<TSchema>,
  path: Accessor<RequiredPath>,
): FieldBinding {
  // Formisch tracks its getter config and updates the field when the path changes.
  const field = (useField as unknown as LooseUseField)(form, () => ({ path: path() }))
  let registeredStore: InternalFieldStore | undefined
  let registeredElement: FieldElement | undefined

  return {
    get name() {
      return field.path?.join('.')
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
      // Formisch's `ref` only ever pushes into the current path's `elements`
      // — `ref(undefined)` does not unregister — so a field whose path changed
      // would keep focusing this control under its old path. Remove the
      // element from whichever store it was registered into.
      if (registeredStore !== undefined && registeredElement !== undefined) {
        registeredStore.elements = registeredStore.elements.filter(
          (registered) => registered !== registeredElement,
        )
        registeredStore.initialElements = registeredStore.initialElements.filter(
          (registered) => registered !== registeredElement,
        )
        registeredStore = undefined
        registeredElement = undefined
      }

      if (element) {
        // Registers the control for Formisch's invalid-submit focus and `focus(form, { path })`.
        // Formisch only types native controls, but its registry focuses any HTMLElement.
        field.props.ref(element as FieldElement)
        registeredElement = element as FieldElement
        registeredStore = getFieldStore(form[INTERNAL], path())
      }
    },
    setValue(value) {
      // A command into Formisch: the state it reads to validate the input is its own
      // bookkeeping, not a dependency of whichever effect or handler sets the value.
      untrack(() => field.onInput(value))
    },
    emit(type, event) {
      // DOM focus/blur/change listeners run unowned; settle the field writes.
      if (type === 'blur') {
        field.props.onBlur()
      } else if (type === 'focus') {
        field.props.onFocus()
      } else if (type === 'change') {
        field.props.onChange(event as Event & { currentTarget: FieldElement; target: Element })
      } else if (type === 'input') {
        if (event && 'currentTarget' in event) {
          field.props.onInput(
            event as InputEvent & { currentTarget: FieldElement; target: Element },
          )
        }
      }
    },
  }
}
