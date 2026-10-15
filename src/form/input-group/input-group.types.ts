import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { InputGroupStyleSlot, InputGroupStyleVariant } from './input-group.style-types'

interface InputGroupPartBase {
  /**
   * Removes the padding between this part and the adjacent control.
   * @default false
   */
  compact?: boolean
  /** Icons, text, buttons, or other caller-owned content. */
  children?: JSX.Element
}

export namespace InputGroupT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = InputGroupStyleSlot<T>

  export type Variant = InputGroupStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {}
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles, 'div', true>

  export interface LeadingBase extends InputGroupPartBase {}
  export type LeadingProps = BaseProps<'div', LeadingBase, never, never, never>

  export interface TrailingBase extends InputGroupPartBase {}
  export type TrailingProps = BaseProps<'div', TrailingBase, never, never, never>
}

export type InputGroupProps = InputGroupT.Props
