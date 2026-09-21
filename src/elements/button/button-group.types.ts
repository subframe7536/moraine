import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { SeparatorT } from '../separator/separator.types'

import type { ButtonGroupStyleSlot, ButtonGroupStyleVariant } from './button-group.style-types'

export namespace ButtonGroupT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = ButtonGroupStyleSlot<T>
  export type Variant = ButtonGroupStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /** Base props for the ButtonGroup component. */
  export interface Base {
    /** Optional identifier for the group root. */
    id?: string
    /** ARIA role for the group root. */
    role?: JSX.AriaAttributes['role']
    /** Buttons or compatible controls rendered as a cohesive group. */
    children?: JSX.Element
  }

  /** Base props for the ButtonGroup.Separator component. */
  export interface SeparatorBase extends Omit<SeparatorT.Base, 'orientation'> {
    /**
     * The orientation of the separator.
     * @default 'vertical'
     */
    orientation?: SeparatorT.Variant['orientation']
  }

  /** Props for the ButtonGroup.Separator component. */
  export type SeparatorProps = BaseProps<'div', SeparatorBase, SeparatorT.Variant, never, never>

  /** Props for the ButtonGroup component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the ButtonGroup component. */
export type ButtonGroupProps = ButtonGroupT.Props
