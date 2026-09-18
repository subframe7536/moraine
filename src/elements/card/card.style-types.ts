export interface CardStyleSlot<T = unknown> {
  /**
   * Card container that frames the header, body, and footer regions.
   */
  root?: T

  /** Top region for title, description, custom header content, and actions. */
  header?: T

  /** Primary heading rendered in the card header. */
  title?: T

  /** Supporting text rendered below the card title. */
  description?: T

  /** Header action region, typically used for buttons or menus. */
  action?: T

  /** Main content region for the card children. */
  body?: T

  /** Bottom region for secondary actions or summary content. */
  footer?: T
}

export interface CardStyleVariant {
  /** Visual compact of the component.
   * @default false
   */
  compact?: boolean
}
