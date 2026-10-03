import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { SkeletonStyleSlot, SkeletonStyleVariant } from './skeleton.style-types'

export namespace SkeletonT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SkeletonStyleSlot<T>
  export type Variant = SkeletonStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {
    /** Content rendered inside the placeholder. */
    children?: JSX.Element
  }

  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

export type SkeletonProps = SkeletonT.Props
