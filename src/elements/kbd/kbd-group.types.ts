import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { KbdT } from './kbd.types.ts'

export namespace KbdGroupT {
  export interface Slot<T = unknown> {
    /** Container for one or more shortcut steps. */
    root?: T

    /** Wrapper around keys pressed at the same time. */
    chord?: T

    /** Individual key token. */
    item?: T

    /** Divider between keys pressed at the same time. */
    divider?: T

    /** Divider between shortcut steps pressed in sequence. */
    sequenceDivider?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg'
    /** Visual style variant applied to rendered shortcut keys. */
    variant?: KbdT.Variant['variant']
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = KbdT.Key | KbdT.Base

  export interface DividerRenderProps {
    /** Zero-based divider index in the current collection. */
    index: number
  }

  export interface Base {
    /** Keys pressed at the same time, such as Ctrl+K. */
    items?: Item[]

    /** Key groups pressed one after another, such as Ctrl+K then Ctrl+S. */
    sequence?: Item[][]

    /** Custom divider rendered between keys in the same group. */
    dividerRender?: ComponentOrElement<DividerRenderProps>

    /** Custom divider rendered between shortcut steps. */
    sequenceDividerRender?: ComponentOrElement<DividerRenderProps>
  }

  /** Props for the KbdGroup component. */
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/** Props for the KbdGroup component. */
export interface KbdGroupProps extends KbdGroupT.Props {}
