import type { ComponentStyleConfig } from '../../theme/types'

export interface ToasterStyleSlot<T = unknown> {
  /** Outer container for an individual toast notification. */
  root?: T

  /** Main content wrapper containing title and description. */
  content?: T

  /** Primary notification title. */
  title?: T

  /** Supporting notification message or description. */
  description?: T

  /** Status or custom visual icon indicator. */
  icon?: T

  /** Close dismiss button. */
  close?: T

  /** Primary call-to-action button. */
  action?: T

  /** Secondary cancel/dismiss button. */
  cancel?: T

  /** Auto-dismiss duration progress indicator. */
  progress?: T
}

export interface ToasterStyleVariant {
  /**
   * Visual status variant.
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'loading'

  /**
   * Whether to invert colors (e.g. dark toast on light theme).
   * @default false
   */
  invert?: boolean
}

export type ToasterStyleConfig = ComponentStyleConfig<ToasterStyleSlot, ToasterStyleVariant>
