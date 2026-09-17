export interface BaseSelectStyleSlot<T = unknown> {
  /** Optional non-interactive layout container and floating anchor. */
  control?: T
  /** Primary select-like popup activator. */
  trigger?: T
  /** Floating popup panel. */
  content?: T
  /** Scrollable listbox. */
  listbox?: T
  /** Selectable row. */
  item?: T
  /** Group container. */
  group?: T
  /** Group heading. */
  groupLabel?: T
  /** Decorative divider. */
  separator?: T
  /** Empty collection message. */
  empty?: T
}

export interface BaseSelectStyleVariant {
  /** Popup and item size. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
}
