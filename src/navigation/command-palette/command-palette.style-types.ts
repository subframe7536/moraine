export interface CommandPaletteStyleSlot<T = unknown> {
  /**
   * Command palette container that owns search and option list.
   */
  root?: T

  /** Search row that groups input, search icon, and dismiss controls. */
  inputWrapper?: T

  /** Search input used to filter commands. */
  input?: T

  /** Scrollable command list that owns option and active-descendant semantics. */
  listbox?: T

  /** Bottom region for keyboard hints or custom footer content. */
  footer?: T

  /** Section wrapper for a group of command items. */
  group?: T

  /** Group heading text. */
  groupLabel?: T

  /** Command row that can be highlighted, selected, or disabled. */
  item?: T

  /** Leading region for a command row. */
  itemLeading?: T

  /** Text column that groups command label and description. */
  itemWrapper?: T

  /** Primary text for a command item. */
  itemLabel?: T

  /** Supporting text for a command item. */
  itemDescription?: T

  /** Trailing region for shortcuts or custom item metadata. */
  itemTrailing?: T

  /** Search icon or loading indicator displayed in the input row. */
  inputLeading?: T

  /** Button that dismisses the command palette. */
  close?: T

  /** Message shown when no command items match the search. */
  empty?: T
}

export interface CommandPaletteStyleVariant {
  /** Where descriptions render in each command item.
   * @default 'bottom'
   */
  descriptionPosition?: 'bottom' | 'trailing'
}
