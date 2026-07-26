import type { FieldStore, FormSchema, FormStore, RequiredPath } from '@formisch/solid'
import { useField } from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'
import { Show, createMemo, createSignal, mergeProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import type { InferInput } from 'valibot'

import type { ComponentOrElement } from '../../shared/render-prop'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { useFormContext } from '../form/form-context'

import type { FormFieldContextOptions } from './form-field-context'
import { FormFieldProvider } from './form-field-context'
import type { FormFieldVariantProps } from './form-field.class'
import {
  formFieldContainerVariants,
  formFieldLabelVariants,
  formFieldSizeVariants,
} from './form-field.class'

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
  export interface Base<TSchema extends FormSchema | undefined = undefined> {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: ValidComponent

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
  export interface Props<TSchema extends FormSchema | undefined = undefined> extends BaseProps<
    Base<TSchema>,
    Variant,
    Slot
  > {}
}

/**
 * Props for the FormField component.
 */
export interface FormFieldProps<
  TSchema extends FormSchema | undefined = undefined,
> extends FormFieldT.Props<TSchema> {}

type LooseUseField = (form: FormStore, config: () => { path: RequiredPath }) => FieldStore

/** Form field wrapper providing label, description, and validation message layout. */
export function FormField<TSchema extends FormSchema | undefined = undefined>(
  props: FormFieldProps<TSchema>,
): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      orientation: 'vertical' as const,
      size: 'md' as const,
      required: false,
    },
    props,
  )

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
    if (merged.error === false) {
      return false
    }

    if (merged.error !== undefined && merged.error !== null) {
      return merged.error
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
        component={merged.as}
        data-slot="root"
        style={{ ...merged.styles?.root, ...merged.style }}
        data-orientation={merged.orientation}
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
          <Show when={merged.label}>
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
                {merged.label}
              </label>

              <Show when={merged.hint}>
                <span
                  id={`${ariaId()}-hint`}
                  data-slot="hint"
                  style={merged.styles?.hint}
                  class={cn('text-muted-foreground ms-1', merged.classes?.hint)}
                >
                  {merged.hint}
                </span>
              </Show>
            </div>
          </Show>

          <Show when={merged.description}>
            <p
              id={`${ariaId()}-description`}
              data-slot="description"
              style={merged.styles?.description}
              class={cn('text-muted-foreground', merged.classes?.description)}
            >
              {merged.description}
            </p>
          </Show>
        </div>

        <div
          class={
            merged.label || merged.description
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
            when={merged.error !== false && shouldShowError()}
            fallback={
              <Show when={merged.help}>
                <div
                  id={`${ariaId()}-help`}
                  data-slot="help"
                  style={merged.styles?.help}
                  class={cn('text-muted-foreground mt-2', merged.classes?.help)}
                >
                  {merged.help}
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
