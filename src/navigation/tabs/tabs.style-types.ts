export interface TabsStyleSlot<T = unknown> {
  /**
   * Tabs container that owns tab selection and panel rendering.
   */
  root?: T

  /** Tablist that contains all tab triggers and the selection indicator. */
  list?: T

  /** Moving indicator aligned with the active tab trigger. */
  indicator?: T

  /** Tab button users activate to select a panel. */
  trigger?: T

  /** Optional icon rendered before a tab label. */
  leading?: T

  /** Text or custom label rendered inside a tab trigger. */
  label?: T

  /** Optional trailing content rendered after a tab label. */
  trailing?: T

  /** Tab panel rendered for the selected item. */
  content?: T
}

export interface TabsStyleVariant {
  /** Layout axis used by the component Recipe. */
  orientation?: 'horizontal' | 'vertical'

  /** Visual treatment of the component.
   * @default 'pill'
   */
  variant?: 'pill' | 'link'
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}
