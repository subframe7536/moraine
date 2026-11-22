import type { ComponentSize } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface AvatarGroupStyleSlot<T = unknown> {
  /** Container of grouped avatars. */
  root?: T

  /** Individual avatar wrapper used when rendering grouped avatars. */
  item?: T

  /** Count indicator shown when a group has more avatars than the visible limit. */
  count?: T

  /** Loaded avatar image rendered inside each frame. */
  image?: T

  /** Fallback layer of each avatar, shown while its image is loading, missing, or failed. */
  fallback?: T

  /** Fallback icon of each avatar whose item sets `icon`. */
  fallbackIcon?: T

  /** Status or indicator badge anchored to an avatar frame. */
  badge?: T
}

export interface AvatarGroupStyleVariants {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
}

export type AvatarGroupStyleConfig = ComponentStyleConfig<
  AvatarGroupStyleSlot,
  AvatarGroupStyleVariants
>
