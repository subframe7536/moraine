import type { JSX } from '@solidjs/web'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { BadgeStyleSlot, BadgeStyleVariants } from './badge.style-types'
export namespace BadgeT {
  export type Kind = 'single'

  export type Slot<T = unknown> = BadgeStyleSlot<T>

  export type Variants = BadgeStyleVariants

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

    /**
     * Name of an icon rendered before the label. A badge with exactly one icon (`leading` or
     * `trailing`) and no children renders as a square icon badge.
     */
    leading?: IconT.Name

    /**
     * Name of an icon rendered after the label. A badge with exactly one icon (`leading` or
     * `trailing`) and no children renders as a square icon badge.
     */
    trailing?: IconT.Name

    /**
     * Label content. Empty content renders no label element.
     */
    children?: JSX.Element
  }

  /**
   * Props for the Badge component.
   */
  export type Props<T extends ValidComponent = 'span'> = BaseProps<
    T,
    Base<T>,
    Variants,
    Classes,
    Styles,
    'span'
  >
}

/**
 * Props for the Badge component.
 */
export type BadgeProps<T extends ValidComponent = 'span'> = BadgeT.Props<T>
