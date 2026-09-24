import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type {
  InputGroupRecipeVariant,
  InputGroupStyleSlot,
  InputGroupStyleVariant,
} from './input-group.style-types'

type InputGroupPartVariant = Pick<InputGroupRecipeVariant, 'compact'>

interface InputGroupPartBase {
  /** Icons, text, buttons, or other caller-owned content. */
  children?: JSX.Element
}

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

  export interface LeadingBase extends InputGroupPartBase {}
  export type LeadingProps = BaseProps<'div', LeadingBase, InputGroupPartVariant, never, never>

  export interface TrailingBase extends InputGroupPartBase {}
  export type TrailingProps = BaseProps<'div', TrailingBase, InputGroupPartVariant, never, never>
}

export type InputGroupProps = InputGroupT.Props
