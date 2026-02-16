import type { JSX } from 'solid-js'
import { createMemo, createSignal, splitProps } from 'solid-js'

import { useId } from '../shared/utils'

import type {
  FormContextValue,
  FormInputEvent,
  FormInputEventType,
  FormInputMeta,
  FormValidationError,
} from './form-context'
import { FormProvider } from './form-context'
import type { FormVariantProps } from './form.class'
import { formVariants } from './form.class'

type FormState = object

export interface FormSubmitEvent<TState extends FormState = FormState> extends SubmitEvent {
  data?: TState
}

export interface FormErrorEvent extends SubmitEvent {
  errors: FormValidationError[]
}

export interface FormRenderProps {
  errors: FormValidationError[]
  loading: boolean
}

export interface FormClasses {
  root?: string
}

export interface FormBaseProps<TState extends FormState = FormState> extends FormVariantProps {
  id?: string
  state?: TState
  validate?: (state: TState | undefined) => FormValidationError[] | Promise<FormValidationError[]>
  validateOn?: FormInputEventType[]
  validateOnInputDelay?: number
  disabled?: boolean
  loadingAuto?: boolean
  onSubmit?: (event: FormSubmitEvent<TState>) => void | Promise<void>
  onError?: (event: FormErrorEvent) => void
  classes?: FormClasses
  children?: JSX.Element | ((props: FormRenderProps) => JSX.Element)
}

export type FormProps<TState extends FormState = FormState> = FormBaseProps<TState> &
  Omit<
    JSX.FormHTMLAttributes<HTMLFormElement>,
    keyof FormBaseProps<TState> | 'id' | 'children' | 'class'
  >

function matchesValidationTarget(
  error: FormValidationError,
  names: string[],
  inputs: Record<string, FormInputMeta>,
): boolean {
  if (!error.name) {
    return false
  }

  if (names.includes(error.name)) {
    return true
  }

  return names.some((name) => {
    const pattern = inputs[name]?.pattern
    return pattern ? pattern.test(error.name!) : false
  })
}

const DEFAULT_VALUDATE_ON: FormInputEventType[] = ['input', 'blur', 'change']
export function Form<TState extends FormState = FormState>(props: FormProps<TState>): JSX.Element {
  const [local, rest] = splitProps(props as FormProps<TState>, [
    'id',
    'state',
    'validate',
    'validateOn',
    'validateOnInputDelay',
    'disabled',
    'loadingAuto',
    'onSubmit',
    'onError',
    'classes',
    'children',
  ])

  const formId = useId(() => local.id, 'form')
  const [loading, setLoading] = createSignal(false)
  const [errors, setErrors] = createSignal<FormValidationError[]>([])
  const [inputs, setInputs] = createSignal<Record<string, FormInputMeta>>({})

  const touchedFields = new Set<string>()
  const dirtyFields = new Set<string>()
  const blurredFields = new Set<string>()

  const listeners = new Set<(event: FormInputEvent) => void>()

  async function handleInputEvent(event: FormInputEvent): Promise<void> {
    if ((local.validateOn ?? DEFAULT_VALUDATE_ON).includes(event.type) && !loading()) {
      if (event.type !== 'input') {
        if (event.name) {
          await runValidation(event.name)
        }
      } else if (event.eager || (event.name && blurredFields.has(event.name))) {
        if (event.name) {
          await runValidation(event.name)
        }
      }
    }

    if (!event.name) {
      return
    }

    if (event.type === 'blur') {
      blurredFields.add(event.name)
      touchedFields.add(event.name)
    }

    if (event.type === 'focus' || event.type === 'change' || event.type === 'input') {
      touchedFields.add(event.name)
    }

    if (event.type === 'change' || event.type === 'input') {
      dirtyFields.add(event.name)
    }
  }

  function emitInputEvent(event: FormInputEvent): void {
    void handleInputEvent(event)

    for (const listener of listeners) {
      listener(event)
    }
  }

  function subscribeInputEvents(listener: (event: FormInputEvent) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function registerInput(name: string, meta: FormInputMeta): void {
    setInputs((previous) => ({
      ...previous,
      [name]: meta,
    }))
  }

  function unregisterInput(name: string): void {
    setInputs((previous) => {
      const next = { ...previous }
      delete next[name]
      return next
    })
  }

  function getInputMeta(name: string): FormInputMeta | undefined {
    return inputs()[name]
  }

  function resolveErrorIds(nextErrors: FormValidationError[]): FormValidationError[] {
    const inputMap = inputs()

    return nextErrors.map((error) => {
      if (!error.name) {
        return error
      }

      return {
        ...error,
        id: inputMap[error.name]?.id,
      }
    })
  }

  async function getErrors(): Promise<FormValidationError[]> {
    const validationErrors = await local.validate?.(local.state)
    if (!validationErrors) {
      return []
    }

    return resolveErrorIds(validationErrors)
  }

  async function runValidation(target?: string | string[]): Promise<FormValidationError[]> {
    const allErrors = await getErrors()

    if (!target) {
      setErrors(allErrors)
      return allErrors
    }

    const names = Array.isArray(target) ? target : [target]
    const nextErrors = [
      ...errors().filter((error) => !matchesValidationTarget(error, names, inputs())),
      ...allErrors.filter((error) => matchesValidationTarget(error, names, inputs())),
    ]

    setErrors(nextErrors)
    return nextErrors
  }

  const stateAccessor = createMemo(() => local.state as Record<string, unknown> | undefined)

  const contextValue: FormContextValue = {
    get disabled() {
      return local.disabled ?? false
    },
    get loading() {
      return loading()
    },
    get errors() {
      return errors()
    },
    get state() {
      return stateAccessor()
    },
    get validateOn() {
      return local.validateOn ?? DEFAULT_VALUDATE_ON
    },
    get validateOnInputDelay() {
      return local.validateOnInputDelay ?? 300
    },
    registerInput,
    unregisterInput,
    getInputMeta,
    emitInputEvent,
    subscribeInputEvents,
    setErrors: (nextErrors) => {
      setErrors(resolveErrorIds(nextErrors))
    },
  }

  function renderChildren(): JSX.Element {
    if (typeof local.children !== 'function') {
      return local.children as JSX.Element
    }

    if (local.children.length > 0) {
      return (local.children as (props: FormRenderProps) => JSX.Element)({
        errors: errors(),
        loading: loading(),
      })
    }

    return (local.children as () => JSX.Element)()
  }

  const onSubmit: JSX.EventHandlerUnion<HTMLFormElement, SubmitEvent> = async (event) => {
    event.preventDefault()

    const submitEvent = event as FormSubmitEvent<TState>
    setLoading(Boolean(local.loadingAuto ?? true))

    try {
      const currentErrors = await runValidation()

      if (currentErrors.length > 0) {
        const errorEvent = Object.assign(event, {
          errors: currentErrors,
        }) as FormErrorEvent
        local.onError?.(errorEvent)
        return
      }

      submitEvent.data = local.state
      await local.onSubmit?.(submitEvent)
      dirtyFields.clear()
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormProvider value={contextValue}>
      <form
        id={formId()}
        class={formVariants(
          {
            loading: loading(),
          },
          local.classes?.root,
        )}
        data-loading={loading() ? 'true' : undefined}
        onSubmit={onSubmit}
        {...rest}
      >
        {renderChildren()}
      </form>
    </FormProvider>
  )
}
