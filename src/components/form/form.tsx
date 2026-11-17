import type { FormConfig, FormStore, RequiredPath, Schema } from '@formisch/solid'
import { createForm as createFormischForm, reset as resetForm } from '@formisch/solid'
import type { JSX } from 'solid-js'
import { createSignal, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { bindElement, publishElement } from '../../shared/element-binding'
import type { ValidComponent } from '../../shared/types'
import { callHandler, callRef } from '../../shared/utils'
import { Field as FieldInternal } from '../field/field'
import { scheduleFormReset } from '../shared/form/form-reset-scheduler'

import { useFormischFieldBinding } from './form-field-binding'
import { defaultFormMessages } from './form.messages'
import { formDataAttributes, formRecipe } from './form.recipe'
import type { FormProps, FormT } from './form.types'
import { getFormElement, setFormElement, submitFormWithoutFocus } from './formisch-store'
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
    'translations',
  ])
  const {
    slots: { root: rootSlot },
  } = useRecipe(formRecipe, local, {
    data: { root: formDataAttributes.root({ submitting: () => local.of.isSubmitting }) },
  })
  const messages = useMessages('form', defaultFormMessages, () => local.translations)
  const [element, setElement] = createSignal<HTMLFormElement>()
  bindElement(
    element,
    publishElement(
      () => getFormElement(local.of),
      (next) => setFormElement(local.of, next),
    ),
  )

  const onReset: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    const form = local.of
    callHandler(event, local.onReset)
    scheduleFormReset(event, () => resetForm(form), 'form')
  }

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault()
    local.focusManager.requestFocus(event.currentTarget)

    submitFormWithoutFocus(
      local.of,
      (output) => local.onSubmit?.(output as never, event),
      () => messages().unknownError,
    )
  }

  return (
    <form
      data-slot="form"
      {...rootSlot}
      {...formProps}
      ref={(element) => {
        setElement(element)
        callRef(local.ref, element)
      }}
      novalidate
      onSubmit={onSubmit}
      onReset={onReset}
    />
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
      store as FormStore,
      () => (typeof props.name === 'string' ? [props.name] : props.name) as RequiredPath,
      focusManager,
    )
    return <FieldInternal {...props} binding={binding} />
  }

  return Object.assign(store, {
    Form: BoundForm,
    Field: BoundField,
  })
}
