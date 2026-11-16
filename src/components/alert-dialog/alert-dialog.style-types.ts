import type { ComponentStyleConfig } from '../../theme/types'

export interface AlertDialogStyleSlot<T = unknown> {
  /** Dialog panel. */
  content?: T
  /** Icon, title, and description row. */
  header?: T
  /** Type or custom icon. */
  icon?: T
  /** Title and description stack. */
  wrapper?: T
  /** Action region. */
  footer?: T
  /** Primary (OK) action. */
  action?: T
  /** Cancel action. */
  cancel?: T
}

export interface AlertDialogStyleVariants {
  /**
   * Centers the icon, title, and description, and stretches the actions into an equal row.
   * @default 'start'
   */
  align?: 'start' | 'center'
  /**
   * `subtle` gives the footer a top border and muted background, like Card's `subtle` variant.
   * @default 'default'
   */
  variant?: 'default' | 'subtle'
}

export type AlertDialogStyleConfig = ComponentStyleConfig<
  AlertDialogStyleSlot,
  AlertDialogStyleVariants
>
