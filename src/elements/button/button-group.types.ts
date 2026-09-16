import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { SeparatorT } from '../separator/separator.types'

import type { ButtonT } from './button.types'

export namespace ButtonGroupT {
  export type Kind = 'composite'

  export interface Slot<T = unknown> {
    /** Container that joins the edges of its direct button children. */
    root?: T

    /** Explicit divider between adjacent ButtonGroup parts. */
    separator?: T
  }
  export interface Variant extends ButtonT.Variant {
    /** Visual layout direction.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'
  }

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
  export type SeparatorProps = BaseProps<'div', SeparatorBase, SeparatorT.Variant, Classes, Styles>

  /** Props for the ButtonGroup component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the ButtonGroup component. */
export type ButtonGroupProps = ButtonGroupT.Props
