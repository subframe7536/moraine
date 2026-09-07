import type {
  FormProps as FormischFormProps,
  FormSchema,
  FormStore,
  SubmitEventHandler,
  ValidationMode as FormischValidationMode,
} from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { FormFieldProps } from './form-field.types.ts'

export namespace FormT {
  export interface Instance<TSchema extends FormSchema = FormSchema> extends FormStore<TSchema> {
    Form: (props: Props<TSchema>) => JSX.Element
    Field: <T extends ValidComponent = 'div'>(props: FieldProps<TSchema, T>) => JSX.Element
  }

  export type ValidationMode = FormischValidationMode

  export interface Slot<T = unknown> {
    /** Form root container. */
    root?: T
  }

  export interface Variant {}

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
  > = FormFieldProps<TSchema, T>
}

export type FormProps<TSchema extends FormSchema = FormSchema> = FormT.Props<TSchema>
