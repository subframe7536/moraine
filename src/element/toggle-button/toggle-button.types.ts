import type { JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { ButtonT } from '../button'

import type { ToggleButtonStyleSlot, ToggleButtonStyleVariant } from './toggle-button.style-types'

export namespace ToggleButtonT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ToggleButtonStyleSlot<T>
  export type Variant = ToggleButtonStyleVariant
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Base<T extends ValidComponent = 'button'> = Omit<
    ButtonT.Base<T>,
    'slotName' | 'children'
  > & {
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
    /** Pressed semantics are owned by the component. */
    'aria-pressed'?: never
  }

  export type Props<T extends ValidComponent = 'button'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles,
    'button'
  >
}

export type ToggleButtonProps<T extends ValidComponent = 'button'> = ToggleButtonT.Props<T>
