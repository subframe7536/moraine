import type {
  FormProps as FormischFormProps,
  FormSchema,
  FormStore,
  SubmitEventHandler,
} from '@formisch/solid'
import { Form as FormischForm } from '@formisch/solid'
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'

import { FormProvider } from './form-context'

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

  export interface Props<TSchema extends FormSchema = FormSchema> extends BaseProps<
    Base<TSchema>,
    Variant,
    Slot
  > {}
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
  ])

  return (
    <FormProvider value={local.of as FormStore}>
      <FormischForm
        {...formProps}
        of={local.of}
        onSubmit={local.onSubmit ?? (() => {})}
        style={{ ...local.styles?.root, ...local.style }}
        class={cn('w-full data-submitting:opacity-80', local.classes?.root, local.class)}
        data-submitting={local.of.isSubmitting ? '' : undefined}
      />
    </FormProvider>
  )
}
