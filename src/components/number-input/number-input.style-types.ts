import type { ComponentSize, Orientation, TextControlVariant } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface NumberInputStyleSlot<T = unknown> {
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

export interface NumberInputStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual treatment of the component.
   * @default 'outline'
   */
  variant?: TextControlVariant
  /**
   * Text alignment of the input. When omitted, the text is start-aligned in a `horizontal` input
   * without a decrement button (`decrement={false}`) and centered otherwise.
   */
  textAlign?: 'start' | 'center' | 'end'
  /** Visual layout direction.
   * @default 'horizontal'
   */
  orientation?: Orientation
}

export type NumberInputStyleConfig = ComponentStyleConfig<
  NumberInputStyleSlot,
  NumberInputStyleVariants
>
