export interface ButtonStyleSlot<T = unknown> {
  /**
   * Interactive button element, or the polymorphic element provided through `as`.
   */
  root?: T

  /** Loading icon shown while the button is busy. */
  loading?: T

  /** Icon region before the button label. */
  leading?: T

  /** Button content region after render-prop resolution. */
  label?: T

  /** Icon region after the button label. */
  trailing?: T
}

export interface ButtonStyleVariant {
  /** Visual treatment of the component.
   * @default 'default'
   */
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
  /** Visual size of the component.
   * @default 'md'
   */
  size?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'icon-xs'
    | 'icon-sm'
    | 'icon-md'
    | 'icon-lg'
    | 'icon-xl'
    | null
}
