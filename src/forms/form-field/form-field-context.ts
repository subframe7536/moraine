import type { FieldStore, RequiredPath } from '@formisch/solid'
import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, onCleanup, onMount } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider.tsx'

export interface FormFieldRuntimeState {
  touched: boolean
  dirty: boolean
  focused: boolean
  validating: boolean
  valid: boolean
}

export interface FormFieldContextOptions {
  error?: JSX.Element
  name?: string
  path?: RequiredPath
  field?: FieldStore
  size?: FormFieldSize
  hint?: JSX.Element
  description?: JSX.Element
  help?: JSX.Element
  ariaId: string
  labelId?: string
  required?: boolean
  ariaAttrs?: Accessor<Record<string, string | boolean | undefined>>
  controlId?: string
  registerControl?: (entry: { id: Accessor<string>; bind: Accessor<boolean> }) => () => void
}

export interface UseFormFieldProps {
  id?: string
  name?: string
  size?: FormFieldSize
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
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
  required: Accessor<boolean>
  readOnly: Accessor<boolean>
  invalid: Accessor<boolean>
  ariaAttrs: Accessor<Record<string, string | boolean | undefined>>
  runtimeState: Accessor<FormFieldRuntimeState>
  setFormValue: (value: unknown) => void
  emit: (type: 'blur' | 'change' | 'focus' | 'input', event?: Event) => void
}

export type FormFieldSize = 'sm' | 'md' | 'lg'

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

  const id = localId
  const name = createMemo(
    () => fieldProps().name ?? formField?.field?.props.name ?? formField?.name,
  )
  const value = createMemo(() => formField?.field?.input)
  const size = createMemo(() => fieldProps().size ?? formField?.size ?? options().defaultSize)
  const disabled = createMemo(() => Boolean(fieldProps().disabled))
  const required = createMemo(() => fieldProps().required ?? Boolean(formField?.required))
  const readOnly = createMemo(() => Boolean(fieldProps().readOnly))
  const invalid = createMemo(() => {
    const error = formField?.error
    return error !== undefined && error !== null && error !== false && error !== ''
  })

  createEffect(() => {
    const field = formField?.field
    if (!field || !bind()) {
      return
    }

    const element = document.getElementById(id())
    if (element) {
      field.props.ref(element as HTMLInputElement)
    }
  })

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
    const fromFormField = formField?.ariaAttrs?.() ?? options().defaultAriaAttrs ?? {}
    const attrs: Record<string, string | boolean | undefined> = {}

    if (invalid()) {
      attrs['aria-invalid'] = 'true'
    }
    if (required()) {
      attrs['aria-required'] = 'true'
    }
    if (disabled()) {
      attrs['aria-disabled'] = 'true'
    }
    if (readOnly()) {
      attrs['aria-readonly'] = 'true'
    }
    if (fromFormField['aria-describedby']) {
      attrs['aria-describedby'] = fromFormField['aria-describedby']
    }
    if (fromFormField['aria-labelledby']) {
      attrs['aria-labelledby'] = fromFormField['aria-labelledby']
    }

    return attrs
  })

  function setFormValue(value: unknown): void {
    formField?.field?.onInput(value)
  }

  function emit(type: 'blur' | 'change' | 'focus' | 'input', event?: Event): void {
    const field = formField?.field
    if (!field) {
      return
    }
    if (type === 'blur') {
      field.props.onBlur()
    }
    if (type === 'focus') {
      field.props.onFocus()
    }
    if (type === 'change') {
      field.props.onChange(event as Parameters<typeof field.props.onChange>[0])
    }
  }

  return {
    id,
    name,
    value,
    size,
    disabled,
    required,
    readOnly,
    invalid,
    ariaAttrs,
    runtimeState,
    setFormValue,
    emit,
  }
}
