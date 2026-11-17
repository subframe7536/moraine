import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { ButtonGroupStyleSlot, ButtonGroupStyleVariants } from './button-group.style-types'

export namespace ButtonGroupT {
  export type Kind = 'composite'

  export type Slot<T = unknown> = ButtonGroupStyleSlot<T>
  export type Variants = ButtonGroupStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Base props for the ButtonGroup component. */
  export interface Base {
    /** `id` attribute of the group root element, for example to reference it from `aria-labelledby`. */
    id?: string
    /**
     * ARIA role of the group root. Use `'toolbar'` only when you also provide the toolbar keyboard
     * behavior yourself; the group adds none.
     * @default 'group'
     */
    role?: JSX.AriaAttributes['role']
    /**
     * Buttons rendered as one joined set, optionally with `ButtonGroup.Separator` between them.
     * Descendant `Button`s inherit the group's `size`, `variant` and `tone` unless they set their own.
     */
    children?: JSX.Element
  }

  /** Props for the ButtonGroup component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>

  /** Base props for the ButtonGroup.Separator component. */
  export interface SeparatorBase {}

  /** Props for the ButtonGroup.Separator component. */
  export type SeparatorProps = BaseProps<'div', SeparatorBase, never, never, never>
}

/** Props for the ButtonGroup component. */
export type ButtonGroupProps = ButtonGroupT.Props
