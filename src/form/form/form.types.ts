import type {
  DeepPartial,
  FormConfig,
  FormProps as FormischFormProps,
  FormSchema,
  FormStore,
  PartialValues,
  RequiredPath,
  Schema,
  ValidPath,
} from '@formisch/solid'
import type { JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldProps as StandaloneFieldProps } from '../field'

import type { FormStyleSlot, FormStyleVariant } from './form.style-types'

type PathKey = string | number
// Formisch constrains its helpers to object schemas; preserve root collection types for Moraine forms.
declare const rootFormSchema: unique symbol
type RootStore<TSchema extends Schema> = FormStore<never> & {
  readonly [rootFormSchema]: TSchema
}
type ExactKeysOf<TValue> = 0 extends 1 & TValue
  ? never
  : TValue extends readonly unknown[]
    ? number extends TValue['length']
      ? number
      : {
          [TKey in keyof TValue]: TKey extends `${infer TIndex extends number}` ? TIndex : never
        }[number]
    : TValue extends Record<PropertyKey, unknown>
      ? keyof TValue & PathKey
      : never
type PropertiesOf<TValue> = {
  [TKey in ExactKeysOf<TValue>]: TValue extends Partial<Record<TKey, infer TItem>> ? TItem : never
}
type DeepFieldPath<TChild, TKey extends PathKey, TDepth extends 0[]> = TChild extends
  | readonly unknown[]
  | Record<PropertyKey, unknown>
  ? readonly [TKey, ...SchemaPath<TChild, [...TDepth, 0]>]
  : never
type SchemaPath<TValue, TDepth extends 0[] = []> = TDepth['length'] extends 5
  ? readonly [PathKey, ...PathKey[]]
  : TValue extends readonly unknown[] | Record<PropertyKey, unknown>
    ? {
        [TKey in ExactKeysOf<TValue>]:
          | readonly [TKey]
          | DeepFieldPath<NonNullable<PropertiesOf<TValue>[TKey]>, TKey, TDepth>
      }[ExactKeysOf<TValue>]
    : never

type InferInput<T extends Schema> = NonNullable<T['~types']>['input']
type InferOutput<T extends Schema> = NonNullable<T['~types']>['output']

export namespace FormT {
  export type Kind = 'single'
  export type Slot<T = unknown> = FormStyleSlot<T>
  export type Variant = FormStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type FieldName<TSchema extends Schema> =
    InferInput<TSchema> extends infer Input
      ?
          | (Input extends Record<PropertyKey, unknown> ? Extract<keyof Input, string> : never)
          | SchemaPath<Input>
      : never

  export type Store<TSchema extends Schema> = TSchema extends FormSchema
    ? FormStore<TSchema>
    : RootStore<TSchema>

  export type Config<TSchema extends Schema> = TSchema extends FormSchema
    ? FormConfig<TSchema>
    : Omit<FormConfig, 'schema' | 'initialInput'> & {
        schema: TSchema
        initialInput?: DeepPartial<InferInput<TSchema>>
      }

  export type Instance<TSchema extends Schema = FormSchema> = Store<TSchema> & {
    Form: (props: Props<TSchema>) => JSX.Element
    Field: <T extends ValidComponent = 'div'>(props: FieldProps<TSchema, T>) => JSX.Element
  }

  export interface Base<TSchema extends Schema = FormSchema> extends Omit<
    FormischFormProps,
    'children' | 'class' | 'onSubmit' | 'style' | 'of'
  > {
    children?: JSX.Element
    /** Called with validated schema output and the native submit event. */
    onSubmit?: (output: InferOutput<TSchema>, event: SubmitEvent) => unknown
  }

  export type Props<TSchema extends Schema = FormSchema> = BaseProps<
    'form',
    Base<TSchema>,
    Variant,
    Classes,
    Styles
  >

  export type FieldProps<
    TSchema extends Schema = FormSchema,
    T extends ValidComponent = 'div',
  > = Omit<StandaloneFieldProps<T>, 'name'> & { name: FieldName<TSchema> }
}

export type FormProps<TSchema extends Schema = FormSchema> = FormT.Props<TSchema>

declare module '@formisch/solid' {
  function focus<TSchema extends Schema, TPath extends RequiredPath>(
    form: RootStore<TSchema>,
    config: { readonly path: ValidPath<InferInput<TSchema>, TPath> },
  ): void

  function getInput<TSchema extends Schema>(
    form: RootStore<TSchema>,
  ): PartialValues<InferInput<TSchema>>

  function setInput<TSchema extends Schema>(
    form: RootStore<TSchema>,
    config: { readonly path?: undefined; readonly input: InferInput<TSchema> },
  ): void
}
