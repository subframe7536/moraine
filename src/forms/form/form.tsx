import type {
  FormProps as FormischFormProps,
  FormSchema,
  FormStore,
  SubmitEventHandler,
} from '@formisch/solid'
import { Form as FormischForm, reset as resetForm } from '@formisch/solid'
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { callHandler, cn } from '../../shared/utils.ts'

import { FormProvider } from './form-context.ts'
import { FORM_ROOT_CLASS } from './form.class.ts'

export namespace FormT {
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
    'class' | 'onSubmit' | 'style'
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
}

export interface FormProps<TSchema extends FormSchema = FormSchema> extends FormT.Props<TSchema> {}

/** Styled Formisch form that provides its store to Moraine form fields. */
export function Form<TSchema extends FormSchema>(props: FormProps<TSchema>): JSX.Element {
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
    <FormProvider value={local.of as FormStore}>
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
    </FormProvider>
  )
}
