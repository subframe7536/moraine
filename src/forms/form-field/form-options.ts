export interface FormIdentityOptions {
  /**
   * The ID of the input element.
   */
  id?: string
  /**
   * The name of the input element, used for form submission.
   */
  name?: string
}

export interface FormDisableOption {
  /**
   * Whether the input is disabled.
   * @default false
   */
  disabled?: boolean
}

export interface FormRequiredOption {
  /**
   * Whether the input is required.
   * @default false
   */
  required?: boolean
}

export interface FormValueOptions<T> {
  /**
   * The current value of the input (controlled).
   */
  value?: T
  /**
   * The default value of the input (uncontrolled).
   */
  defaultValue?: T
}

export interface FormReadOnlyOption {
  /**
   * Whether the input is read-only.
   * @default false
   */
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
