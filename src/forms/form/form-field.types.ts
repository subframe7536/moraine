import type { FormSchema, FormStore, RequiredPath } from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'
import type { InferInput } from 'valibot'

import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export namespace FormFieldT {
  type SchemaPath<TValue> = TValue extends readonly (infer TItem)[]
    ? readonly [number] | readonly [number, ...SchemaPath<NonNullable<TItem>>]
    : TValue extends Record<PropertyKey, unknown>
      ? {
          [TKey in Extract<keyof TValue, string | number>]:
            | readonly [TKey]
            | readonly [TKey, ...SchemaPath<NonNullable<TValue[TKey]>>]
        }[Extract<keyof TValue, string | number>]
      : never

  export type Name<TSchema extends FormSchema | undefined = undefined> = TSchema extends FormSchema
    ? Extract<keyof InferInput<TSchema>, string> | SchemaPath<InferInput<TSchema>>
    : string | RequiredPath

  /**
   * Props passed to the children of FormField when provided as a render function.
   */
  export interface RenderContext {
    /** The current error for the field. */
    error?: JSX.Element
  }

  export interface Slot<T = unknown> {
    /** Field wrapper that links label, control, description, and messages. */
    root?: T
    /** Inner wrapper that arranges label, control, helper text, and messages. */
    wrapper?: T
    /** Row that groups the field label and optional hint. */
    labelWrapper?: T
    /** Accessible field label associated with the control. */
    label?: T
    /** Region that contains the wrapped form control. */
    container?: T
    /** Helper text associated with the control. */
    description?: T
    /** Validation error message region for the field. */
    error?: T
    /** Short hint rendered beside the field label. */
    hint?: T
    /** Additional guidance rendered below the control. */
    help?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg'
    orientation?: 'vertical' | 'horizontal'
    required?: boolean
    hasText?: boolean
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /** Base props for the FormField component. */
  export interface Base<
    TSchema extends FormSchema | undefined = undefined,
    T extends ValidComponent = 'div',
  > {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: T

    /** Unique identifier for the form field. */
    id?: string

    /** Form store to bind field state. Provided automatically by `<form.Field>`. */
    form?: FormStore<TSchema extends FormSchema ? TSchema : any>

    /** The name of the field (key in form state). */
    name?: Name<TSchema>

    /** Label for the field. */
    label?: JSX.Element

    /** Description text shown below the label. */
    description?: JSX.Element

    /** Help text shown below the control when no error is present. */
    help?: JSX.Element

    /** Custom error message or force error state. */
    error?: JSX.Element

    /** Hint text shown near the label. */
    hint?: JSX.Element

    /**
     * Whether the field is required.
     * @default false
     */
    required?: boolean

    /** Children of the field, can be a render function. */
    children?: ComponentOrElement<RenderContext>
  }

  /** Props for the FormField component. */
  export type Props<
    TSchema extends FormSchema | undefined = undefined,
    T extends ValidComponent = 'div',
  > = BaseProps<T, Base<TSchema, T>, Variant, Classes, Styles>
}

/** Props for the FormField component. */
export type FormFieldProps<
  TSchema extends FormSchema | undefined = undefined,
  T extends ValidComponent = 'div',
> = FormFieldT.Props<TSchema, T>
