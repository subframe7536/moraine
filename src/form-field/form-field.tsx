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
import type { SlotClasses } from '../shared/slot-class'
import { cn, useId } from '../shared/utils'

import type { FormFieldInjectedOptions } from './form-field-context'
import { FormFieldProvider } from './form-field-context'
import type { FormFieldVariantProps } from './form-field.class'
import {
  formFieldContainerVariants,
  formFieldLabelVariants,
  formFieldSizeVariants,
} from './form-field.class'

type FormFieldSlots =
  | 'root'
  | 'wrapper'
  | 'labelWrapper'
  | 'label'
  | 'container'
  | 'description'
  | 'error'
  | 'hint'
  | 'help'

export type FormFieldClasses = SlotClasses<FormFieldSlots>

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

export type FormFieldProps = FormFieldBaseProps

interface RegisteredControl {
  id: () => string
  bind: () => boolean
  key: symbol
}

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
    [
      'as',
      'id',
      'name',
      'errorPattern',
      'error',
      'required',
      'eagerValidation',
      'validateOnInputDelay',
    ],
    ['label', 'description', 'hint', 'help', 'children'],
    ['orientation', 'size', 'classes'],
  )

  const formContext = useFormContext()

  const ariaId = useId(() => fieldProps.id, 'form-field')
  const [registeredControls, setRegisteredControls] = createSignal<RegisteredControl[]>([])

  const registerControl: NonNullable<FormFieldInjectedOptions['registerControl']> = (entry) => {
    const key = Symbol('form-field-control')

    setRegisteredControls((previous) => [
      ...previous,
      {
        ...entry,
        key,
      },
    ])

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

    if (!fieldProps.name || !formContext) {
      return undefined
    }

    const error = formContext.errors.find((fieldError) => {
      if (fieldError.name === fieldProps.name) {
        return true
      }

      return Boolean(fieldProps.errorPattern?.test(fieldError.name ?? ''))
    })

    return error?.message
  })

  createEffect(() => {
    const name = fieldProps.name

    if (!formContext || !name) {
      return
    }

    formContext.registerInput(name, {
      id: resolvedLabelTargetId(),
      pattern: fieldProps.errorPattern,
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
      return fieldProps.name
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
    get errorPattern() {
      return fieldProps.errorPattern
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

  function NormalizedChildren(): JSX.Element {
    const resolvedChildren = children(() => {
      const value = contentProps.children

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
    <FormFieldProvider value={fieldContextValue}>
      <Dynamic
        component={fieldProps.as}
        data-slot="root"
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
          class={cn(
            styleProps.orientation === 'horizontal' && 'flex-1',
            styleProps.classes?.wrapper,
          )}
        >
          <Show when={contentProps.label}>
            <div
              data-slot="labelWrapper"
              class={cn(
                'flex items-center justify-between gap-1',
                styleProps.classes?.labelWrapper,
              )}
            >
              <label
                for={resolvedLabelTargetId()}
                data-slot="label"
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
                  class={cn('text-muted-foreground', styleProps.classes?.hint)}
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
          <NormalizedChildren />

          <Show
            when={fieldProps.error !== false && shouldShowError()}
            fallback={
              <Show when={contentProps.help}>
                <div
                  id={`${ariaId()}-help`}
                  data-slot="help"
                  class={cn('mt-2 text-muted-foreground', styleProps.classes?.help)}
                >
                  {contentProps.help}
                </div>
              </Show>
            }
          >
            <div
              id={`${ariaId()}-error`}
              data-slot="error"
              class={cn('mt-2 text-destructive', styleProps.classes?.error)}
            >
              {resolvedError() as JSX.Element}
            </div>
          </Show>
        </div>
      </Dynamic>
    </FormFieldProvider>
  )
}
