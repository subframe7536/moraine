import type { Component, JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

export namespace IconT {
  export type Name = string | JSX.Element | Component<Omit<IconProps, 'name'>>

  export interface Slot<T = unknown> {
    root?: T
  }
  export type Variant = never
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}
  /**
   * Base props for the Icon component.
   */
  export interface Base {
    /**
     * Icon source. Strings should be Uno icon classes such as `i-lucide-search`
     * or app-config aliases such as `icon-search`.
     * Non-string values can be JSX nodes or render functions.
     */
    name: Name

    /**
     * Explicit icon size override. Omit to inherit the surrounding font size.
     * Numbers are interpreted as px.
     */
    size?: string | number

    /**
     * Data slot for styling.
     * @default 'icon'
     */
    slotName?: string
  }

  /**
   * Props for the Icon component.
   */
  export type Props = BaseProps<'div', Base, Variant, never, never>
}

/**
 * Props for the Icon component.
 */
export interface IconProps extends IconT.Props {}
