import type { JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { InputGroupStyleSlot, InputGroupStyleVariants } from './input-group.style-types'

interface InputGroupPartBase<T extends ValidComponent = 'div'> {
  as?: T
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

  export type Variants = InputGroupStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {}
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles, 'div', true>

  export interface LeadingBase<T extends ValidComponent = 'div'> extends InputGroupPartBase<T> {}
  export type LeadingProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    LeadingBase<T>,
    never,
    never,
    never,
    'div'
  >

  export interface TrailingBase<T extends ValidComponent = 'div'> extends InputGroupPartBase<T> {}
  export type TrailingProps<T extends ValidComponent = 'div'> = BaseProps<
    T,
    TrailingBase<T>,
    never,
    never,
    never,
    'div'
  >
}

export type InputGroupProps = InputGroupT.Props
