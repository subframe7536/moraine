import type { OverlayAlign } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'

export interface ToastStyleSlot<T = unknown> {
  /** Fixed, corner-anchored live region (role="region") that hosts the toast stacks. */
  root?: T

  /** Positioned list container for one placement/align stack. */
  list?: T

  /** Outer container for an individual toast notification. */
  item?: T

  /** Main content wrapper containing title and description. */
  wrapper?: T

  /** Primary notification title. */
  title?: T

  /** Supporting notification message or description. */
  description?: T

  /** Status or custom visual icon indicator. */
  icon?: T

  /** Close dismiss button. */
  close?: T

  /** Actions wrapper containing cancel and action buttons. */
  actions?: T

  /** Primary call-to-action button. */
  action?: T

  /** Secondary cancel/dismiss button. */
  cancel?: T

  /** Auto-dismiss duration progress indicator. */
  progress?: T
}

export interface ToastStyleVariant {
  /**
   * Visual status variant.
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'loading'

  /**
   * Layout size variant.
   * @default 'default'
   */
  size?: 'default' | 'large'

  /**
   * Whether to invert colors (e.g. dark toast on light theme).
   * @default false
   */
  invert?: boolean

  /**
   * Vertical stack placement on the viewport.
   * @default 'bottom'
   */
  placement?: 'top' | 'bottom'

  /**
   * Horizontal alignment of the stack.
   * @default 'end'
   */
  align?: OverlayAlign
}

export type ToastStyleConfig = ComponentStyleConfig<ToastStyleSlot, ToastStyleVariant>
