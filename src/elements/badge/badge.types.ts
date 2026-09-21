import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { IconT } from '../icon'

import type { BadgeStyleSlot, BadgeStyleVariant } from './badge.style-types'

export namespace BadgeT {
  export type Kind = 'single'

  export type Slot<T = unknown> = BadgeStyleSlot<T>

  export type Variant = BadgeStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * Base props for the Badge component.
   */
  export interface Base {
    /** Accessible title shown by the browser for the badge root. */
    title?: string

    /**
     * Leading icon name.
     */
    leading?: IconT.Name

    /**
     * Trailing icon name.
     */
    trailing?: IconT.Name

    /**
     * Children of the badge.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Badge component.
   */
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/**
 * Props for the Badge component.
 */
export type BadgeProps = BadgeT.Props
