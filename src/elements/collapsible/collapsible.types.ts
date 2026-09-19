import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'

import type { CollapsibleStyleSlot, CollapsibleStyleVariant } from './collapsible.style-types'

export namespace CollapsibleT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = CollapsibleStyleSlot<T>

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type TriggerBase<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T
    /** Whether this trigger is disabled. */
    disabled?: boolean
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
    /**
     * Element or component to render inner content as.
     * @default 'div'
     */
    as?: T

    /**
     * Whether to unmount content when closed.
     * @default true
     */
    unmountOnHide?: boolean

    /**
     * Force mounting the content in the DOM even when closed.
     * @default false
     */
    forceMount?: boolean

    /** Additional class applied to the outer animated height wrapper. */
    wrapperClass?: string

    /** Additional style applied to the outer animated height wrapper. */
    wrapperStyle?: JSX.CSSProperties

    /** Ref callback for the outer animated height wrapper element. */
    wrapperRef?: (element: HTMLDivElement) => void

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

  export type Variant = CollapsibleStyleVariant

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
  export type Props = BaseProps<'div', Base, never, Classes, Styles>
}

/**
 * Props for the Collapsible component.
 */
export interface CollapsibleProps extends CollapsibleT.Props {}
