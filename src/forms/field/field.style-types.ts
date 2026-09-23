import type { ComponentSize } from '../../theme/style/style-types.ts'
export interface FieldStyleSlot<T = unknown> {
  /** Field wrapper that links label, control, description, and messages. */
  root?: T

  /** Inner wrapper that arranges label, control, helper text, and messages. */
  wrapper?: T

  /** Row that groups the field label and optional hint. */
  labelWrapper?: T

  /** Accessible field label associated with the control. */
  label?: T

  /** Region that contains the wrapped form control. */
  container?: T

  /** Helper text associated with the control. */
  description?: T

  /** Validation error message region for the field. */
  error?: T

  /** Short hint rendered beside the field label. */
  hint?: T

  /** Additional guidance rendered below the control. */
  help?: T
}

export interface FieldStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual layout direction.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal'
}
