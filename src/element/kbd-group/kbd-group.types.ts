import type { Component } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { KbdT } from '../kbd/kbd.types'

import type { KbdGroupStyleSlot, KbdGroupStyleVariant } from './kbd-group.style-types'

export namespace KbdGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = KbdGroupStyleSlot<T>

  export type Variant = KbdGroupStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = KbdT.Key | KbdT.Base

  export interface SeparatorRenderProps {
    /** Separator index between key[index] and key[index + 1]. */
    index: number
  }

  export interface Base {
    /** Keyboard keys displayed as one simultaneous shortcut. */
    items: Item[]

    /**
     * Separator content or custom renderer between keys. Accepts a string, number, or Component.
     * @default '+'
     */
    separatorRender?: string | number | Component<SeparatorRenderProps>
  }

  /** Props for the KbdGroup component. */
  export type Props = BaseProps<'kbd', Base, Variant, Classes, Styles>
}

/** Props for the KbdGroup component. */
export type KbdGroupProps = KbdGroupT.Props
