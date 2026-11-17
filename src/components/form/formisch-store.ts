import type { Schema } from '@formisch/solid'
import { INTERNAL, validateFormInput } from '@formisch/solid/internals'

import type { FormT } from './form.types'

/**
 * The only module that touches Formisch internals. Formisch's public `handleSubmit` always focuses
 * invalid fields, which conflicts with the invalid focus manager, and the public `submit` needs the
 * form element, so both are driven through the store's internal state here.
 */

/** Publishes the rendered `<form>` so Formisch's `submit(form)` can call `requestSubmit()`. */
export function setFormElement<TSchema extends Schema>(
  form: FormT.Store<TSchema>,
  element: HTMLFormElement | undefined,
): void {
  form[INTERNAL].element = element
}

/** Returns the published `<form>`. */
export function getFormElement<TSchema extends Schema>(
  form: FormT.Store<TSchema>,
): HTMLFormElement | undefined {
  return form[INTERNAL].element
}

/**
 * Validates and submits without moving focus. Mirrors Formisch's `handleSubmit` state handling:
 * superseded submissions leave the shared flags alone, and failures land in the form errors.
 */
export function submitFormWithoutFocus<TSchema extends Schema>(
  form: FormT.Store<TSchema>,
  handler: (output: unknown) => unknown,
  unknownError: () => string,
): void {
  const internal = form[INTERNAL]
  const submissionId = ++internal.submissionId
  internal.isSubmitted.value = true
  internal.isSubmitting.value = true
  const validationId = internal.validationId + 1
  let isHandlingSubmit = false

  void (async () => {
    try {
      const result = await validateFormInput(internal, { shouldFocus: false })
      if (
        result.success &&
        internal.submissionId === submissionId &&
        internal.validationId === validationId
      ) {
        isHandlingSubmit = true
        await handler(result.output)
      }
    } catch (error) {
      if (
        internal.submissionId === submissionId &&
        (isHandlingSubmit || internal.validationId === validationId)
      ) {
        internal.errors.value = [
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string'
            ? error.message
            : unknownError(),
        ]
      }
    } finally {
      if (internal.submissionId === submissionId) {
        internal.isSubmitting.value = false
      }
    }
  })()
}
