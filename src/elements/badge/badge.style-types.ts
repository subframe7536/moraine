export interface BadgeStyleSlot<T = unknown> {
  /**
   * Inline badge container that carries the variant, size, and interactive state.
   */
  root?: T

  /** Optional icon displayed before the badge label. */
  leading?: T

  /** Badge text or children content between the optional visuals. */
  label?: T

  /** Optional trailing icon displayed after the label. */
  trailing?: T
}

export interface BadgeStyleVariant {
  /** Visual treatment of the component.
   * @default 'subtle'
   */
  variant?: 'solid' | 'subtle' | 'surface' | 'outline'
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}

export interface BadgeRecipeVariant extends BadgeStyleVariant {
  square?: boolean
}
