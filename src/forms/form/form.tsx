import type {
  FormConfig,
  FormProps as FormischFormProps,
  FormSchema,
  FormStore,
  SubmitEventHandler,
  ValidationMode as FormischValidationMode,
} from '@formisch/solid'
import {
  createForm as createFormischForm,
  Form as FormischForm,
  reset as resetForm,
} from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'
import { createComponent, mergeProps, splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { callHandler, cn } from '../../shared/utils.ts'

import type { FormFieldProps } from './form-field.tsx'
import { FormField } from './form-field.tsx'
import { FORM_ROOT_CLASS } from './form.class.ts'

export namespace FormT {
  export interface Instance<TSchema extends FormSchema = FormSchema> extends FormStore<TSchema> {
    Form: (props: Props<TSchema>) => JSX.Element
    Field: <T extends ValidComponent = 'div'>(props: FieldProps<TSchema, T>) => JSX.Element
  }

  export type ValidationMode = FormischValidationMode

  export interface Slot<T = unknown> {
    /** Native form element managed by Formisch. */
    root?: T
  }

  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  export interface Base<TSchema extends FormSchema = FormSchema> extends Omit<
    FormischFormProps<TSchema>,
    'class' | 'onSubmit' | 'style' | 'of'
  > {
    /** Called with validated schema output and the native submit event. */
    onSubmit?: SubmitEventHandler<TSchema>
  }

  export type Props<TSchema extends FormSchema = FormSchema> = BaseProps<
    'form',
    Base<TSchema>,
    Variant,
    Classes,
    Styles
  >

  export type FieldProps<
    TSchema extends FormSchema = FormSchema,
    T extends ValidComponent = 'div',
  > = FormFieldProps<TSchema, T>
}

export type FormProps<TSchema extends FormSchema = FormSchema> = FormT.Props<TSchema>

interface InternalFormProps<TSchema extends FormSchema> extends FormT.Props<TSchema> {
  of: FormStore<TSchema>
}

function FormRoot<TSchema extends FormSchema>(props: InternalFormProps<TSchema>): JSX.Element {
  const [local, formProps] = splitProps(props, [
    'class',
    'style',
    'classes',
    'styles',
    'of',
    'onSubmit',
    'onReset',
  ])

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
      style={{ ...local.styles?.root, ...local.style }}
      class={cn(FORM_ROOT_CLASS, local.classes?.root, local.class)}
      data-slot="root"
      data-submitting={local.of.isSubmitting ? '' : undefined}
    />
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
