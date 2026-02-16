import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  children,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useFormContext } from '../form/form-context'
import { cn, useId } from '../shared/utils'

import type { FormFieldInjectedOptions, InputIdContextValue } from './form-field-context'
import { FormFieldProvider, InputIdProvider } from './form-field-context'
import type { FormFieldVariantProps } from './form-field.class'
import {
  formFieldContainerVariants,
  formFieldDescriptionVariants,
  formFieldErrorVariants,
  formFieldHelpVariants,
  formFieldHintVariants,
  formFieldLabelVariants,
  formFieldLabelWrapperVariants,
  formFieldRootVariants,
  formFieldWrapperVariants,
} from './form-field.class'

export interface FormFieldClasses {
  root?: string
  wrapper?: string
  labelWrapper?: string
  label?: string
  container?: string
  description?: string
  error?: string
  hint?: string
  help?: string
}

export interface FormFieldRenderProps {
  error?: boolean | string | JSX.Element
}

export interface FormFieldBaseProps extends FormFieldVariantProps {
  as?: ValidComponent
  id?: string
  name?: string
  errorPattern?: RegExp
  label?: JSX.Element
  description?: JSX.Element
  help?: JSX.Element
  error?: boolean | string | JSX.Element
  hint?: JSX.Element
  required?: boolean
  eagerValidation?: boolean
  validateOnInputDelay?: number
  classes?: FormFieldClasses
  children?: JSX.Element | ((props: FormFieldRenderProps) => JSX.Element)
}

export type FormFieldProps = FormFieldBaseProps &
  Omit<JSX.HTMLAttributes<HTMLElement>, keyof FormFieldBaseProps | 'id' | 'children' | 'class'>

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

  const [local, rest] = splitProps(merged as FormFieldProps, [
    'as',
    'id',
    'name',
    'errorPattern',
    'label',
    'description',
    'help',
    'error',
    'hint',
    'size',
    'required',
    'eagerValidation',
    'validateOnInputDelay',
    'classes',
    'orientation',
    'children',
  ])

  const formContext = useFormContext()

  const ariaId = useId(() => local.id, 'form-field')
  const [manualInputId, setManualInputId] = createSignal<string | null | undefined>(undefined)
  const inputId = createMemo(() => {
    const manualId = manualInputId()

    if (manualId === null) {
      return undefined
    }

    return manualId ?? local.id ?? ariaId()
  })

  const resolvedError = createMemo(() => {
    if (local.error === false) {
      return false
    }

    if (local.error !== undefined && local.error !== null) {
      return local.error
    }

    if (!local.name || !formContext) {
      return undefined
    }

    const error = formContext.errors.find((fieldError) => {
      if (fieldError.name === local.name) {
        return true
      }

      return Boolean(local.errorPattern?.test(fieldError.name ?? ''))
    })

    return error?.message
  })

  createEffect(() => {
    const name = local.name

    if (!formContext || !name) {
      return
    }

    formContext.registerInput(name, {
      id: inputId(),
      pattern: local.errorPattern,
    })

    onCleanup(() => {
      formContext.unregisterInput(name)
    })
  })

  const fieldContextValue: FormFieldInjectedOptions = {
    get error() {
      return resolvedError()
    },
    get name() {
      return local.name
    },
    get size() {
      return local.size
    },
    get eagerValidation() {
      return local.eagerValidation
    },
    get validateOnInputDelay() {
      return local.validateOnInputDelay
    },
    get errorPattern() {
      return local.errorPattern
    },
    get hint() {
      return local.hint
    },
    get description() {
      return local.description
    },
    get help() {
      return local.help
    },
    get ariaId() {
      return ariaId()
    },
  }
  const inputIdContextValue: InputIdContextValue = {
    get id() {
      return inputId()
    },
    setId: setManualInputId,
  }

  function NormalizedChildren(): JSX.Element {
    const resolvedChildren = children(() => {
      const value = local.children

      if (typeof value !== 'function') {
        return value
      }

      if (value.length > 0) {
        return (value as (props: FormFieldRenderProps) => JSX.Element)({
          error: resolvedError(),
        })
      }

      return (value as () => JSX.Element)()
    })

    return <>{resolvedChildren()}</>
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
    <InputIdProvider value={inputIdContextValue}>
      <FormFieldProvider value={fieldContextValue}>
        <Dynamic
          component={local.as}
          data-slot="root"
          data-orientation={local.orientation}
          class={cn(
            formFieldRootVariants({
              size: local.size,
              orientation: local.orientation,
            }),
            local.classes?.root,
          )}
          {...rest}
        >
          <div
            data-slot="wrapper"
            class={cn(
              formFieldWrapperVariants({
                orientation: local.orientation,
              }),
              local.classes?.wrapper,
            )}
          >
            <Show when={local.label}>
              <div
                data-slot="labelWrapper"
                class={cn(formFieldLabelWrapperVariants(), local.classes?.labelWrapper)}
              >
                <label
                  for={inputId()}
                  data-slot="label"
                  class={cn(
                    formFieldLabelVariants({
                      required: local.required,
                    }),
                    local.classes?.label,
                  )}
                >
                  {local.label}
                </label>

                <Show when={local.hint}>
                  <span
                    id={`${ariaId()}-hint`}
                    data-slot="hint"
                    class={cn(formFieldHintVariants(), local.classes?.hint)}
                  >
                    {local.hint}
                  </span>
                </Show>
              </div>
            </Show>

            <Show when={local.description}>
              <p
                id={`${ariaId()}-description`}
                data-slot="description"
                class={cn(formFieldDescriptionVariants(), local.classes?.description)}
              >
                {local.description}
              </p>
            </Show>
          </div>

          <div
            class={cn(
              (local.label || local.description) &&
                formFieldContainerVariants({
                  orientation: local.orientation,
                }),
              local.classes?.container,
            )}
          >
            <NormalizedChildren />

            <Show
              when={local.error !== false && shouldShowError()}
              fallback={
                <Show when={local.help}>
                  <div
                    id={`${ariaId()}-help`}
                    data-slot="help"
                    class={cn(formFieldHelpVariants(), local.classes?.help)}
                  >
                    {local.help}
                  </div>
                </Show>
              }
            >
              <div
                id={`${ariaId()}-error`}
                data-slot="error"
                class={cn(formFieldErrorVariants(), local.classes?.error)}
              >
                {resolvedError() as JSX.Element}
              </div>
            </Show>
          </div>
        </Dynamic>
      </FormFieldProvider>
    </InputIdProvider>
  )
}
