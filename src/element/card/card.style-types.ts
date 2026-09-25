export interface CardStyleSlot<T = unknown> {
  /** Card surface. */
  root?: T
  /** Header region. */
  header?: T
  /** Header title. */
  title?: T
  /** Supporting text below the title. */
  description?: T
  /** Header action region. */
  action?: T
  /** Main content region. */
  body?: T
  /** Footer region. */
  footer?: T
}

export interface CardStyleVariant {
  /** Footer border and background. The outer border is always present. @default 'outline' */
  variant?: 'outline' | 'subtle' | 'none'
  /** Density of all Card parts. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
}
