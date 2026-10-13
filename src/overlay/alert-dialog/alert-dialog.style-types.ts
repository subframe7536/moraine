import type { ComponentStyleConfig } from '../../theme/types'

export interface AlertDialogStyleSlot<T = unknown> {
  /** Dialog panel. */
  content?: T
  /** Icon, title, and description row. */
  header?: T
  /** Type or custom icon. */
  icon?: T
  /** Title and description stack. */
  copy?: T
  /** Action region. */
  footer?: T
  /** OK and cancel actions. */
  action?: T
}

export interface AlertDialogStyleVariant {
  /**
   * Centers the icon, title, and description, and stretches the actions into an equal row.
   * @default false
   */
  center?: boolean
  /**
   * Shows a caution icon when `type` is `default`, and styles the primary action as `danger`
   * when its variant is omitted.
   * @default false
   */
  danger?: boolean
  /**
   * Gives the footer a top border and muted background, like Card's `subtle` variant.
   * @default false
   */
  subtle?: boolean
}

export type AlertDialogStyleConfig = ComponentStyleConfig<
  AlertDialogStyleSlot,
  AlertDialogStyleVariant
>
