import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { FieldStyleSlot, FieldStyleVariants } from './field.style-types'

type FieldPath = readonly (string | number)[]

export namespace FieldT {
  export type Kind = 'single'
  export type Slot<T = unknown> = FieldStyleSlot<T>

  export type Variants = FieldStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Name = string | FieldPath

  /** Identity and state props shared by controls that bind to a Field. */
  export interface ControlBase {
    /**
     * The ID of the control's labelable element, which a surrounding `Field` label points to with
     * `for`. Most controls set it on their focusable element and `PinInput` on its first slot;
     * `Slider` and `FileUpload` set it on their hidden native input. `CheckboxGroup` and
     * `RadioGroup` set it on their `<fieldset>`, which the `Field` label names through
     * `aria-labelledby` instead of `for`. A unique ID is generated when omitted. The control's
     * related parts (root, hidden input, label, description) derive their IDs from it, so keep it
     * unique on the page.
     */
    id?: string
    /**
     * The name of the control, used for native form submission. When omitted, the control uses
     * the name of its form binding or a string `name` set on the surrounding `Field`.
     */
    name?: string
    /**
     * Whether the control is disabled: it cannot be interacted with and sets `aria-disabled`.
     * When omitted, the control inherits `disabled` from the surrounding `Field`; an explicit
     * `false` overrides the `Field`.
     * @default false
     */
    disabled?: boolean
    /**
     * Whether the control is required, which sets `aria-required` (and the native `required`
     * attribute where the control renders a native input). When omitted, the control inherits
     * `required` from the surrounding `Field`.
     * @default false
     */
    required?: boolean
    /**
     * Whether the control is read-only: the value is visible and focusable but cannot be changed,
     * and `aria-readonly` is set. When omitted, the control inherits `readOnly` from the
     * surrounding `Field`.
     * @default false
     */
    readOnly?: boolean
  }

  /** Props passed to Field `children` when provided as a render function. */
  export interface ChildrenRenderProps {
    /**
     * The effective error: the `error` prop of the `Field` when set, otherwise the error of its
     * form binding. `false` when the error is suppressed with `error={false}`.
     */
    error?: JSX.Element
  }

  /** Base props for the Field component. */
  export interface Base<T extends ValidComponent = 'div'> {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: T
    /**
     * Prefix for the IDs of the label, hint, description, help, and error elements, which are
     * used for `aria-labelledby` and `aria-describedby`. It is not set on the root element.
     * A unique ID is generated when omitted.
     */
    id?: string
    /**
     * Standalone field name, for fields not bound through `form.Field`. A string is inherited by
     * nested controls as their native `name` when they set none; a path array such as
     * `['user', 'email']` identifies the field but is not used as a native name.
     */
    name?: Name
    /**
     * Label for the control. Rendered as a `<label>` pointing to the nested control and used as
     * its `aria-labelledby`. Empty content (`''`, `null`, `false`) counts as no label.
     */
    label?: JSX.Element
    /**
     * Visually hidden label used as the accessible name when `label` has no content. Ignored when
     * `label` is non-empty.
     */
    hiddenLabel?: string
    /**
     * Description rendered under the label, above the control. It is linked to the control with
     * `aria-describedby`.
     */
    description?: JSX.Element
    /**
     * Help text rendered under the control. It is hidden while an error is displayed and linked to
     * the control with `aria-describedby`.
     */
    help?: JSX.Element
    /**
     * Error message rendered under the control; it replaces `help` and marks the control with
     * `aria-invalid`. When unset (`undefined` or `null`), the error of the form binding is used.
     * `false` suppresses any error, including the bound one. Empty content such as `''` or
     * `true` displays nothing.
     */
    error?: JSX.Element
    /**
     * Hint rendered beside the label, such as "Optional". Only shown when the field has a label
     * (visible or `hiddenLabel`).
     */
    hint?: JSX.Element
    /**
     * Whether nested controls inherit the required state (`aria-required`) and the label shows a
     * required indicator. A control's own `required` prop takes precedence.
     * @default false
     */
    required?: boolean
    /**
     * Whether nested controls inherit a disabled state. A control's own `disabled` prop takes
     * precedence.
     */
    disabled?: boolean
    /**
     * Whether nested controls inherit a read-only state. A control's own `readOnly` prop takes
     * precedence.
     */
    readOnly?: boolean
    /**
     * Content, or a render function that receives the field state as props.
     */
    children?: JSX.Element | Component<ChildrenRenderProps>
  }

  /** Props for the Field component. */
  export type Props<T extends ValidComponent = 'div'> = BaseProps<
    T,
    Base<T>,
    Variants,
    Classes,
    Styles,
    'div'
  >
}

/** Props for the Field component. */
export type FieldProps<T extends ValidComponent = 'div'> = FieldT.Props<T>
