import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type {
  InputGroupRecipeVariant,
  InputGroupStyleSlot,
  InputGroupStyleVariant,
} from './input-group.style-types.ts'

export namespace InputGroupT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = InputGroupStyleSlot<T>

  export type Variant = InputGroupStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {
    /** Place the control before supporting content in DOM order. */
    children?: JSX.Element
  }
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>

  export type PartVariant = Pick<InputGroupRecipeVariant, 'compact'>

  export interface PartBase {
    /** Icons, text, buttons, or other caller-owned content. */
    children?: JSX.Element
  }
  export type LeadingProps = BaseProps<'div', PartBase, PartVariant, never, never>
  export type TrailingProps = BaseProps<'div', PartBase, PartVariant, never, never>
}

export type InputGroupProps = InputGroupT.Props
