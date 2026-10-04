import type { ComponentStyleConfig } from '../../theme/types'

export interface EmptyStyleSlot<T = unknown> {
  /** Empty-state container. */
  root?: T
  /** Optional icon, avatar, image, or custom content. */
  media?: T
  /** Main message. */
  title?: T
  /** Supporting text. */
  description?: T
  /** Action controls. */
  actions?: T
}

export interface EmptyStyleVariant {
  /** Density and typography of all Empty parts. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
}

export type EmptyStyleConfig = ComponentStyleConfig<EmptyStyleSlot, EmptyStyleVariant>
