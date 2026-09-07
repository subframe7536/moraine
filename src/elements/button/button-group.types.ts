import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { ButtonT } from './button.types.ts'

export namespace ButtonGroupT {
  export interface Slot<T = unknown> {
    /** Container that joins the edges of its direct button children. */
    root?: T
    /** Separator element between buttons. */
    separator?: T
  }
  export interface Variant extends ButtonT.Variant {
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
    /** Whether to render a decorative separator between adjacent controls. */
    separator?: boolean
  }

  /** Props for the ButtonGroup component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the ButtonGroup component. */
export type ButtonGroupProps = ButtonGroupT.Props
