import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export namespace SeparatorT {
  export interface Slot<T = unknown> {
    root?: T
  }

  export interface Variant {
    /** Visual size of the component.
     * @default 'sm'
     */
    size?: 'sm' | 'md' | 'lg' | null

    /** Visual type of the component.
     * @default 'solid'
     */
    type?: 'solid' | 'dashed' | 'dotted' | null
  }

  export type SlotName = keyof Slot

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /** Base props for the Separator component. */
  export interface Base {
    /**
     * Whether the separator is decorative (hidden from assistive technologies).
     * @default false
     */
    decorative?: boolean

    /**
     * The orientation of the separator.
     * @default 'horizontal'
     */
    orientation?: 'horizontal' | 'vertical'
  }

  /** Props for the Separator component. */
  export type Props = BaseProps<'div', Base, Variant, never, never>
}

/** Props for the Separator component. */
export interface SeparatorProps extends SeparatorT.Props {}
