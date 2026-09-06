import type { JSX, ValidComponent } from 'solid-js'

import type { BaseProps } from '../../shared/types.ts'

type CollapsibleTriggerElementFor<T extends ValidComponent> = T extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[T]
  : HTMLElement

export namespace CollapsibleT {
  export type TriggerBase<T extends ValidComponent = 'button'> = {
    /** Element or component to render as. @default 'button' */
    as?: T
    type?: T extends 'a'
      ? JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
      : T extends 'button'
        ? JSX.ButtonHTMLAttributes<HTMLButtonElement>['type']
        : T extends 'input'
          ? JSX.InputHTMLAttributes<HTMLInputElement>['type']
          : never
    /** Whether this trigger is disabled. */
    disabled?: boolean
    onClick?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, MouseEvent>
    onKeyDown?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, KeyboardEvent>
    onKeyUp?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, KeyboardEvent>
    onBlur?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, FocusEvent>
    onPointerDown?: JSX.EventHandlerUnion<CollapsibleTriggerElementFor<T>, PointerEvent>
    /** Trigger label and visual content. */
    children?: JSX.Element
  }

  export type TriggerProps<T extends ValidComponent = 'button'> = BaseProps<
    T,
    TriggerBase<T>,
    never,
    never,
    never
  >

  export type ContentBase<T extends ValidComponent = 'div'> = {
    /** Element or component to render inner content as. @default 'div' */
    as?: T
    /** Whether to unmount content when closed. @default true */
    unmountOnHide?: boolean
    /** Force mounting the content in the DOM even when closed. @default false */
    forceMount?: boolean
    /** Additional class applied to the outer animated height wrapper. */
    wrapperClass?: string
    /** Additional style applied to the outer animated height wrapper. */
    wrapperStyle?: JSX.CSSProperties
    /** Ref callback for the outer animated height wrapper element. */
    wrapperRef?: (element: HTMLDivElement | undefined) => void
    /** Content to render. */
    children?: JSX.Element
  }

  export type ContentProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    ContentBase<T>,
    never,
    never,
    never
  >

  export type Variant = never

  export interface Item {}
  /**
   * Base props for the Collapsible component.
   */
  export interface Base {
    /**
     * Unique identifier for the collapsible root element.
     */
    id?: string

    /**
     * Whether the collapsible is open (controlled).
     */
    open?: boolean

    /**
     * Whether the collapsible is open by default (uncontrolled).
     * @default false
     */
    defaultOpen?: boolean

    /**
     * Callback when the open state changes.
     */
    onOpenChange?: (open: boolean) => void

    /**
     * Whether the collapsible is disabled.
     * @default false
     */
    disabled?: boolean

    /**
     * Whether to keep content mounted until its height transition completes.
     * @default false
     */
    transition?: boolean

    /**
     * Whether to unmount collapsible content when closed.
     * @default true
     */
    unmountOnHide?: boolean

    /**
     * Content to render inside the collapsible.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Collapsible component.
   */
  export type Props = BaseProps<'div', Base, never, never, never>
}

/**
 * Props for the Collapsible component.
 */
export interface CollapsibleProps extends CollapsibleT.Props {}
