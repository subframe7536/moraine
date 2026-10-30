import type { Component, JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { DEFAULT_ICON_SHORTCUTS } from '../../theme/icons'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { IconStyleSlot, IconStyleVariants } from './icon.style-types'

type BuiltinIconName = (typeof DEFAULT_ICON_SHORTCUTS)[number][0]
type IconStringName = BuiltinIconName | (string & {})

export namespace IconT {
  export type Kind = 'single'

  export type Slot<T = unknown> = IconStyleSlot<T>
  export type Variants = IconStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Name = IconStringName | JSX.Element | Component
  /**
   * Base props for the Icon component. Every icon renders a `span` host that is a `1.2em` box,
   * so it follows the inherited `font-size`. Set `font-size` (for example `text-lg`) on the icon
   * or an ancestor, or a size utility such as `size-6` on the icon, to resize it.
   * Icon renders no `data-slot` of its own; pass a `data-slot` attribute when the icon is a slot.
   */
  export interface Base {
    /**
     * Icon source. Strings should be Uno icon classes such as `i-lucide-search`
     * or app-config aliases such as `icon-search`.
     * Non-string values can be JSX nodes or Solid components. They render inside the host and
     * fill it; components are rendered without props, and every Icon prop goes to the host.
     * Wrap Icon in Solid control flow instead of passing a control-flow node as `name`.
     */
    name: Name
  }

  /**
   * Props for the Icon component.
   */
  export type Props = BaseProps<'span', Base, Variants, Classes, Styles>
}

/**
 * Props for the Icon component.
 */
export type IconProps = IconT.Props
