export interface FormIdentityOptions {
  id?: string
  name?: string
}

export interface FormDisableOption {
  disabled?: boolean
}

export interface FormRequiredOption {
  required?: boolean
}

export interface FormValueOptions<T> {
  value?: T
  defaultValue?: T
}

export interface FormReadOnlyOption {
  readOnly?: boolean
}

export const FORM_ID_NAME_DISABLED_KEYS = ['id', 'name', 'disabled'] as const

export const FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS = [
  'id',
  'name',
  'value',
  'defaultValue',
  'required',
  'disabled',
] as const

export const FORM_ID_NAME_DISABLED_ON_CHANGE_KEYS = ['id', 'name', 'disabled', 'onChange'] as const

export const FORM_INPUT_INTERACTION_KEYS = ['onBlur', 'onFocus'] as const
