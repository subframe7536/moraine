import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { SeparatorStyleSlot, SeparatorStyleVariants } from './separator.style-types'

export namespace SeparatorT {
  export type Kind = 'single'

  export type Slot<T = unknown> = SeparatorStyleSlot<T>

  export type Variants = SeparatorStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Base props for the Separator component. */
  export interface Base {}

  /** Props for the Separator component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the Separator component. */
export type SeparatorProps = SeparatorT.Props
