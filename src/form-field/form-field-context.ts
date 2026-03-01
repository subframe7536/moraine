import type { Accessor, JSX } from 'solid-js'
import { createMemo, onCleanup } from 'solid-js'

import type { FormFieldRuntimeState } from '../form/form-context'
import { useFormContext } from '../form/form-context'
import { createContextProvider } from '../shared/create-context-provider'

export interface FormFieldInjectedOptions {
  error?: boolean | string | JSX.Element
  name?: string
  size?: FormFieldSize
  eagerValidation?: boolean
  validateOnInputDelay?: number
  errorPattern?: RegExp
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
  highlight?: boolean
  disabled?: boolean
}

export interface UseFormFieldOptions {
  bind?: boolean
  deferInputValidation?: boolean
  defaultId: Accessor<string>
  defaultSize: FormFieldSize
  defaultAriaAttrs?: Record<string, string | boolean | undefined>
}

export interface UseFormFieldReturn {
  id: Accessor<string>
  name: Accessor<string | undefined>
  size: Accessor<FormFieldSize>
  highlight: Accessor<boolean | undefined>
  disabled: Accessor<boolean>
  invalid: Accessor<boolean>
  ariaAttrs: Accessor<Record<string, string | boolean | undefined>>
  touched: Accessor<boolean>
  dirty: Accessor<boolean>
  focused: Accessor<boolean>
  validating: Accessor<boolean>
  emitFormBlur: () => void
  emitFormFocus: () => void
  emitFormChange: () => void
  emitFormInput: () => void
}

export type FormFieldSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const [FormFieldProvider, useFormFieldContext] =
  createContextProvider<FormFieldInjectedOptions | null>('FormField', null)

const EMPTY_RUNTIME_STATE: FormFieldRuntimeState = {
  touched: false,
  dirty: false,
  focused: false,
  validating: false,
}

export function useFormField(
  props: Accessor<UseFormFieldProps> | undefined,
  opts: UseFormFieldOptions | Accessor<UseFormFieldOptions>,
): UseFormFieldReturn {
  const formContext = useFormContext()
  const formField = useFormFieldContext()

  const options = createMemo(() => {
    const value = typeof opts === 'function' ? opts() : opts

    return {
      bind: value.bind ?? true,
      deferInputValidation: value.deferInputValidation ?? false,
      defaultId: value.defaultId,
      defaultSize: value.defaultSize,
      defaultAriaAttrs: value.defaultAriaAttrs,
    }
  })

  const fieldProps = createMemo(() => props?.() ?? {})
  const bind = createMemo(() => options().bind)
  const localId = createMemo(() => fieldProps().id ?? options().defaultId())

  if (formField?.registerControl) {
    const unregister = formField.registerControl({
      id: localId,
      bind,
    })
    onCleanup(unregister)
  }

  const id = createMemo(() => fieldProps().id ?? formField?.controlId ?? options().defaultId())
  const name = createMemo(() => fieldProps().name ?? formField?.name)
  const size = createMemo(() => fieldProps().size ?? formField?.size ?? options().defaultSize)
  const highlight = createMemo(() => {
    if (formField?.error) {
      return true
    }

    return fieldProps().highlight
  })
  const disabled = createMemo(() => Boolean(formContext?.disabled || fieldProps().disabled))
  const invalid = createMemo(() => Boolean(formField?.error))
  const runtimeState = createMemo(() => formContext?.getFieldState(name()) ?? EMPTY_RUNTIME_STATE)
  const touched = createMemo(() => runtimeState().touched)
  const dirty = createMemo(() => runtimeState().dirty)
  const focused = createMemo(() => runtimeState().focused)
  const validating = createMemo(() => runtimeState().validating)

  let inputTimer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => {
    if (inputTimer) {
      clearTimeout(inputTimer)
      inputTimer = undefined
    }
  })

  function emitFormEvent(type: 'blur' | 'change' | 'focus' | 'input', eager?: boolean): void {
    if (!formContext) {
      return
    }

    formContext.emitInputEvent({
      type,
      name: name(),
      eager,
    })
  }

  function emitFormBlur(): void {
    emitFormEvent('blur')
  }

  function emitFormFocus(): void {
    emitFormEvent('focus')
  }

  function emitFormChange(): void {
    emitFormEvent('change')
  }

  function emitFormInput(): void {
    const delay = formField?.validateOnInputDelay ?? formContext?.validateOnInputDelay ?? 300
    const eagerValidation = Boolean(!options().deferInputValidation || formField?.eagerValidation)

    if (inputTimer) {
      clearTimeout(inputTimer)
    }

    inputTimer = setTimeout(() => {
      emitFormEvent('input', eagerValidation)
    }, delay)
  }

  const ariaAttrs = createMemo<Record<string, string | boolean | undefined>>(() => {
    if (!formField) {
      return options().defaultAriaAttrs ?? {}
    }

    const describedBy: string[] = []

    if (formField.error) {
      describedBy.push(`${formField.ariaId}-error`)
    }
    if (formField.hint) {
      describedBy.push(`${formField.ariaId}-hint`)
    }
    if (formField.description) {
      describedBy.push(`${formField.ariaId}-description`)
    }
    if (formField.help) {
      describedBy.push(`${formField.ariaId}-help`)
    }

    const attrs: Record<string, string | boolean | undefined> = {
      'aria-invalid': Boolean(formField.error) || undefined,
    }

    if (describedBy.length > 0) {
      attrs['aria-describedby'] = describedBy.join(' ')
    }

    return attrs
  })

  return {
    id,
    name,
    size,
    highlight,
    disabled,
    invalid,
    ariaAttrs,
    touched,
    dirty,
    focused,
    validating,
    emitFormBlur,
    emitFormFocus,
    emitFormChange,
    emitFormInput,
  } satisfies UseFormFieldReturn
}
