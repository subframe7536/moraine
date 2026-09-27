import type { FormConfig, RequiredPath, Schema } from '@formisch/solid'
import { createForm as createFormischForm, reset as resetForm } from '@formisch/solid'
import { INTERNAL, validateFormInput } from '@formisch/solid/internals'
import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types.ts'
import { callHandler, callRef } from '../../shared/utils'
import { renderField } from '../field/field'
import { scheduleFormReset } from '../shared/form-reset-scheduler.ts'

import { useFormischFieldBinding } from './form-field-binding'
import { formDataAttributes, formRecipe } from './form.recipe'
import type { FormProps, FormT } from './form.types'
import { createInvalidFocusManager } from './invalid-focus-manager'
import type { InvalidFocusManager } from './invalid-focus-manager'
interface InternalFormProps<TSchema extends Schema> extends FormProps<TSchema> {
  focusManager: InvalidFocusManager
  of: FormT.Store<TSchema>
}

function FormRoot<TSchema extends Schema>(props: InternalFormProps<TSchema>): JSX.Element {
  const [local, formProps] = splitProps(props, [
    'class',
    'style',
    'classes',
    'styles',
    'ref',
    'focusManager',
    'of',
    'onSubmit',
    'onReset',
    'children',
  ])
  const resolved = createStyles(formRecipe, local)

  const onReset: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    const form = local.of
    callHandler(event, local.onReset)
    scheduleFormReset(event, () => resetForm(form), 'form')
  }

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault()
    local.focusManager.requestFocus(event.currentTarget)

    // Formisch's public handleSubmit always focuses invalid fields.
    const internal = local.of[INTERNAL]
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
          await local.onSubmit?.(result.output, event)
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
              : 'An unknown error has occurred.',
          ]
        }
      } finally {
        if (internal.submissionId === submissionId) {
          internal.isSubmitting.value = false
        }
      }
    })()
  }

  return (
    <form
      {...formProps}
      ref={(element) => {
        local.of[INTERNAL].element = element
        callRef(local.ref, element)
        onCleanup(() => {
          if (local.of[INTERNAL].element === element) {
            local.of[INTERNAL].element = undefined
          }
          callRef(local.ref, undefined)
        })
      }}
      novalidate
      onSubmit={onSubmit}
      onReset={onReset}
      {...resolved.styles.root}
      data-slot="form"
      {...formDataAttributes.root({ submitting: () => local.of.isSubmitting })}
    >
      {local.children}
    </form>
  )
}

/** Creates a reactive Formisch store with Moraine form adapters. */
export function createForm<TSchema extends Schema>(
  config: FormT.Config<TSchema>,
): FormT.Instance<TSchema> {
  const store = createFormischForm(config as FormConfig) as FormT.Store<TSchema>
  const focusManager = createInvalidFocusManager()
  focusManager.attach(store)

  const BoundForm = (props: FormT.Props<TSchema>): JSX.Element => (
    <FormRoot {...props} focusManager={focusManager} of={store} />
  )

  const BoundField = <T extends ValidComponent = 'div'>(
    props: FormT.FieldProps<TSchema, T>,
  ): JSX.Element => {
    const binding = useFormischFieldBinding(
      store,
      () => (typeof props.name === 'string' ? [props.name] : props.name) as RequiredPath,
      focusManager,
    )
    return renderField(props, () => binding)
  }

  return Object.assign(store, {
    Form: BoundForm,
    Field: BoundField,
  })
}
