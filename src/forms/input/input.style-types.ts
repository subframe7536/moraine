import type {
  ComponentSize,
  Orientation,
  TextControlVariant,
} from '../../theme/style/style-types.ts'

export interface InputStyleSlot<T = unknown> {
  /** Native text input element. */
  root?: T
}

export interface InputStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Visual treatment of the component.
   * @default 'outline'
   */
  variant?: TextControlVariant
}

export interface InputRecipeVariant extends InputStyleVariant {
  /** Internal presentation selected when InputGroup supplies the outer frame. */
  grouped?: boolean
  /** Internal axis inherited from InputGroup. */
  groupedOrientation?: Orientation
}
