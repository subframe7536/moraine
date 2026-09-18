export interface BreadcrumbStyleSlot<T = unknown> {
  /**
   * Navigation container for the breadcrumb trail.
   */
  root?: T

  /** Ordered list that contains breadcrumb items and separators. */
  list?: T

  /** Wrapper for one breadcrumb entry. */
  item?: T

  /** Clickable breadcrumb target for navigable entries. */
  link?: T

  /** Current page entry. */
  page?: T

  /** Optional icon rendered before a breadcrumb label. */
  leading?: T

  /** Breadcrumb item label text. */
  label?: T

  /** Visual divider between breadcrumb entries. */
  separator?: T
}

export interface BreadcrumbStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Visual wrap of the component.
   * @default true
   */
  wrap?: boolean
}
