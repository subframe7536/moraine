export interface CollapsibleStyleSlot<T = unknown> {
  /** Container that owns the trigger and expandable content. */
  root?: T

  /** Interactive element that toggles the content. */
  trigger?: T

  /** Public region containing the collapsible content. */
  content?: T
}

export type CollapsibleStyleVariant = never
