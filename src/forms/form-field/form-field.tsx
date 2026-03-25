import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { resolveRenderProp } from '../../shared/render-prop'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn, useId } from '../../shared/utils'
import { useFormContext } from '../form/form-context'
import { pathStartsWith, pathToKey, toFieldPath } from '../form/form-path'

import type { FormFieldContextOptions } from './form-field-context'
import { FormFieldProvider } from './form-field-context'
import type { FormFieldVariantProps } from './form-field.class'
import {
  formFieldContainerVariants,
  formFieldLabelVariants,
  formFieldSizeVariants,
} from './form-field.class'

export namespace FormFieldT {
  /**
   * Props passed to the children of FormField when provided as a render function.
   */
  export interface RenderContext {
    /**
     * The current error for the field.
     */
    error?: boolean | string | JSX.Element
  }
  export type Slot =
    | 'root'
    | 'wrapper'
    | 'labelWrapper'
    | 'label'
    | 'container'
    | 'description'
    | 'error'
    | 'hint'
    | 'help'

  export type Variant = FormFieldVariantProps

  export interface Items {}

  export interface Extend {}
  export interface Classes extends SlotClasses<Slot> {}
  export interface Styles extends SlotStyles<Slot> {}

  /**
   * Base props for the FormField component.
   */
  export interface Base {
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
    name?: string | string[]

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
     * Whether to trigger validation eagerly on every input.
     * @default false
     */
    eagerValidation?: boolean

    /**
     * Delay in milliseconds for debounced input validation.
     */
    validateOnInputDelay?: number

    /**
     * Children of the field, can be a render function.
     */
    children?: JSX.Element | ((props: RenderContext) => JSX.Element)
  }

  /**
   * Props for the FormField component.
   */
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
}

/**
 * Props for the FormField component.
 */
export interface FormFieldProps extends FormFieldT.Props {}

/** Form field wrapper providing label, description, and validation message layout. */
export function FormField(props: FormFieldProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      orientation: 'vertical' as const,
      size: 'md' as const,
      required: false,
      eagerValidation: false,
    },
    props,
  )

  const [fieldProps, contentProps, styleProps, restProps] = splitProps(
    merged as FormFieldProps,
    ['as', 'id', 'name', 'error', 'required', 'eagerValidation', 'validateOnInputDelay'],
    ['label', 'description', 'hint', 'help', 'children'],
    ['orientation', 'size', 'classes'],
  )

  const formContext = useFormContext()

  const ariaId = useId(() => fieldProps.id, 'form-field')
  const [registeredControls, setRegisteredControls] = createSignal<
    { id: () => string; bind: () => boolean; key: symbol }[]
  >([])

  const fieldPath = createMemo(() => toFieldPath(fieldProps.name))

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
      return fieldProps.id ?? ariaId()
    }

    return selectedControlId()
  })

  const resolvedError = createMemo(() => {
    if (fieldProps.error === false) {
      return false
    }

    if (fieldProps.error !== undefined && fieldProps.error !== null) {
      return fieldProps.error
    }

    if (!formContext) {
      return undefined
    }

    const fp = fieldPath()
    if (!fp) {
      return undefined
    }

    const error = formContext.errors.find((fieldError) => {
      const errorPath = toFieldPath(fieldError.name)
      if (!errorPath) {
        return false
      }

      return pathStartsWith(errorPath, fp)
    })

    return error?.message
  })

  createEffect(() => {
    const fp = fieldPath()

    if (!formContext || !fp) {
      return
    }

    formContext.registerInput(fp, {
      id: resolvedLabelTargetId(),
    })

    onCleanup(() => {
      formContext.unregisterInput(fp)
    })
  })

  const nameKey = createMemo(() => {
    const fp = fieldPath()
    return fp ? pathToKey(fp) : undefined
  })

  const fieldContextValue: FormFieldContextOptions = {
    get error() {
      return resolvedError()
    },
    get name() {
      return nameKey()
    },
    get path() {
      return fieldPath()
    },
    get size() {
      return styleProps.size
    },
    get eagerValidation() {
      return fieldProps.eagerValidation
    },
    get validateOnInputDelay() {
      return fieldProps.validateOnInputDelay
    },
    get hint() {
      return contentProps.hint
    },
    get description() {
      return contentProps.description
    },
    get help() {
      return contentProps.help
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
        component={fieldProps.as}
        data-slot="root"
        style={merged.styles?.root}
        data-orientation={styleProps.orientation}
        class={formFieldSizeVariants(
          {
            size: styleProps.size,
          },
          styleProps.orientation === 'horizontal' && 'flex items-baseline justify-between gap-2',
          styleProps.classes?.root,
        )}
        {...restProps}
      >
        <div
          data-slot="wrapper"
          style={merged.styles?.wrapper}
          class={cn(
            styleProps.orientation === 'horizontal' && 'flex-1',
            styleProps.classes?.wrapper,
          )}
        >
          <Show when={contentProps.label}>
            <div
              data-slot="labelWrapper"
              style={merged.styles?.labelWrapper}
              class={cn(
                'flex gap-1 items-center justify-between',
                styleProps.classes?.labelWrapper,
              )}
            >
              <label
                for={resolvedLabelTargetId()}
                data-slot="label"
                style={merged.styles?.label}
                class={formFieldLabelVariants(
                  {
                    required: fieldProps.required,
                  },
                  styleProps.classes?.label,
                )}
              >
                {contentProps.label}
              </label>

              <Show when={contentProps.hint}>
                <span
                  id={`${ariaId()}-hint`}
                  data-slot="hint"
                  style={merged.styles?.hint}
                  class={cn('text-muted-foreground ms-1', styleProps.classes?.hint)}
                >
                  {contentProps.hint}
                </span>
              </Show>
            </div>
          </Show>

          <Show when={contentProps.description}>
            <p
              id={`${ariaId()}-description`}
              data-slot="description"
              style={merged.styles?.description}
              class={cn('text-muted-foreground', styleProps.classes?.description)}
            >
              {contentProps.description}
            </p>
          </Show>
        </div>

        <div
          class={
            contentProps.label || contentProps.description
              ? formFieldContainerVariants(
                  {
                    orientation: styleProps.orientation,
                  },
                  styleProps.classes?.container,
                )
              : cn(styleProps.classes?.container)
          }
        >
          {resolveRenderProp<FormFieldT.RenderContext>(contentProps.children, () => ({
            error: resolvedError(),
          }))}

          <Show
            when={fieldProps.error !== false && shouldShowError()}
            fallback={
              <Show when={contentProps.help}>
                <div
                  id={`${ariaId()}-help`}
                  data-slot="help"
                  style={merged.styles?.help}
                  class={cn('text-muted-foreground mt-2', styleProps.classes?.help)}
                >
                  {contentProps.help}
                </div>
              </Show>
            }
          >
            <div
              id={`${ariaId()}-error`}
              data-slot="error"
              style={merged.styles?.error}
              class={cn('text-destructive mt-2', styleProps.classes?.error)}
            >
              {resolvedError() as JSX.Element}
            </div>
          </Show>
        </div>
      </Dynamic>
    </FormFieldProvider>
  )
}
