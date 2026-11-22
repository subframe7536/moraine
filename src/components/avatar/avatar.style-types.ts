import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface AvatarStyleSlot<T = unknown> {
  /** Avatar frame that controls size, shape, image, fallback, and badge placement. */
  root?: T

  /** Loaded avatar image rendered inside the frame. */
  image?: T

  /** Fallback layer shown while the image is loading, missing, or failed; holds the text or icon. */
  fallback?: T

  /** Fallback icon, rendered inside `fallback` in place of the text when `icon` is set. */
  fallbackIcon?: T

  /** Status or indicator badge anchored to the avatar frame. */
  badge?: T
}

export interface AvatarStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Position of the badge relative to the avatar.
   * @default 'bottom-right'
   */
  badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export type AvatarStyleConfig = ComponentStyleConfig<AvatarStyleSlot, AvatarStyleVariants>
