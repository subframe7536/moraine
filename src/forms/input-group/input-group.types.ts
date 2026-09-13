import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { InputT } from '../input/input.types.ts'

export namespace InputGroupT {
  export type Kind = 'composite'

  export interface Slot<T = unknown> {
    /** Shared frame around one Input or Textarea and its supporting content. */
    root?: T
    /** Content at the logical start or above the control. */
    leading?: T
    /** Content at the logical end or below the control. */
    trailing?: T
  }

  export interface Variant extends InputT.Variant {
    /** Axis shared by the group and its supporting parts.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'
  }
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {
    /** Place the control before supporting content in DOM order. */
    children?: JSX.Element
  }
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>

  export interface PartVariant {
    /** Removes the padding between this part and the adjacent control.
     * @default false
     */
    compact?: boolean
  }

  export interface PartBase {
    /** Icons, text, buttons, or other caller-owned content. */
    children?: JSX.Element
  }
  export type LeadingProps = BaseProps<'div', PartBase, PartVariant, never, never>
  export type TrailingProps = BaseProps<'div', PartBase, PartVariant, never, never>
}

export type InputGroupProps = InputGroupT.Props
