import type { ComponentSize } from '../../theme/style-types'
import type { Tone } from '../../theme/tokens'
import type { ComponentStyleConfig } from '../../theme/types'

export interface PinInputStyleSlot<T = unknown> {
  /**
   * Root wrapper containing all pin input fields and separators.
   */
  root?: T

  /**
   * Individual pin input element.
   */
  input?: T

  /**
   * Optional separator element inserted between pin input groups.
   */
  separator?: T
}

export interface PinInputStyleVariants {
  /**
   * Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize

  /**
   * Visual treatment of the component.
   * @default 'outline'
   */
  variant?: 'outline' | 'subtle' | 'ghost' | 'none'

  /**
   * Color tone of the component.
   * @default 'primary'
   */
  tone?: Tone

  /**
   * Force focus ring highlight state.
   */
  highlight?: boolean

  /**
   * Keep the fixed text size on all breakpoints.
   */
  fixed?: boolean
}

export type PinInputStyleConfig = ComponentStyleConfig<PinInputStyleSlot, PinInputStyleVariants>
