import type { FormConfig, FormSchema, FormStore, RequiredPath } from '@formisch/solid'
import {
  createForm as createFormischForm,
  Form as FormischForm,
  reset as resetForm,
} from '@formisch/solid'
import type { JSX } from 'solid-js'
import { onCleanup, splitProps, untrack } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types.ts'
import { callHandler, callRef } from '../../shared/utils'
import { renderField } from '../field/field'

import { useFormischFieldBinding } from './form-field-binding'
import { formRecipe } from './form.recipe'
import type { FormProps, FormT } from './form.types'
import { createInvalidFocusManager } from './invalid-focus-manager'
import type { InvalidFocusManager } from './invalid-focus-manager'
interface InternalFormProps<TSchema extends FormSchema> extends FormProps<TSchema> {
  focusManager: InvalidFocusManager
  of: FormStore<TSchema>
}

function FormRoot<TSchema extends FormSchema>(props: InternalFormProps<TSchema>): JSX.Element {
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
  untrack(() => local.focusManager.attach(local.of))

  const onReset: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    const form = local.of
    callHandler(event, local.onReset)
    setTimeout(() => {
      if (!event.defaultPrevented) {
        resetForm(form)
      }
    }, 0)
  }

  const onSubmitCapture = (): void => {
    local.focusManager.requestFocus()
  }

  return (
    <FormischForm
      {...formProps}
      ref={(element) => {
        element.addEventListener('submit', onSubmitCapture, true)
        callRef(local.ref, element)
        onCleanup(() => {
          element.removeEventListener('submit', onSubmitCapture, true)
          callRef(local.ref, undefined)
        })
      }}
      of={local.of}
      onSubmit={local.onSubmit ?? (() => {})}
      onReset={onReset}
      {...resolved.styles.root}
      data-slot="root"
      data-submitting={local.of.isSubmitting ? '' : undefined}
    >
      {local.children}
    </FormischForm>
  )
}

/** Creates a reactive Formisch store with Moraine form adapters. */
export function createForm<TSchema extends FormSchema>(
  config: FormConfig<TSchema>,
): FormT.Instance<TSchema> {
  const store = createFormischForm(config)
  const focusManager = createInvalidFocusManager()

  const BoundForm = (props: FormT.Props<TSchema>): JSX.Element => (
    <FormRoot {...props} focusManager={focusManager} of={store} />
  )

  const BoundField = <T extends ValidComponent = 'div'>(
    props: FormT.FieldProps<TSchema, T>,
  ): JSX.Element => {
    // oxlint-disable-next-line subf/solid-reactivity -- Formisch tracks the path accessor passed to useField.
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
