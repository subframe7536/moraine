import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { createStore, produce, reconcile } from 'solid-js/store'

import type { SlotClasses } from '../shared/slot-class'
import { cn, useId } from '../shared/utils'

import type {
  FormContextValue,
  FormFieldRuntimeState,
  FormInputEvent,
  FormInputEventType,
  FormInputMeta,
  FormValidationError,
} from './form-context'
import { FormProvider } from './form-context'

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

type FormSlots = 'root'

export type FormClasses = SlotClasses<FormSlots>

export interface FormBaseProps<TState extends FormState = FormState> {
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

export type FormProps<TState extends FormState = FormState> = FormBaseProps<TState>

interface FormFieldRuntimeEntry {
  touched: boolean
  dirty: boolean
  focused: boolean
  validatingCount: number
  blurred: boolean
}

interface FormRuntimeStore {
  loading: boolean
  errors: FormValidationError[]
  inputs: Record<string, FormInputMeta>
  fieldStates: Record<string, FormFieldRuntimeEntry>
}

const EMPTY_FIELD_RUNTIME_STATE: FormFieldRuntimeState = {
  touched: false,
  dirty: false,
  focused: false,
  validating: false,
}

const EMPTY_FIELD_RUNTIME_ENTRY: FormFieldRuntimeEntry = {
  touched: false,
  dirty: false,
  focused: false,
  validatingCount: 0,
  blurred: false,
}

function createFieldRuntimeEntry(): FormFieldRuntimeEntry {
  return { ...EMPTY_FIELD_RUNTIME_ENTRY }
}

function toFieldRuntimeState(entry: FormFieldRuntimeEntry | undefined): FormFieldRuntimeState {
  if (!entry) {
    return EMPTY_FIELD_RUNTIME_STATE
  }

  return {
    touched: entry.touched,
    dirty: entry.dirty,
    focused: entry.focused,
    validating: entry.validatingCount > 0,
  }
}

function isSameRuntimeEntry(a: FormFieldRuntimeEntry, b: FormFieldRuntimeEntry): boolean {
  return (
    a.touched === b.touched &&
    a.dirty === b.dirty &&
    a.focused === b.focused &&
    a.validatingCount === b.validatingCount &&
    a.blurred === b.blurred
  )
}

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

const DEFAULT_VALIDATE_ON: FormInputEventType[] = ['input', 'blur', 'change']
export function Form<TState extends FormState = FormState>(props: FormProps<TState>): JSX.Element {
  const [stateProps, eventProps, renderProps, restProps] = splitProps(
    props as FormProps<TState>,
    ['id', 'state', 'validate', 'validateOn', 'validateOnInputDelay', 'disabled'],
    ['loadingAuto', 'onSubmit', 'onError'],
    ['classes', 'children'],
  )

  const formId = useId(() => stateProps.id, 'form')
  const [formState, setFormState] = createStore<FormRuntimeStore>({
    loading: false,
    errors: [],
    inputs: {},
    fieldStates: {},
  })

  const listeners = new Set<(event: FormInputEvent) => void>()

  function patchFieldState(name: string, patch: Partial<FormFieldRuntimeEntry>): void {
    if (!name) {
      return
    }

    setFormState(
      'fieldStates',
      produce((currentStates) => {
        const current = currentStates[name] ?? createFieldRuntimeEntry()
        const next = {
          ...current,
          ...patch,
        }

        if (isSameRuntimeEntry(current, next)) {
          return
        }

        currentStates[name] = next
      }),
    )
  }

  function removeFieldState(name: string): void {
    setFormState(
      'fieldStates',
      produce((currentStates) => {
        if (!(name in currentStates)) {
          return
        }

        delete currentStates[name]
      }),
    )
  }

  function updateValidatingState(names: string[], delta: 1 | -1): void {
    const uniqueNames = [...new Set(names.filter(Boolean))]

    if (uniqueNames.length === 0) {
      return
    }

    setFormState(
      'fieldStates',
      produce((currentStates) => {
        for (const name of uniqueNames) {
          const current = currentStates[name] ?? createFieldRuntimeEntry()
          const validatingCount = Math.max(0, current.validatingCount + delta)

          if (validatingCount === current.validatingCount) {
            continue
          }

          currentStates[name] = {
            ...current,
            validatingCount,
          }
        }
      }),
    )
  }

  function isFieldBlurred(name: string): boolean {
    return Boolean(formState.fieldStates[name]?.blurred)
  }

  async function handleInputEvent(event: FormInputEvent): Promise<void> {
    if ((stateProps.validateOn ?? DEFAULT_VALIDATE_ON).includes(event.type) && !formState.loading) {
      if (event.type !== 'input') {
        if (event.name) {
          await runValidation(event.name)
        }
      } else if (event.eager || (event.name && isFieldBlurred(event.name))) {
        if (event.name) {
          await runValidation(event.name)
        }
      }
    }

    if (!event.name) {
      return
    }

    if (event.type === 'blur') {
      patchFieldState(event.name, {
        blurred: true,
        touched: true,
        focused: false,
      })
    }

    if (event.type === 'focus' || event.type === 'change' || event.type === 'input') {
      patchFieldState(event.name, {
        touched: true,
      })
    }

    if (event.type === 'focus') {
      patchFieldState(event.name, {
        focused: true,
      })
    }

    if (event.type === 'change' || event.type === 'input') {
      patchFieldState(event.name, {
        dirty: true,
      })
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
    setFormState('inputs', name, reconcile(meta))
  }

  function unregisterInput(name: string): void {
    setFormState(
      'inputs',
      produce((currentInputs) => {
        if (!(name in currentInputs)) {
          return
        }

        delete currentInputs[name]
      }),
    )
    removeFieldState(name)
  }

  function getInputMeta(name: string): FormInputMeta | undefined {
    return formState.inputs[name]
  }

  function resolveErrorIds(nextErrors: FormValidationError[]): FormValidationError[] {
    return nextErrors.map((error) => {
      if (!error.name) {
        return error
      }

      return {
        ...error,
        id: formState.inputs[error.name]?.id,
      }
    })
  }

  async function getErrors(): Promise<FormValidationError[]> {
    const validationErrors = await stateProps.validate?.(stateProps.state)
    if (!validationErrors) {
      return []
    }

    return resolveErrorIds(validationErrors)
  }

  async function runValidation(target?: string | string[]): Promise<FormValidationError[]> {
    const targets = target
      ? Array.isArray(target)
        ? target
        : [target]
      : Object.keys(formState.inputs)
    updateValidatingState(targets, 1)

    try {
      const allErrors = await getErrors()

      if (!target) {
        setFormState('errors', reconcile(allErrors))
        return allErrors
      }

      const names = Array.isArray(target) ? target : [target]
      const nextErrors = [
        ...formState.errors.filter(
          (error) => !matchesValidationTarget(error, names, formState.inputs),
        ),
        ...allErrors.filter((error) => matchesValidationTarget(error, names, formState.inputs)),
      ]

      setFormState('errors', reconcile(nextErrors))
      return nextErrors
    } finally {
      updateValidatingState(targets, -1)
    }
  }

  const stateAccessor = createMemo(() => stateProps.state as Record<string, unknown> | undefined)

  const contextValue: FormContextValue = {
    get disabled() {
      return stateProps.disabled ?? false
    },
    get loading() {
      return formState.loading
    },
    get errors() {
      return formState.errors
    },
    get state() {
      return stateAccessor()
    },
    get validateOn() {
      return stateProps.validateOn ?? DEFAULT_VALIDATE_ON
    },
    get validateOnInputDelay() {
      return stateProps.validateOnInputDelay ?? 300
    },
    registerInput,
    unregisterInput,
    getInputMeta,
    getFieldState: (name) => {
      if (!name) {
        return EMPTY_FIELD_RUNTIME_STATE
      }

      return toFieldRuntimeState(formState.fieldStates[name])
    },
    emitInputEvent,
    subscribeInputEvents,
    setErrors: (nextErrors) => {
      setFormState('errors', reconcile(resolveErrorIds(nextErrors)))
    },
  }

  function renderChildren(): JSX.Element {
    if (typeof renderProps.children !== 'function') {
      return renderProps.children as JSX.Element
    }

    if (renderProps.children.length > 0) {
      return (renderProps.children as (props: FormRenderProps) => JSX.Element)({
        errors: formState.errors,
        loading: formState.loading,
      })
    }

    return (renderProps.children as () => JSX.Element)()
  }

  const onSubmit: JSX.EventHandlerUnion<HTMLFormElement, SubmitEvent> = async (event) => {
    event.preventDefault()

    const submitEvent = event as FormSubmitEvent<TState>
    setFormState('loading', Boolean(eventProps.loadingAuto ?? true))

    try {
      const currentErrors = await runValidation()

      if (currentErrors.length > 0) {
        const errorEvent = Object.assign(event, {
          errors: currentErrors,
        }) as FormErrorEvent
        eventProps.onError?.(errorEvent)
        return
      }

      submitEvent.data = stateProps.state
      await eventProps.onSubmit?.(submitEvent)
      setFormState(
        'fieldStates',
        produce((currentStates) => {
          for (const name of Object.keys(currentStates)) {
            if (!currentStates[name]?.dirty) {
              continue
            }

            currentStates[name]!.dirty = false
          }
        }),
      )
    } finally {
      setFormState('loading', false)
    }
  }

  return (
    <FormProvider value={contextValue}>
      <form
        id={formId()}
        class={cn('w-full data-loading:opacity-80', renderProps.classes?.root)}
        data-loading={formState.loading ? '' : undefined}
        onSubmit={onSubmit}
        {...restProps}
      >
        {renderChildren()}
      </form>
    </FormProvider>
  )
}
