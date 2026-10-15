import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { SkeletonStyleSlot, SkeletonStyleVariant } from './skeleton.style-types'

export namespace SkeletonT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SkeletonStyleSlot<T>
  export type Variant = SkeletonStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {}

  export type Props = BaseProps<'div', Base, Variant, Classes, Styles, 'div', true>
}

export type SkeletonProps = SkeletonT.Props
