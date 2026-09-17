export interface AvatarGroupStyleSlot<T = unknown> {
  /** Container of grouped avatars. */
  root?: T

  /** Individual avatar wrapper used when rendering grouped avatars. */
  item?: T

  /** Count indicator shown when a group has more avatars than the visible limit. */
  count?: T

  /** Loaded avatar image rendered inside each frame. */
  image?: T

  /** Text fallback shown while an image is unavailable or failed. */
  fallback?: T

  /** Icon fallback shown when no image or text fallback is available. */
  fallbackIcon?: T

  /** Status or indicator badge anchored to an avatar frame. */
  badge?: T
}

export interface AvatarGroupStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}
