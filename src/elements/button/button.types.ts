import type { JSX, ValidComponent } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { IconT } from '../icon/index.ts'

type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never

type ButtonElementFor<T extends ValidComponent> =
  IsUnion<T> extends true
    ? HTMLElement
    : T extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[T]
      : HTMLElement

export namespace ButtonT {
  export type ElementFor<T extends ValidComponent> = ButtonElementFor<T>

  export interface Slot<T = unknown> {
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

  export interface Variant {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'
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
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Button component.
   */
  export type Base<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T

    /** Native type attribute for supported native roots. */
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : never

    /**
     * Disabled state, including for non-button polymorphic roots.
     */
    disabled?: boolean

    onClick?: JSX.EventHandlerUnion<ButtonElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<ButtonElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<ButtonElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<ButtonElementFor<T>, FocusEvent>
    onPointerDown?: JSX.EventHandlerUnion<ButtonElementFor<T>, PointerEvent>
    onPointerUp?: JSX.EventHandlerUnion<ButtonElementFor<T>, PointerEvent>
    onPointerCancel?: JSX.EventHandlerUnion<ButtonElementFor<T>, PointerEvent>
    onPointerLeave?: JSX.EventHandlerUnion<ButtonElementFor<T>, PointerEvent>
    onContextMenu?: JSX.EventHandlerUnion<ButtonElementFor<T>, MouseEvent>

    /**
     * Root `data-slot` name
     */
    slotName?: string
    /**
     * Controlled loading state.
     * @default false
     */
    loading?: boolean

    /**
     * Auto toggles loading while async click handlers are pending.
     * @default false
     */
    loadingAuto?: boolean

    /**
     * Optional icon shown when `loading` is active.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name

    /**
     * Leading visual content, usually an icon.
     */
    leading?: IconT.Name

    /**
     * Trailing visual content, usually an icon.
     */
    trailing?: IconT.Name

    /**
     * Children of the button. Supports render function form.
     */
    children?: ComponentOrElement<{
      /**
       * Whether the button is currently in loading state.
       */
      loading: boolean
    }>
  } & (T extends 'a'
    ? Pick<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'>
    : {})

  /**
   * Props for the Button component.
   */
  export type Props<T extends ValidComponent = 'button'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the Button component.
 */
export type ButtonProps<T extends ValidComponent = 'button'> = ButtonT.Props<T>
