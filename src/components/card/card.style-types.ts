import type { ComponentStyleConfig } from '../../theme/types'

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

export interface CardStyleVariants {
  /**
   * Surface treatment. `outline` draws the outer border and shadow and a footer divider; `subtle`
   * adds a muted footer background to that; `none` drops the outer border, shadow, and footer
   * divider, for a card nested in another bordered surface.
   * @default 'outline'
   */
  variant?: 'outline' | 'subtle' | 'none'
  /** Density of all Card parts. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
}

export type CardStyleConfig = ComponentStyleConfig<CardStyleSlot, CardStyleVariants>
