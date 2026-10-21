import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { SkeletonStyleSlot, SkeletonStyleVariants } from './skeleton.style-types'

export namespace SkeletonT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SkeletonStyleSlot<T>
  export type Variants = SkeletonStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {}

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles, 'div', true>
}

export type SkeletonProps = SkeletonT.Props
