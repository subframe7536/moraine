import type { ComponentStyleConfig } from '../../theme/types'

export interface ButtonStyleSlot<T = unknown> {
  /**
   * Interactive button element, or the polymorphic element provided through `as`.
   */
  root?: T

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
  /**
   * Press motion while the button is active.
   * `'move-down'` and `'zoom-in'` skip the motion when the root has `aria-haspopup`.
   * Pass a function to return a class string from the rendered element.
   * @default 'move-down'
   */
  activeEffect?: 'none' | 'move-down' | 'zoom-in' | ((element: HTMLElement) => string)
}

export type ButtonStyleConfig = ComponentStyleConfig<ButtonStyleSlot, ButtonStyleVariant>
