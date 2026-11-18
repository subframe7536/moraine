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
   * Layout of the dialog content. `start` places the icon beside a start-aligned title and
   * description, with the actions in the regular dialog footer. `center` stacks the icon above a
   * centered title and description, and stretches the action and cancel buttons into one row of
   * equal-width buttons.
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
