import type { FieldStore, FormSchema, FormStore, RequiredPath } from '@formisch/solid'
import { useField } from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, createSignal, mergeProps, splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import type { InferInput } from 'valibot'

import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { cn, useId } from '../../shared/utils.ts'
import { useFormContext } from '../form/form-context.ts'

import type { FormFieldContextOptions } from './form-field-context.ts'
import { FormFieldProvider } from './form-field-context.ts'
import type { FormFieldVariantProps } from './form-field.class.ts'
import {
  formFieldContainerVariants,
  formFieldLabelVariants,
  formFieldSizeVariants,
} from './form-field.class.ts'

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
    /**
     * The current error for the field.
     */
    error?: boolean | string | JSX.Element
  }

  export interface Slot<T = unknown> {
    /**
     * Field wrapper that links label, control, description, and messages.
     */
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

  export type Variant = FormFieldVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /**
   * Base props for the FormField component.
   */
  export interface Base<
    TSchema extends FormSchema | undefined = undefined,
    T extends ValidComponent = 'div',
  > {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: T

    /**
     * Unique identifier for the form field.
     */
    id?: string

    /**
     * The name of the field (key in form state).
     */
    name?: Name<TSchema>

    /**
     * Label for the field.
     */
    label?: JSX.Element

    /**
     * Description text shown below the label.
     */
    description?: JSX.Element

    /**
     * Help text shown below the control when no error is present.
     */
    help?: JSX.Element

    /**
     * Custom error message or force error state.
     */
    error?: boolean | string | JSX.Element

    /**
     * Hint text shown near the label.
     */
    hint?: JSX.Element

    /**
     * Whether the field is required.
     * @default false
     */
    required?: boolean

    /**
     * Children of the field, can be a render function.
     */
    children?: ComponentOrElement<RenderContext>
  }

  /**
   * Props for the FormField component.
   */
  export type Props<
    TSchema extends FormSchema | undefined = undefined,
    T extends ValidComponent = 'div',
  > = BaseProps<T, Base<TSchema, T>, Variant, Classes, Styles>
}

/**
 * Props for the FormField component.
 */
export type FormFieldProps<
  TSchema extends FormSchema | undefined = undefined,
  T extends ValidComponent = 'div',
> = FormFieldT.Props<TSchema, T>

type LooseUseField = (form: FormStore, config: () => { path: RequiredPath }) => FieldStore

/** Form field wrapper providing label, description, and validation message layout. */
export function FormField<
  TSchema extends FormSchema | undefined = undefined,
  T extends ValidComponent = 'div',
>(props: FormFieldProps<TSchema, T>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'id',
    'name',
    'label',
    'description',
    'help',
    'error',
    'hint',
    'required',
    'children',
    'orientation',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  type MergedProps = FormFieldT.Base<TSchema, T> &
    FormFieldT.Variant & {
      classes?: FormFieldT.Classes
      styles?: FormFieldT.Styles
      class?: string
      style?: JSX.CSSProperties
    }
  const merged = mergeProps(
    {
      as: 'div' as T,
      orientation: 'vertical' as const,
      size: 'md' as const,
      required: false,
    },
    local,
  ) as MergedProps
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const hint = createMemo(() => merged.hint)
  const help = createMemo(() => merged.help)
  const error = createMemo(() => merged.error)

  const formContext = useFormContext()

  const ariaId = useId(() => merged.id, 'form-field')
  const [registeredControls, setRegisteredControls] = createSignal<
    { id: () => string; bind: () => boolean; key: symbol }[]
  >([])

  const fieldPath = createMemo<RequiredPath | undefined>(() => {
    if (typeof merged.name === 'string') {
      return merged.name ? [merged.name] : undefined
    }
    return merged.name?.length ? merged.name : undefined
  })
  const initialPath = untrack(fieldPath)
  const field =
    formContext && initialPath
      ? // oxlint-disable-next-line subf/solid-reactivity -- Formisch tracks its getter config.
        (useField as unknown as LooseUseField)(formContext, () => ({
          path: fieldPath() as RequiredPath,
        }))
      : undefined

  const registerControl: NonNullable<FormFieldContextOptions['registerControl']> = (entry) => {
    const key = Symbol('form-field-control')

    setRegisteredControls((previous) => [...previous, { ...entry, key }])

    return () => {
      setRegisteredControls((previous) => previous.filter((control) => control.key !== key))
    }
  }

  const selectedControlId = createMemo(() => {
    const controls = registeredControls()

    for (let index = controls.length - 1; index >= 0; index -= 1) {
      const control = controls[index]

      if (control && control.bind()) {
        return control.id()
      }
    }

    return undefined
  })

  const resolvedLabelTargetId = createMemo(() => {
    const controls = registeredControls()

    if (controls.length === 0) {
      return merged.id ?? ariaId()
    }

    return selectedControlId()
  })

  const resolvedError = createMemo(() => {
    const value = error()

    if (value === false) {
      return false
    }

    if (value !== undefined && value !== null) {
      return value
    }

    return field?.errors?.[0]
  })

  const fieldContextValue: FormFieldContextOptions = {
    get error() {
      return resolvedError()
    },
    get name() {
      return field?.props.name ?? (typeof merged.name === 'string' ? merged.name : undefined)
    },
    get path() {
      return fieldPath()
    },
    get size() {
      return merged.size
    },
    get field() {
      return field
    },
    get hint() {
      return merged.hint
    },
    get description() {
      return merged.description
    },
    get help() {
      return merged.help
    },
    get ariaId() {
      return ariaId()
    },
    get controlId() {
      return selectedControlId()
    },
    registerControl,
  }

  const shouldShowError = createMemo(() => {
    const value = resolvedError()

    if (value === undefined || value === null || value === false || value === true) {
      return false
    }

    if (typeof value === 'string') {
      return value.length > 0
    }

    return true
  })

  return (
    <FormFieldProvider value={fieldContextValue}>
      <Dynamic
        data-slot="root"
        data-orientation={merged.orientation}
        {...rest}
        component={merged.as as any}
        style={{ ...merged.styles?.root, ...merged.style }}
        class={formFieldSizeVariants(
          {
            size: merged.size,
          },
          merged.orientation === 'horizontal' && 'flex items-baseline justify-between gap-2',
          merged.classes?.root,
          merged.class,
        )}
      >
        <div
          data-slot="wrapper"
          style={merged.styles?.wrapper}
          class={cn(merged.orientation === 'horizontal' && 'flex-1', merged.classes?.wrapper)}
        >
          <Show when={label()}>
            <div
              data-slot="labelWrapper"
              style={merged.styles?.labelWrapper}
              class={cn('flex gap-1 items-center justify-between', merged.classes?.labelWrapper)}
            >
              <label
                for={resolvedLabelTargetId()}
                data-slot="label"
                style={merged.styles?.label}
                class={formFieldLabelVariants(
                  {
                    required: merged.required,
                  },
                  merged.classes?.label,
                )}
              >
                {label()}
              </label>

              <Show when={hint()}>
                <span
                  id={`${ariaId()}-hint`}
                  data-slot="hint"
                  style={merged.styles?.hint}
                  class={cn('text-muted-foreground ms-1', merged.classes?.hint)}
                >
                  {hint()}
                </span>
              </Show>
            </div>
          </Show>

          <Show when={description()}>
            <p
              id={`${ariaId()}-description`}
              data-slot="description"
              style={merged.styles?.description}
              class={cn('text-muted-foreground', merged.classes?.description)}
            >
              {description()}
            </p>
          </Show>
        </div>

        <div
          class={
            label() || description()
              ? formFieldContainerVariants(
                  {
                    orientation: merged.orientation,
                  },
                  merged.classes?.container,
                )
              : cn(merged.classes?.container)
          }
        >
          {renderComponentOrElement<FormFieldT.RenderContext>(merged.children, {
            get error() {
              return resolvedError()
            },
          })}

          <Show
            when={error() !== false && shouldShowError()}
            fallback={
              <Show when={help()}>
                <div
                  id={`${ariaId()}-help`}
                  data-slot="help"
                  style={merged.styles?.help}
                  class={cn('text-muted-foreground mt-2', merged.classes?.help)}
                >
                  {help()}
                </div>
              </Show>
            }
          >
            <div
              id={`${ariaId()}-error`}
              data-slot="error"
              style={merged.styles?.error}
              class={cn('text-destructive mt-2', merged.classes?.error)}
            >
              {resolvedError() as JSX.Element}
            </div>
          </Show>
        </div>
      </Dynamic>
    </FormFieldProvider>
  )
}
