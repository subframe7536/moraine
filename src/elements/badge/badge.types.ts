import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { IconT } from '../icon'

export namespace BadgeT {
  export type Kind = 'single'

  export interface Slot<T = unknown> {
    /**
     * Inline badge container that carries the variant, size, and interactive state.
     */
    root?: T

    /** Optional icon displayed before the badge label. */
    leading?: T

    /** Badge text or children content between the optional visuals. */
    label?: T

    /** Optional trailing icon displayed after the label. */
    trailing?: T
  }

  export interface Variant {
    /** Visual treatment of the component.
     * @default 'default'
     */
    variant?: 'default' | 'outline' | 'solid' | 'subtle'
    /** Visual size of the component.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

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
export interface BadgeProps extends BadgeT.Props {}
