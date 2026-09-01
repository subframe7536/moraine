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
