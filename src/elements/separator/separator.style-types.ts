export interface SeparatorStyleSlot<T = unknown> {
  /** Visual divider element. */
  root?: T
}

export interface SeparatorStyleVariant {
  /** Layout axis used by the component Recipe. */
  orientation?: 'horizontal' | 'vertical'
}
