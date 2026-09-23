import type { ComponentSize } from '../../theme/style/style-types.ts'
export interface AvatarStyleSlot<T = unknown> {
  /** Avatar frame that controls size, shape, image, fallback, and badge placement. */
  root?: T

  /** Loaded avatar image rendered inside the frame. */
  image?: T

  /** Text fallback shown while the image is unavailable or failed. */
  fallback?: T

  /** Icon fallback shown when no image or text fallback is available. */
  fallbackContent?: T

  /** Status or indicator badge anchored to the avatar frame. */
  badge?: T
}

export interface AvatarStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /** Position of the badge relative to the avatar.
   * @default 'bottom-right'
   */
  badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
