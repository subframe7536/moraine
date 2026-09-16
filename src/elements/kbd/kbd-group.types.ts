import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { KbdT } from './kbd.types'

export namespace KbdGroupT {
  export type Kind = 'single'

  export interface Slot<T = unknown> {
    /** KbdGroup root element. */
    root?: T

    /** Generated Kbd item. */
    item?: T
  }

  export interface Variant {
    /** Visual size of the component.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'
    /** Visual style variant applied to rendered shortcut keys. */
    variant?: KbdT.Variant['variant']
  }

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

    /** KbdGroup is data-driven and does not accept composed children. */
    children?: never
  }

  /** Props for the KbdGroup component. */
  export type Props = BaseProps<'kbd', Base, Variant, Classes, Styles>
}

/** Props for the KbdGroup component. */
export interface KbdGroupProps extends KbdGroupT.Props {}
