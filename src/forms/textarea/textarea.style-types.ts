import type { Orientation } from '../../shared/style/style-types.ts'

export interface TextareaStyleSlot<T = unknown> {
  /** Native textarea element. */
  root?: T
}

export interface TextareaStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Visual treatment of the component.
   * @default 'outline'
   */
  variant?: 'outline' | 'subtle' | 'ghost' | 'none'
}

export interface TextareaRecipeVariant extends TextareaStyleVariant {
  /** Internal presentation selected when InputGroup supplies the outer frame. */
  grouped?: boolean
  /** Internal axis inherited from InputGroup. */
  groupedOrientation?: Orientation
}
