import type { JSX } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue, ValidComponent } from '../../shared/types'

import type { FieldStyleSlot, FieldStyleVariant } from './field.style-types'

export namespace FieldT {
  export type Kind = 'single'
  export type Path = readonly (string | number)[]
  export type Name = string | Path

  /** Props passed to Field children when provided as a render function. */
  export interface RenderContext {
    /** The current effective error for the field. */
    error?: JSX.Element
  }

  export type Slot<T = unknown> = FieldStyleSlot<T>

  export type Variant = FieldStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /** Base props for the Field component. */
  export interface Base<T extends ValidComponent = 'div'> {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: T
    /** Unique identifier for the field. */
    id?: string
    /** Optional standalone field name. */
    name?: Name
    /** Label for the field. */
    label?: JSX.Element
    /** Description text shown below the label. */
    description?: JSX.Element
    /** Help text shown below the control when no error is present. */
    help?: JSX.Element
    /** Custom error message or force error state. */
    error?: JSX.Element
    /** Hint text shown near the label. */
    hint?: JSX.Element
    /**
     * Whether the field is required.
     * @default false
     */
    required?: boolean
    /** Whether controls inherit a disabled state. */
    disabled?: boolean
    /** Whether controls inherit a read-only state. */
    readOnly?: boolean
    /** Children of the field, can be a render function. */
    children?: ComponentOrElement<RenderContext>
  }

  /** Props for the Field component. */
  export type Props<T extends ValidComponent = 'div'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles
  >
}

/** Props for the Field component. */
export type FieldProps<T extends ValidComponent = 'div'> = FieldT.Props<T>
