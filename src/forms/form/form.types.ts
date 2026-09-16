import type {
  FormProps as FormischFormProps,
  FormSchema,
  FormStore,
  SubmitEventHandler,
} from '@formisch/solid'
import type * as Formisch from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { FieldProps as StandaloneFieldProps } from '../field'

export namespace FormT {
  export type Kind = 'single'

  type SchemaPath<TValue> = TValue extends readonly (infer TItem)[]
    ? readonly [number] | readonly [number, ...SchemaPath<NonNullable<TItem>>]
    : TValue extends Record<PropertyKey, unknown>
      ? {
          [TKey in Extract<keyof TValue, string | number>]:
            | readonly [TKey]
            | readonly [TKey, ...SchemaPath<NonNullable<TValue[TKey]>>]
        }[Extract<keyof TValue, string | number>]
      : never

  export type FieldName<TSchema extends FormSchema> = NonNullable<
    TSchema['~types']
  >['input'] extends infer Input
    ? Extract<keyof Input, string> | SchemaPath<Input>
    : never

  export interface Instance<TSchema extends FormSchema = FormSchema> extends FormStore<TSchema> {
    Form: (props: Props<TSchema>) => JSX.Element
    Field: <T extends ValidComponent = 'div'>(props: FieldProps<TSchema, T>) => JSX.Element
  }

  export type ValidationMode = Formisch.ValidationMode

  export interface Slot<T = unknown> {
    /** Form root container. */
    root?: T
  }

  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item {}

  export interface Base<TSchema extends FormSchema = FormSchema> extends Omit<
    FormischFormProps<TSchema>,
    'children' | 'class' | 'onSubmit' | 'style' | 'of'
  > {
    children?: JSX.Element
    /** Called with validated schema output and the native submit event. */
    onSubmit?: SubmitEventHandler<TSchema>
  }

  export type Props<TSchema extends FormSchema = FormSchema> = BaseProps<
    'form',
    Base<TSchema>,
    Variant,
    never,
    never
  >

  export type FieldProps<
    TSchema extends FormSchema = FormSchema,
    T extends ValidComponent = 'div',
  > = Omit<StandaloneFieldProps<T>, 'name'> & { name: FieldName<TSchema> }
}

export type FormProps<TSchema extends FormSchema = FormSchema> = FormT.Props<TSchema>
