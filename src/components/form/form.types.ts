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

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldProps as StandaloneFieldProps } from '../field'

import type { defaultFormMessages } from './form.messages'
import type { FormStyleSlot, FormStyleVariants } from './form.style-types'

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
  export type Variants = FormStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultFormMessages>
  export type Translations = Partial<Messages>

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
    /** Localized message overrides for this form instance. `unknownError` is the form error recorded when a submit handler throws an error without a `message`. */
    translations?: Translations
    children?: JSX.Element
    /**
     * Called when the form is submitted and the schema validates. Receives the schema output
     * (after any `valibot` transforms, not the raw input) and the native `SubmitEvent`. The native
     * submit is always prevented, and invalid submits focus the first invalid field without calling
     * this handler. `form.isSubmitting` stays `true` until a returned promise settles; a thrown
     * or rejected error is stored in the form `errors` instead of propagating.
     * @example
     * ```tsx
     * import { createForm, Button, Field, Input } from 'moraine'
     * import * as v from 'valibot'
     *
     * const form = createForm({ schema: v.object({ email: v.pipe(v.string(), v.email()) }) })
     *
     * <form.Form onSubmit={async (output) => {
     *   await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(output) })
     * }}>
     *   <form.Field name="email" label="Email"><Input type="email" /></form.Field>
     *   <Button type="submit">Subscribe</Button>
     * </form.Form>
     * ```
     */
    onSubmit?: (output: InferOutput<TSchema>, event: SubmitEvent) => unknown
  }

  export type Props<TSchema extends Schema = FormSchema> = BaseProps<
    'form',
    Base<TSchema>,
    Variants,
    Classes,
    Styles
  >

  export type FieldProps<
    TSchema extends Schema = FormSchema,
    T extends ValidComponent = 'div',
  > = Omit<StandaloneFieldProps<T>, 'name'> & {
    /**
     * Schema field this `Field` binds to. A string is a top-level key of the schema, and an
     * array is a path to a nested object property or array item, such as `['profile', 'name']`
     * or `['tags', 0]`. A dotted string like `'profile.name'` is read as one top-level key.
     * @example
     * ```tsx
     * import { createForm, Field, Input } from 'moraine'
     * import * as v from 'valibot'
     *
     * const form = createForm({ schema: v.object({ profile: v.object({ name: v.string() }) }) })
     *
     * <form.Form>
     *   <form.Field name={['profile', 'name']} label="Name"><Input /></form.Field>
     * </form.Form>
     * ```
     */
    name: FieldName<TSchema>
  }
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
