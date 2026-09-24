import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'
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
  export interface Base<T extends ValidComponent = 'span'> {
    /**
     * Root element or component.
     * @default 'span'
     */
    as?: T

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
  export type Props<T extends ValidComponent = 'span'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles,
    'span'
  >
}

/**
 * Props for the Badge component.
 */
export type BadgeProps<T extends ValidComponent = 'span'> = BadgeT.Props<T>
