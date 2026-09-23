import type { Component, JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { DEFAULT_ICON_SHORTCUTS } from '../../theme/style/icons.ts'

import type { IconStyleSlot, IconStyleVariant } from './icon.style-types'

type BuiltinIconName = (typeof DEFAULT_ICON_SHORTCUTS)[number][0]
type IconStringName = BuiltinIconName | (string & {})

export namespace IconT {
  export type Kind = 'single'

  export type Slot<T = unknown> = IconStyleSlot<T>
  export type Variant = IconStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Name = IconStringName | JSX.Element | Component<Omit<IconProps, 'name'>>
  /**
   * Base props for the Icon component.
   */
  export interface Base {
    /**
     * Icon source. Strings should be Uno icon classes such as `i-lucide-search`
     * or app-config aliases such as `icon-search`.
     * Non-string values can be JSX nodes or render functions.
     * Wrap Icon in Solid control flow instead of passing a control-flow node as `name`.
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
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/**
 * Props for the Icon component.
 */
export type IconProps = IconT.Props
