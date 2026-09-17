export interface CollapsibleStyleSlot<T = unknown> {
  /** Container that owns the trigger and expandable content. */
  root?: T
  /** Interactive element that toggles the content. */
  trigger?: T
  /** Outer wrapper that measures and animates the content height. */
  contentWrapper?: T
  /** Inner region that renders the collapsible content. */
  content?: T
}

export type CollapsibleStyleVariant = never
