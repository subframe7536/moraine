import { createContextProvider } from '../../shared/create-context-provider'

export type FormInputEventType = 'blur' | 'change' | 'focus' | 'input'

export interface FormInputEvent {
  type: FormInputEventType
  name?: string | string[]
  eager?: boolean
}

export interface FormInputMeta {
  id?: string
}

export interface FormValidationError {
  name?: string | string[]
  message: string
  id?: string
}

export interface FormFieldRuntimeState {
  touched: boolean
  dirty: boolean
  focused: boolean
  validating: boolean
}

export interface FormContextValue {
  disabled: boolean
  loading: boolean
  errors: FormValidationError[]
  validateOn: FormInputEventType[]
  validateOnInputDelay: number
  registerInput: (name: string | string[], meta: FormInputMeta) => void
  unregisterInput: (name: string | string[]) => void
  getInputMeta: (name: string | string[]) => FormInputMeta | undefined
  getFieldState: (name?: string | string[]) => FormFieldRuntimeState
  setFieldValue: (name: string | string[], value: unknown) => void
  emitInputEvent: (event: FormInputEvent) => void
  setErrors: (errors: FormValidationError[]) => void
}

export const [FormProvider, useFormContext] = createContextProvider<FormContextValue | null>(
  'Form',
  null,
)
