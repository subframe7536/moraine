import type { ComponentSize, Orientation } from '../../theme/style/style-types.ts'
export interface StepperStyleSlot<T = unknown> {
  /**
   * Stepper container that owns orientation, step state, and panel rendering.
   */
  root?: T

  /** Step navigation header that contains all step triggers. */
  header?: T

  /** One step trigger and its connector. */
  item?: T

  /** Interactive step control users activate to select a step. */
  trigger?: T

  /** Step marker that communicates index, active state, or completion. */
  indicator?: T

  /** Icon rendered inside a completed or custom step indicator. */
  icon?: T

  /** Connector line between adjacent steps. */
  separator?: T

  /** Optional title and description column inside the trigger. */
  wrapper?: T

  /** Primary title text for a step. */
  title?: T

  /** Supporting description for a step. */
  description?: T

  /** Panel rendered for the active step content. */
  content?: T
}

export interface StepperStyleVariant {
  /** Layout axis used by the component Recipe. */
  orientation?: Orientation

  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
}
