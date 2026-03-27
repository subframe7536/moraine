import type { Accessor, JSX } from 'solid-js'
import { createMemo, onCleanup, onMount } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { FormFieldRuntimeState, FormInputEventType } from '../form/form-context'
import { useFormContext } from '../form/form-context'

/**
 * Options for the FormField context.
 */
export interface FormFieldContextOptions {
  /**
   * The current error message or element for the field.
   */
  error?: boolean | string | JSX.Element

  /**
   * The name of the field (key in form state).
   */
  name?: string

  /**
   * The path of the field in the form state.
   */
  path?: string[]

  /**
   * The size of the form field.
   */
  size?: FormFieldSize

  /**
   * Whether to trigger validation eagerly on input.
   */
  eagerValidation?: boolean

  /**
   * Delay in milliseconds for debounced input validation.
   */
  validateOnInputDelay?: number

  /**
   * Hint text shown near the label.
   */
  hint?: JSX.Element

  /**
   * Description text shown below the label.
   */
  description?: JSX.Element

  /**
   * Help text shown below the control (when no error).
   */
  help?: JSX.Element

  /**
   * Base ID used for ARIA attributes.
   */
  ariaId: string

  /**
   * The ID of the primary control element.
   */
  controlId?: string

  /**
   * Register a control element with the field.
   */
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
  deferInputValidation?: boolean
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
  emit: (type: FormInputEventType) => void
}

export type FormFieldSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const [FormFieldProvider, useFormFieldContext] =
  createContextProvider<FormFieldContextOptions | null>('FormField', null)

const EMPTY_RUNTIME_STATE: FormFieldRuntimeState = {
  touched: false,
  dirty: false,
  focused: false,
  validating: false,
}

export function useFormField(
  props: Accessor<UseFormFieldProps> | undefined,
  opts: Accessor<UseFormFieldOptions>,
): UseFormFieldReturn {
  const formContext = useFormContext()
  const formField = useFormFieldContext()

  const options = createMemo(() => {
    const value = opts()

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
  const localId = createMemo(() => fieldProps().id ?? options().defaultId)

  if (formField?.registerControl) {
    const unregister = formField.registerControl({
      id: localId,
      bind,
    })
    onCleanup(unregister)
  }

  const id = createMemo(() => fieldProps().id ?? formField?.controlId ?? options().defaultId)
  const name = createMemo(() => fieldProps().name ?? formField?.name)
  const value = createMemo(() => {
    if (!formContext) {
      return undefined
    }

    const fieldPath = formField?.path
    if (fieldPath) {
      return formContext.getFieldValue(fieldPath)
    }

    const fieldName = name()
    if (!fieldName) {
      return undefined
    }

    return formContext.getFieldValue(fieldName)
  })
  const size = createMemo(() => fieldProps().size ?? formField?.size ?? options().defaultSize)
  const disabled = createMemo(() => Boolean(formContext?.disabled || fieldProps().disabled))
  const invalid = createMemo(() => Boolean(formField?.error))
  const runtimeState = createMemo(() => formContext?.getFieldState(name()) ?? EMPTY_RUNTIME_STATE)

  let inputTimer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => {
    if (inputTimer) {
      clearTimeout(inputTimer)
      inputTimer = undefined
    }
  })

  function emitFormEvent(type: FormInputEventType, eager?: boolean): void {
    if (!formContext) {
      return
    }

    formContext.emitInputEvent({
      type,
      name: formField?.path,
      eager,
    })
  }

  function emit(type: FormInputEventType): void {
    if (type !== 'input') {
      emitFormEvent(type)
      return
    }

    const delay = formField?.validateOnInputDelay ?? formContext?.validateOnInputDelay ?? 300
    const eagerValidation = Boolean(!options().deferInputValidation || formField?.eagerValidation)

    if (inputTimer) {
      clearTimeout(inputTimer)
    }

    inputTimer = setTimeout(() => {
      emitFormEvent('input', eagerValidation)
    }, delay)
  }

  function setFormValue(value: unknown): void {
    if (!formContext) {
      return
    }

    const fieldPath = formField?.path
    if (fieldPath) {
      formContext.setFieldValue(fieldPath, value)
      return
    }

    const fieldName = name()
    if (!fieldName) {
      return
    }

    formContext.setFieldValue(fieldName, value)
  }

  onMount(() => {
    const initValue = opts().initialValue
    if (initValue === undefined || value() !== undefined) {
      return
    }

    setFormValue(initValue)
  })

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
    value,
    size,
    disabled,
    invalid,
    ariaAttrs,
    runtimeState,
    setFormValue,
    emit,
  } satisfies UseFormFieldReturn
}
