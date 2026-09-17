import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, on, onCleanup, onMount } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'

export type FieldPath = readonly (string | number)[]
export type FieldName = string | FieldPath
export type FieldBindingEvent = 'blur' | 'change' | 'focus' | 'input'
export type FieldSize = 'sm' | 'md' | 'lg'

export interface FieldRuntimeState {
  touched: boolean
  dirty: boolean
  focused: boolean
  validating: boolean
  valid: boolean
}

export interface FieldBinding {
  readonly name?: string
  readonly path?: FieldPath
  readonly value?: unknown
  readonly error?: JSX.Element
  readonly runtimeState?: FieldRuntimeState
  readonly controlRef?: (element: HTMLElement) => void
  setValue: (value: unknown) => void
  emit: (type: FieldBindingEvent, event?: Event) => void
}

export interface FieldContextOptions {
  error?: JSX.Element
  name?: FieldName
  path?: FieldPath
  binding?: FieldBinding
  size?: FieldSize | null
  hint?: JSX.Element
  description?: JSX.Element
  help?: JSX.Element
  ariaId: string
  labelId?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  ariaAttrs?: Accessor<Record<string, string | boolean | undefined>>
  controlId?: string
  registerControl?: (entry: { id: Accessor<string>; bind: Accessor<boolean> }) => () => void
}

export interface UseFormFieldProps {
  id?: string
  name?: string
  size?: FieldSize | null
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
}

export interface UseFormFieldOptions {
  bind?: boolean
  defaultId: string
  defaultAriaAttrs?: Record<string, string | boolean | undefined>
  initialValue?: unknown
}

export interface UseFormFieldReturn {
  path: Accessor<FieldPath | undefined>
  id: Accessor<string>
  name: Accessor<string | undefined>
  value: Accessor<unknown>
  size: Accessor<FieldSize | null | undefined>
  disabled: Accessor<boolean>
  required: Accessor<boolean>
  readOnly: Accessor<boolean>
  invalid: Accessor<boolean>
  ariaAttrs: Accessor<JSX.AriaAttributes>
  runtimeState: Accessor<FieldRuntimeState>
  setFormValue: (value: unknown) => void
  emit: (type: FieldBindingEvent, event?: Event) => void
}

export const [FieldProvider, useFieldContext] = createContextProvider<FieldContextOptions | null>(
  'Field',
  null,
)

const EMPTY_RUNTIME_STATE: FieldRuntimeState = {
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
  const fieldContext = useFieldContext()
  const options = createMemo(() => opts())
  const fieldProps = createMemo(() => props?.() ?? {})
  const bind = createMemo(() => options().bind ?? true)
  const localId = createMemo(() => fieldProps().id ?? options().defaultId)

  if (fieldContext?.registerControl) {
    const unregister = fieldContext.registerControl({ id: localId, bind })
    onCleanup(unregister)
  }

  const id = localId
  const path = createMemo<FieldPath | undefined>(
    () => fieldContext?.binding?.path?.slice() ?? fieldContext?.path?.slice(),
  )
  const name = createMemo(() => {
    if (fieldProps().name !== undefined) {
      return fieldProps().name
    }
    if (fieldContext?.binding?.name !== undefined) {
      return fieldContext.binding.name
    }
    return typeof fieldContext?.name === 'string' ? fieldContext.name : undefined
  })
  const value = createMemo(() => fieldContext?.binding?.value)
  const size = createMemo(() =>
    fieldProps().size !== undefined ? fieldProps().size : fieldContext?.size,
  )
  const disabled = createMemo(() => fieldProps().disabled ?? fieldContext?.disabled ?? false)
  const required = createMemo(() => fieldProps().required ?? Boolean(fieldContext?.required))
  const readOnly = createMemo(() => fieldProps().readOnly ?? fieldContext?.readOnly ?? false)
  const invalid = createMemo(() => {
    const error = fieldContext?.error
    return error !== undefined && error !== null && error !== false && error !== ''
  })

  createEffect(
    on([path, bind, id, () => fieldContext?.binding?.controlRef], ([, bound, controlId, ref]) => {
      if (!bound || !ref) {
        return
      }
      const element = document.getElementById(controlId)
      if (element) {
        ref(element)
      }
    }),
  )

  onMount(() => {
    const binding = fieldContext?.binding
    const initialValue = options().initialValue
    if (binding && binding.value === undefined && initialValue !== undefined) {
      binding.setValue(initialValue)
    }
  })

  const runtimeState = createMemo<FieldRuntimeState>(
    () => fieldContext?.binding?.runtimeState ?? EMPTY_RUNTIME_STATE,
  )

  const ariaAttrs = createMemo<JSX.AriaAttributes>(() => {
    const fromField = fieldContext?.ariaAttrs?.() ?? options().defaultAriaAttrs ?? {}
    const attrs: JSX.AriaAttributes = {}

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
    if (typeof fromField['aria-describedby'] === 'string') {
      attrs['aria-describedby'] = fromField['aria-describedby']
    }
    if (typeof fromField['aria-labelledby'] === 'string') {
      attrs['aria-labelledby'] = fromField['aria-labelledby']
    }

    return attrs
  })

  function setFormValue(nextValue: unknown): void {
    fieldContext?.binding?.setValue(nextValue)
  }

  function emit(type: FieldBindingEvent, event?: Event): void {
    fieldContext?.binding?.emit(type, event)
  }

  return {
    path,
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
