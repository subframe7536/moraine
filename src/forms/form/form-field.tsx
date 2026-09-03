import type { FieldStore, FormSchema, FormStore, RequiredPath } from '@formisch/solid'
import { useField } from '@formisch/solid'
import type { JSX, ValidComponent } from 'solid-js'
import {
  children as resolveChildren,
  createMemo,
  createSignal,
  mergeProps,
  Show,
  splitProps,
  untrack,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'
import type { InferInput } from 'valibot'

import { hasNonEmptyJsxContent } from '../../shared/jsx-content.ts'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useId } from '../../shared/utils.ts'

import type { FormFieldContextOptions } from './form-context.ts'
import { FormFieldProvider } from './form-context.ts'
import type { FormFieldVariantProps } from './form-field.class.ts'
import { formFieldRecipe } from './form-field.class.ts'

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
    error?: JSX.Element
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
     * Form store to bind field state. Provided automatically by `<form.Field>`.
     */
    form?: FormStore<TSchema extends FormSchema ? TSchema : any>

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
    error?: JSX.Element

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
  const [local, rest] = splitProps(props as FormFieldProps<any, any>, [
    'as',
    'id',
    'form',
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

  const config = useMoraineConfig()
  const provider = () => config().formField

  const merged = mergeProps(
    {
      as: 'div' as T,
      orientation: 'vertical' as const,
      size: 'md' as const,
      required: false,
    },
    () => provider()?.defaultProps,
    local,
  ) as MergedProps

  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const hint = createMemo(() => merged.hint)
  const help = createMemo(() => merged.help)
  const error = createMemo(() => merged.error)

  // oxlint-disable-next-line subf/solid-reactivity -- Initial form store reference is captured at setup.
  const activeForm = local.form

  const ariaId = useId(() => local.id, 'form-field')
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
    activeForm && initialPath
      ? // oxlint-disable-next-line subf/solid-reactivity -- Formisch tracks its getter config.
        (useField as unknown as LooseUseField)(activeForm, () => ({
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

  function selectedControlId(): string | undefined {
    const controls = registeredControls()

    for (let index = controls.length - 1; index >= 0; index -= 1) {
      const control = controls[index]

      if (control && control.bind()) {
        return control.id()
      }
    }

    return undefined
  }

  const resolvedLabelTargetId = selectedControlId

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

  const showLabel = createMemo(() => hasNonEmptyJsxContent(label()))
  const showHint = createMemo(() => showLabel() && hasNonEmptyJsxContent(hint()))
  const showDescription = createMemo(() => hasNonEmptyJsxContent(description()))

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
  const showError = createMemo(() => error() !== false && shouldShowError())
  const showHelp = createMemo(() => !showError() && hasNonEmptyJsxContent(help()))
  const fieldAriaAttrs = createMemo<Record<string, string | boolean | undefined>>(() => {
    const describedBy = [
      ...new Set(
        [
          showHint() ? `${ariaId()}-hint` : undefined,
          showDescription() ? `${ariaId()}-description` : undefined,
          showError() ? `${ariaId()}-error` : undefined,
          showHelp() ? `${ariaId()}-help` : undefined,
        ].filter((id): id is string => Boolean(id)),
      ),
    ]

    const attrs: Record<string, string | boolean | undefined> = {}

    if (hasNonEmptyJsxContent(resolvedError())) {
      attrs['aria-invalid'] = 'true'
    }
    if (showLabel()) {
      attrs['aria-labelledby'] = `${ariaId()}-label`
    }
    if (describedBy.length > 0) {
      attrs['aria-describedby'] = describedBy.join(' ')
    }

    return attrs
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
      return hint()
    },
    get description() {
      return description()
    },
    get help() {
      return help()
    },
    get required() {
      return merged.required
    },
    get ariaId() {
      return ariaId()
    },
    get labelId() {
      return showLabel() ? `${ariaId()}-label` : undefined
    },
    get controlId() {
      return selectedControlId()
    },
    ariaAttrs: fieldAriaAttrs,
    registerControl,
  }

  const slots = createMemo(() =>
    formFieldRecipe({
      size: merged.size,
      orientation: merged.orientation,
      required: Boolean(merged.required),
      hasText: showLabel() || showDescription(),
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  function renderFieldRoot(): JSX.Element {
    const body = resolveChildren(() => merged.children as JSX.Element)
    const fieldChildren = renderComponentOrElement<FormFieldT.RenderContext>(body(), {
      get error() {
        return resolvedError()
      },
    })

    return (
      <Dynamic
        data-slot="root"
        data-orientation={merged.orientation}
        {...rest}
        component={merged.as as any}
        style={resolved.rootStyle()}
        class={resolved.rootClass()}
      >
        <div
          data-slot="wrapper"
          style={resolved.slotStyle('wrapper')}
          class={resolved.slotClass('wrapper')}
        >
          <Show when={showLabel()}>
            <div
              data-slot="labelWrapper"
              style={resolved.slotStyle('labelWrapper')}
              class={resolved.slotClass('labelWrapper')}
            >
              <label
                id={`${ariaId()}-label`}
                for={resolvedLabelTargetId()}
                data-slot="label"
                style={resolved.slotStyle('label')}
                class={resolved.slotClass('label')}
              >
                {label()}
              </label>

              <Show when={showHint()}>
                <span
                  id={`${ariaId()}-hint`}
                  data-slot="hint"
                  style={resolved.slotStyle('hint')}
                  class={resolved.slotClass('hint')}
                >
                  {hint()}
                </span>
              </Show>
            </div>
          </Show>

          <Show when={showDescription()}>
            <p
              id={`${ariaId()}-description`}
              data-slot="description"
              style={resolved.slotStyle('description')}
              class={resolved.slotClass('description')}
            >
              {description()}
            </p>
          </Show>
        </div>

        <div
          data-slot="container"
          style={resolved.slotStyle('container')}
          class={resolved.slotClass('container')}
        >
          {fieldChildren}

          <Show
            when={showError()}
            fallback={
              <Show when={showHelp()}>
                <div
                  id={`${ariaId()}-help`}
                  data-slot="help"
                  style={resolved.slotStyle('help')}
                  class={resolved.slotClass('help')}
                >
                  {help()}
                </div>
              </Show>
            }
          >
            <div
              id={`${ariaId()}-error`}
              data-slot="error"
              style={resolved.slotStyle('error')}
              class={resolved.slotClass('error')}
            >
              {resolvedError()}
            </div>
          </Show>
        </div>
      </Dynamic>
    )
  }

  return <FormFieldProvider value={fieldContextValue}>{renderFieldRoot()}</FormFieldProvider>
}
