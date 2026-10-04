import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { ScrollAreaStyleSlot, ScrollAreaStyleVariant } from './scroll-area.style-types'

export namespace ScrollAreaT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ScrollAreaStyleSlot<T>
  export type Variant = ScrollAreaStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Visibility = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'both' | 'none'

  export interface Base {
    /** Content rendered directly inside the scroll container. */
    children?: JSX.Element
    /** Edge fade size in pixels. @default 40 */
    shadowSize?: number
    /** Distance from an edge within which its shadow stays hidden. @default 0 */
    offset?: number
    /** Visible shadow edges. Manual visibility still requires shadow. @default 'auto' */
    visibility?: Visibility
    /** Called when measured overflow edges change while shadow is enabled. */
    onVisibilityChange?: (visibility: Exclude<Visibility, 'auto'>) => void
  }

  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

export type ScrollAreaProps = ScrollAreaT.Props
