import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export namespace CardT {
  export interface Slot<T = unknown> {
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

  export interface Variant {
    compact?: boolean
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the Card component.
   */
  export interface Base {
    /**
     * Whether to use a compact layout.
     * @default false
     */
    compact?: boolean

    /**
     * Title of the card.
     */
    title?: JSX.Element

    /**
     * Description of the card.
     */
    description?: JSX.Element

    /**
     * Actions of the card.
     */
    action?: JSX.Element

    /**
     * Header of the card.
     */
    header?: JSX.Element

    /**
     * Footer of the card.
     */
    footer?: JSX.Element

    /**
     * Children of the card.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Card component.
   */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Card component.
 */
export interface CardProps extends CardT.Props {}
