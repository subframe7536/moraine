import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { CardStyleSlot, CardStyleVariant } from './card.style-types'

export namespace CardT {
  export type Kind = 'single'

  export type Slot<T = unknown> = CardStyleSlot<T>

  export type Variant = CardStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

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
export type CardProps = CardT.Props
