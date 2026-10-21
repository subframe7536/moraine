import type { ComponentStyleConfig } from '../../theme/types'

export interface AlertStyleSlot<T = unknown> {
  /** Outer container for the alert banner or message box. */
  root?: T

  /** Leading visual or status icon indicator. */
  icon?: T

  /** Main content wrapper containing title, description, and children. */
  content?: T

  /** Primary alert title or heading. */
  title?: T

  /** Supporting alert description text. */
  description?: T

  /** Dismiss button. */
  close?: T
}

export interface AlertStyleVariants {
  /**
   * Semantic intent of the alert.
   * @default 'default'
   */
  type?: 'default' | 'info' | 'success' | 'warning' | 'error'

  /**
   * Visual surface variant.
   * @default 'subtle'
   */
  variant?: 'subtle' | 'soft' | 'outline' | 'solid'

  /**
   * Whether to display as an edge-to-edge banner with flat borders.
   * @default false
   */
  fullWidth?: boolean

  /**
   * Context variant indicating whether multi-line description is present.
   * Controls compact single-line vs multi-line layout and icon scale.
   */
  hasDescription?: boolean
}

export type AlertStyleConfig = ComponentStyleConfig<AlertStyleSlot, AlertStyleVariants>
