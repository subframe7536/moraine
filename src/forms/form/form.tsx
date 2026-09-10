import type { FormConfig, FormSchema, FormStore } from '@formisch/solid'
import {
  createForm as createFormischForm,
  Form as FormischForm,
  reset as resetForm,
} from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'
import { createComponent, mergeProps, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider'
import { callHandler } from '../../shared/utils'

import { FormField } from './form-field'
import type { FormProps, FormT } from './form.types'

interface InternalFormProps<TSchema extends FormSchema> extends FormProps<TSchema> {
  of: FormStore<TSchema>
}

function FormRoot<TSchema extends FormSchema>(props: InternalFormProps<TSchema>): JSX.Element {
  const [local, formProps] = splitProps(props, [
    'class',
    'style',
    'of',
    'onSubmit',
    'onReset',
    'children',
  ])
  const resolved = createComponentStyles('form', local)

  const onReset: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    const { defaultPrevented } = callHandler(event, local.onReset)

    if (!defaultPrevented) {
      // Let the native reset and control-owned reset microtasks finish before
      // Formisch restores the canonical input and metadata snapshot.
      // oxlint-disable-next-line subf/solid-reactivity -- The reset event intentionally snapshots the current store later.
      queueMicrotask(() => queueMicrotask(() => resetForm(local.of)))
    }
  }

  return (
    <FormischForm
      {...formProps}
      of={local.of}
      onSubmit={local.onSubmit ?? (() => {})}
      onReset={onReset}
      {...resolved.root}
      data-slot="root"
      data-submitting={local.of.isSubmitting ? '' : undefined}
    >
      {local.children}
    </FormischForm>
  )
}

/**
 * Creates a reactive form store bound to Moraine `<form.Form>` and `<form.Field>` components.
 */
export function createForm<TSchema extends FormSchema>(
  config: FormConfig<TSchema>,
): FormT.Instance<TSchema> {
  const store = createFormischForm(config)

  const BoundForm = (props: FormT.Props<TSchema>): JSX.Element => {
    return <FormRoot of={store} {...(props as any)} />
  }

  const BoundField = <T extends ValidComponent = 'div'>(
    props: FormT.FieldProps<TSchema, T>,
  ): JSX.Element => {
    const mergedProps = mergeProps({ form: store }, props)
    return createComponent(FormField, mergedProps as any)
  }

  return Object.assign(store, {
    Form: BoundForm,
    Field: BoundField,
  })
}
