import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { SeparatorStyleSlot, SeparatorStyleVariant } from './separator.style-types'

export namespace SeparatorT {
  export type Kind = 'single'

  export type Slot<T = unknown> = SeparatorStyleSlot<T>

  export type Variant = SeparatorStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Base props for the Separator component. */
  export interface Base {}

  /** Props for the Separator component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the Separator component. */
export type SeparatorProps = SeparatorT.Props
