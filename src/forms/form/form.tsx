import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { createStore, produce, reconcile } from 'solid-js/store'

import { resolveRenderProp } from '../../shared/render-prop'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn, useId } from '../../shared/utils'

import type {
  FormContextValue,
  FormFieldRuntimeState,
  FormInputEvent,
  FormInputEventType,
  FormInputMeta,
  FormValidationError,
} from './form-context'
import { FormProvider } from './form-context'
import { pathStartsWith, pathToKey, toFieldPath } from './form-path'
import type { StandardSchemaV1 } from './standard-schema'

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

export type FormStyles = SlotStyles<FormSlots>

export interface FormBaseProps<TState extends FormState = FormState> {
  id?: string
  state?: TState
  schema?: StandardSchemaV1<TState>
  validate?: (state: TState | undefined) => FormValidationError[] | Promise<FormValidationError[]>
  validateOn?: FormInputEventType[]
  validateOnInputDelay?: number
  disabled?: boolean
  loadingAuto?: boolean
  onSubmit?: (event: FormSubmitEvent<TState>) => void | Promise<void>
  onError?: (event: FormErrorEvent) => void
  classes?: FormClasses
  styles?: FormStyles
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

interface FormFieldEntry {
  path: string[]
  meta: FormInputMeta
  runtime: FormFieldRuntimeEntry
  value: unknown
}

interface FormFieldIdentity {
  key: string
  path: string[]
}

interface FormRuntimeStore {
  loading: boolean
  errors: FormValidationError[]
  fields: Record<string, FormFieldEntry>
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

function toFieldIdentity(name: string | string[] | undefined): FormFieldIdentity | undefined {
  const path = toFieldPath(name)
  if (!path) {
    return undefined
  }

  return {
    key: pathToKey(path),
    path,
  }
}

function createFieldEntry(
  identity: FormFieldIdentity,
  meta: FormInputMeta = {},
  value?: unknown,
): FormFieldEntry {
  return {
    path: [...identity.path],
    meta: { ...meta },
    runtime: createFieldRuntimeEntry(),
    value,
  }
}

function setValueAtPath(target: unknown, path: string[] | undefined, value: unknown): void {
  if (!target || typeof target !== 'object' || !path || path.length === 0) {
    return
  }

  let current: Record<string, unknown> = target as Record<string, unknown>

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index]!
    const next = current[key]

    if (!next || typeof next !== 'object') {
      current[key] = {}
    }

    current = current[key] as Record<string, unknown>
  }

  const leafKey = path[path.length - 1]!
  current[leafKey] = value
}

function getValueAtPath(target: unknown, path: string[] | undefined): unknown {
  if (!target || typeof target !== 'object' || !path || path.length === 0) {
    return undefined
  }

  let current: unknown = target

  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[key]
  }

  return current
}

function matchesField(error: FormValidationError, targets: FormFieldIdentity[]): boolean {
  const errorPath = toFieldPath(error.name)
  if (!errorPath) {
    return false
  }

  return targets.some((target) => pathStartsWith(errorPath, target.path))
}

const DEFAULT_VALIDATE_ON: FormInputEventType[] = ['input', 'blur', 'change']

async function validateStandardSchema(
  state: unknown,
  schema: StandardSchemaV1,
): Promise<FormValidationError[]> {
  const result = await schema['~standard'].validate(state)

  if (!result.issues) {
    return []
  }

  return result.issues.map((issue) => ({
    name: issue.path?.map((s) => String(typeof s === 'object' ? s.key : s)),
    message: issue.message,
  }))
}

export function Form<TState extends FormState = FormState>(props: FormProps<TState>): JSX.Element {
  const [stateProps, eventProps, renderProps, restProps] = splitProps(
    props as FormProps<TState>,
    ['id', 'state', 'schema', 'validate', 'validateOn', 'validateOnInputDelay', 'disabled'],
    ['loadingAuto', 'onSubmit', 'onError'],
    ['classes', 'styles', 'children'],
  )

  const formId = useId(() => stateProps.id, 'form')
  const [formState, setFormState] = createStore<FormRuntimeStore>({
    loading: false,
    errors: [],
    fields: {},
  })

  function buildValidationState(): TState | undefined {
    if (stateProps.state !== undefined) {
      return stateProps.state
    }

    const result: Record<string, unknown> = {}
    for (const entry of Object.values(formState.fields)) {
      setValueAtPath(result, entry.path, entry.value)
    }
    return result as TState
  }

  function upsertField(identity: FormFieldIdentity, meta: FormInputMeta): void {
    setFormState(
      'fields',
      produce((currentFields) => {
        const current = currentFields[identity.key]
        if (!current) {
          currentFields[identity.key] = createFieldEntry(identity, meta)
          return
        }

        currentFields[identity.key] = {
          ...current,
          path: [...identity.path],
          meta: {
            ...current.meta,
            ...meta,
          },
        }
      }),
    )
  }

  function patchFieldRuntime(
    identity: FormFieldIdentity | undefined,
    patch: Partial<FormFieldRuntimeEntry>,
  ): void {
    if (!identity) {
      return
    }

    setFormState(
      'fields',
      produce((currentFields) => {
        const current = currentFields[identity.key] ?? createFieldEntry(identity)
        currentFields[identity.key] = {
          ...current,
          path: [...identity.path],
          runtime: {
            ...current.runtime,
            ...patch,
          },
        }
      }),
    )
  }

  function removeField(identity: FormFieldIdentity | undefined): void {
    if (!identity) {
      return
    }

    setFormState(
      'fields',
      produce((currentFields) => {
        if (!(identity.key in currentFields)) {
          return
        }

        delete currentFields[identity.key]
      }),
    )
  }

  function updateValidatingCount(targets: FormFieldIdentity[], delta: 1 | -1): void {
    const identities = [...new Map(targets.map((target) => [target.key, target])).values()]
    if (identities.length === 0) {
      return
    }

    setFormState(
      'fields',
      produce((currentFields) => {
        for (const identity of identities) {
          const current = currentFields[identity.key] ?? createFieldEntry(identity)
          const validatingCount = Math.max(0, current.runtime.validatingCount + delta)

          if (validatingCount === current.runtime.validatingCount) {
            continue
          }

          currentFields[identity.key] = {
            ...current,
            path: [...identity.path],
            runtime: {
              ...current.runtime,
              validatingCount,
            },
          }
        }
      }),
    )
  }

  function isFieldBlurred(identity: FormFieldIdentity | undefined): boolean {
    if (!identity) {
      return false
    }

    return Boolean(formState.fields[identity.key]?.runtime.blurred)
  }

  async function handleInputEvent(event: FormInputEvent): Promise<void> {
    const identity = toFieldIdentity(event.name)
    const shouldValidate = (stateProps.validateOn ?? DEFAULT_VALIDATE_ON).includes(event.type)

    if (shouldValidate && !formState.loading && identity) {
      if (event.type === 'input') {
        if (event.eager || isFieldBlurred(identity)) {
          await runValidation([identity])
        }
      } else {
        await runValidation([identity])
      }
    }

    switch (event.type) {
      case 'blur':
        patchFieldRuntime(identity, {
          blurred: true,
          touched: true,
          focused: false,
        })
        return
      case 'focus':
        patchFieldRuntime(identity, {
          touched: true,
          focused: true,
        })
        return
      case 'change':
      case 'input':
        patchFieldRuntime(identity, {
          touched: true,
          dirty: true,
        })
        return
    }
  }

  function emitInputEvent(event: FormInputEvent): void {
    void handleInputEvent(event)
  }

  function registerInput(name: string | string[], meta: FormInputMeta): void {
    const identity = toFieldIdentity(name)
    if (!identity) {
      return
    }

    upsertField(identity, meta)
  }

  function unregisterInput(name: string | string[]): void {
    removeField(toFieldIdentity(name))
  }

  function getInputMeta(name: string | string[]): FormInputMeta | undefined {
    const identity = toFieldIdentity(name)
    if (!identity) {
      return undefined
    }

    return formState.fields[identity.key]?.meta
  }

  function resolveErrorIds(nextErrors: FormValidationError[]): FormValidationError[] {
    return nextErrors.map((error) => {
      const identity = toFieldIdentity(error.name)
      if (!identity) {
        return error
      }

      return {
        ...error,
        id: formState.fields[identity.key]?.meta.id,
      }
    })
  }

  async function getErrors(): Promise<FormValidationError[]> {
    const validationState = buildValidationState()
    const schemaErrors = stateProps.schema
      ? await validateStandardSchema(validationState, stateProps.schema)
      : []
    const validationErrors = (await stateProps.validate?.(validationState)) ?? []

    const allErrors = [...schemaErrors, ...validationErrors]
    return resolveErrorIds(allErrors)
  }

  function allFieldIdentities(): FormFieldIdentity[] {
    return Object.entries(formState.fields).map(([key, entry]) => ({
      key,
      path: entry.path,
    }))
  }

  async function runValidation(targets?: FormFieldIdentity[]): Promise<FormValidationError[]> {
    const targetIdentities = targets ?? allFieldIdentities()
    updateValidatingCount(targetIdentities, 1)

    try {
      const allErrors = await getErrors()

      if (!targets) {
        setFormState('errors', reconcile(allErrors))
        return allErrors
      }

      const nextErrors = [
        ...formState.errors.filter((error) => !matchesField(error, targetIdentities)),
        ...allErrors.filter((error) => matchesField(error, targetIdentities)),
      ]

      setFormState('errors', reconcile(nextErrors))
      return nextErrors
    } finally {
      updateValidatingCount(targetIdentities, -1)
    }
  }

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
    get validateOn() {
      return stateProps.validateOn ?? DEFAULT_VALIDATE_ON
    },
    get validateOnInputDelay() {
      return stateProps.validateOnInputDelay ?? 300
    },
    registerInput,
    unregisterInput,
    getInputMeta,
    getFieldValue: (name) => {
      const identity = toFieldIdentity(name)
      if (!identity) {
        return undefined
      }

      const fieldValue = formState.fields[identity.key]?.value
      if (fieldValue !== undefined) {
        return fieldValue
      }

      return getValueAtPath(stateProps.state, identity.path)
    },
    getFieldState: (name) => {
      const identity = toFieldIdentity(name)
      if (!identity) {
        return EMPTY_FIELD_RUNTIME_STATE
      }

      return toFieldRuntimeState(formState.fields[identity.key]?.runtime)
    },
    setFieldValue: (name, value) => {
      const path = toFieldPath(name)
      if (!path) {
        return
      }

      if (stateProps.state !== undefined) {
        setValueAtPath(stateProps.state, path, value)
      }

      const key = pathToKey(path)
      setFormState(
        'fields',
        produce((fields) => {
          const current = fields[key]
          if (current) {
            fields[key] = { ...current, value }
          } else {
            fields[key] = createFieldEntry({ key, path: [...path] }, {}, value)
          }
        }),
      )
    },
    emitInputEvent,
    setErrors: (nextErrors) => {
      setFormState('errors', reconcile(resolveErrorIds(nextErrors)))
    },
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

      submitEvent.data = buildValidationState()
      await eventProps.onSubmit?.(submitEvent)
      setFormState(
        'fields',
        produce((currentFields) => {
          for (const key of Object.keys(currentFields)) {
            const runtime = currentFields[key]?.runtime
            if (!runtime?.dirty) {
              continue
            }

            currentFields[key] = {
              ...currentFields[key]!,
              runtime: {
                ...runtime,
                dirty: false,
              },
            }
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
        style={renderProps.styles?.root}
        class={cn('w-full data-loading:opacity-80', renderProps.classes?.root)}
        data-loading={formState.loading ? '' : undefined}
        onSubmit={onSubmit}
        {...restProps}
      >
        {resolveRenderProp<FormRenderProps>(renderProps.children, () => ({
          errors: formState.errors,
          loading: formState.loading,
        }))}
      </form>
    </FormProvider>
  )
}
