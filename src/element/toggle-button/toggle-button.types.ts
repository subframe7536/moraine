import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { ButtonT } from '../button'

import type { ToggleButtonStyleSlot, ToggleButtonStyleVariant } from './toggle-button.style-types'

export namespace ToggleButtonT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ToggleButtonStyleSlot<T>
  export type Variant = ToggleButtonStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Base = Omit<ButtonT.Base, 'as' | 'slotName' | 'children'> & {
    /** Controlled toggle state. */
    pressed?: boolean
    /** Initial uncontrolled toggle state. @default false */
    defaultPressed?: boolean
    /** Called after an uncancelled activation requests a toggle. */
    onPressedChange?: (pressed: boolean) => void
    /**
     * Content or render function receiving reactive toggle and loading states.
     * A render function must declare its parameter, even when unused. A zero-argument
     * function is called as an accessor and is not mounted as a component.
     */
    children?: JSX.Element | ((props: { pressed: boolean; loading: boolean }) => JSX.Element)
  }

  export type Props = Omit<
    BaseProps<'button', Base, Variant, Classes, Styles>,
    'as' | 'type' | 'slotName' | 'aria-pressed'
  >
}

export type ToggleButtonProps = ToggleButtonT.Props
