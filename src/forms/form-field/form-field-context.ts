import type { FieldStore, RequiredPath } from '@formisch/solid'
import type { Accessor, JSX } from 'solid-js'
import { createMemo, onCleanup, onMount } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider.tsx'

export interface FormFieldRuntimeState {
  touched: boolean
  dirty: boolean
  focused: boolean
  validating: boolean
  valid: boolean
}

export interface FormFieldContextOptions {
  error?: boolean | string | JSX.Element
  name?: string
  path?: RequiredPath
  field?: FieldStore
  size?: FormFieldSize
  hint?: JSX.Element
  description?: JSX.Element
  help?: JSX.Element
  ariaId: string
  controlId?: string
  registerControl?: (entry: { id: Accessor<string>; bind: Accessor<boolean> }) => () => void
}

export interface UseFormFieldProps {
  id?: string
  name?: string
  size?: FormFieldSize
  disabled?: boolean
}

export interface UseFormFieldOptions {
  bind?: boolean
  defaultId: string
  defaultSize: FormFieldSize
  defaultAriaAttrs?: Record<string, string | boolean | undefined>
  initialValue?: unknown
}

export interface UseFormFieldReturn {
  id: Accessor<string>
  name: Accessor<string | undefined>
  value: Accessor<unknown>
  size: Accessor<FormFieldSize>
  disabled: Accessor<boolean>
  invalid: Accessor<boolean>
  ariaAttrs: Accessor<Record<string, string | boolean | undefined>>
  runtimeState: Accessor<FormFieldRuntimeState>
  setFormValue: (value: unknown) => void
  emit: (type: 'blur' | 'change' | 'focus' | 'input', event?: Event) => void
}

export type FormFieldSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const [FormFieldProvider, useFormFieldContext] =
  createContextProvider<FormFieldContextOptions | null>('FormField', null)

const EMPTY_RUNTIME_STATE: FormFieldRuntimeState = {
  touched: false,
  dirty: false,
  focused: false,
  validating: false,
  valid: true,
}

export function useFormField(
  props: Accessor<UseFormFieldProps> | undefined,
  opts: Accessor<UseFormFieldOptions>,
): UseFormFieldReturn {
  const formField = useFormFieldContext()
  const options = createMemo(() => opts())
  const fieldProps = createMemo(() => props?.() ?? {})
  const bind = createMemo(() => options().bind ?? true)
  const localId = createMemo(() => fieldProps().id ?? options().defaultId)

  if (formField?.registerControl) {
    const unregister = formField.registerControl({ id: localId, bind })
    onCleanup(unregister)
  }

  const id = createMemo(() => fieldProps().id ?? formField?.controlId ?? options().defaultId)
  const name = createMemo(
    () => fieldProps().name ?? formField?.field?.props.name ?? formField?.name,
  )
  const value = createMemo(() => formField?.field?.input)
  const size = createMemo(() => fieldProps().size ?? formField?.size ?? options().defaultSize)
  const disabled = createMemo(() => Boolean(fieldProps().disabled))
  const invalid = createMemo(() => Boolean(formField?.error))

  onMount(() => {
    const field = formField?.field
    const initialValue = options().initialValue
    if (field && field.input === undefined && initialValue !== undefined) {
      field.onInput(initialValue)
    }
  })
  const runtimeState = createMemo<FormFieldRuntimeState>(() => {
    const field = formField?.field
    if (!field) {
      return EMPTY_RUNTIME_STATE
    }
    return {
      touched: field.isTouched,
      dirty: field.isDirty,
      focused: false,
      validating: false,
      valid: field.isValid,
    }
  })

  const ariaAttrs = createMemo<Record<string, string | boolean | undefined>>(() => {
    if (!formField) {
      return options().defaultAriaAttrs ?? {}
    }
    const describedBy = [
      formField.error ? `${formField.ariaId}-error` : undefined,
      formField.hint ? `${formField.ariaId}-hint` : undefined,
      formField.description ? `${formField.ariaId}-description` : undefined,
      formField.help ? `${formField.ariaId}-help` : undefined,
    ].filter(Boolean)
    return {
      'aria-invalid': Boolean(formField.error) || undefined,
      'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
    }
  })

  function setFormValue(value: unknown): void {
    formField?.field?.onInput(value)
  }

  function emit(type: 'blur' | 'change' | 'focus' | 'input', event?: Event): void {
    const field = formField?.field
    if (!field || !event) {
      return
    }
    if (type === 'blur') {
      field.props.onBlur(event as Parameters<typeof field.props.onBlur>[0])
    }
    if (type === 'focus') {
      field.props.onFocus(event as Parameters<typeof field.props.onFocus>[0])
    }
  }

  return { id, name, value, size, disabled, invalid, ariaAttrs, runtimeState, setFormValue, emit }
}
