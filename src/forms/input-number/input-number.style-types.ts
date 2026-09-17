export interface InputNumberStyleSlot<T = unknown> {
  /**
   * Number input wrapper that owns the input and step controls.
   */
  root?: T

  /** Native number input element. */
  input?: T

  /** Button that increases the current numeric value. */
  increment?: T

  /** Button that decreases the current numeric value. */
  decrement?: T

  /** Column container for vertical increment/decrement controls. */
  controls?: T
}

export interface InputNumberStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Visual treatment of the component.
   * @default 'outline'
   */
  variant?: 'outline' | 'subtle' | 'ghost' | 'none'
  /** Text alignment; omitted values follow the control layout.
   */
  align?: 'center' | 'start'
  /** Visual layout direction.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
}
