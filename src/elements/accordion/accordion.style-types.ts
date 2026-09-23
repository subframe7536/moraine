export interface AccordionStyleSlot<T = unknown> {
  /**
   * Container that owns the accordion item collection and shared state attributes.
   */
  root?: T

  /** Wrapper for one accordion entry, including its header trigger and collapsible panel. */
  item?: T

  /** Heading row that contains the interactive trigger for an item. */
  header?: T

  /** Button users activate to expand or collapse an item. */
  trigger?: T

  /** Optional icon or visual placed before the item label. */
  leading?: T

  /** Text label displayed inside the item trigger. */
  label?: T

  /** Optional icon placed after the label, commonly used for the disclosure indicator. */
  trailing?: T

  /** Panel that contains the item content when expanded. */
  content?: T

  /** Inner container inside the collapsible panel for padding. */
  body?: T
}

export type AccordionStyleVariant = never
