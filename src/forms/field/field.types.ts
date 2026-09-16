import type { JSX, ValidComponent } from 'solid-js'

import type { ComponentOrElement } from '../../shared/render-prop'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

export namespace FieldT {
  export type Kind = 'single'
  export type Path = readonly (string | number)[]
  export type Name = string | Path

  /** Props passed to Field children when provided as a render function. */
  export interface RenderContext {
    /** The current effective error for the field. */
    error?: JSX.Element
  }

  export interface Slot<T = unknown> {
    /** Field wrapper that links label, control, description, and messages. */
    root?: T
    /** Inner wrapper that arranges label, control, helper text, and messages. */
    wrapper?: T
    /** Row that groups the field label and optional hint. */
    labelWrapper?: T
    /** Accessible field label associated with the control. */
    label?: T
    /** Region that contains the wrapped form control. */
    container?: T
    /** Helper text associated with the control. */
    description?: T
    /** Validation error message region for the field. */
    error?: T
    /** Short hint rendered beside the field label. */
    hint?: T
    /** Additional guidance rendered below the control. */
    help?: T
  }

  export interface Variant {
    /** Visual size of the component.
     * @default 'md'
     */
    size?: 'sm' | 'md' | 'lg'
    /** Visual layout direction.
     * @default 'vertical'
     */
    orientation?: 'vertical' | 'horizontal'
  }

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
