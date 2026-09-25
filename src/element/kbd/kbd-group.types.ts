import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { KbdGroupStyleSlot, KbdGroupStyleVariant } from './kbd-group.style-types'
import type { KbdT } from './kbd.types'

export namespace KbdGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = KbdGroupStyleSlot<T>

  export type Variant = KbdGroupStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = KbdT.Key | KbdT.Base

  export interface Base {
    /** Keyboard keys displayed as one simultaneous shortcut. */
    items: Item[]

    /**
     * Inline content rendered between keys.
     * @default '+'
     */
    separator?: JSX.Element
  }

  /** Props for the KbdGroup component. */
  export type Props = BaseProps<'kbd', Base, Variant, Classes, Styles>
}

/** Props for the KbdGroup component. */
export type KbdGroupProps = KbdGroupT.Props
