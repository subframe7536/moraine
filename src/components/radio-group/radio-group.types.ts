import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'

import type { RadioGroupStyleSlot, RadioGroupStyleVariants } from './radio-group.style-types'

export namespace RadioGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = RadioGroupStyleSlot<T>

  export type Variants = RadioGroupStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /**
   * A radio item object.
   */
  export interface Item {
    /**
     * Value of the radio item, submitted with the form and passed to `onValueChange`. Must be
     * unique within the group.
     */
    value: string

    /**
     * Label for the radio item. It names the radio input for assistive technology.
     */
    label?: JSX.Element

    /**
     * Description for the radio item.
     */
    description?: JSX.Element

    /**
     * Whether this item is disabled. It cannot be selected or focused with the keyboard, and the
     * other items stay interactive.
     */
    disabled?: boolean
  }

  /**
   * Base props for the RadioGroup component.
   */
  export interface Base extends FieldT.ControlBase {
    /**
     * The value of the selected item (controlled). Leave it `undefined` for uncontrolled usage; an
     * empty string or a value matching no item leaves every item unselected.
     */
    value?: string
    /**
     * The initially selected value (uncontrolled). When omitted, no item is selected and the form
     * submits nothing for the group.
     */
    defaultValue?: string

    /**
     * The id of a `<form>` the hidden inputs belong to, instead of the closest
     * ancestor form.
     */
    form?: string

    /**
     * Legend that labels the group (rendered as a `<legend>` inside the `<fieldset>`). A `Field`
     * label takes precedence for `aria-labelledby`.
     */
    legend?: JSX.Element

    /**
     * Items to render, either plain strings (used as both `value` and `label`) or `Item` objects.
     * @example
     * ```tsx
     * import { RadioGroup } from 'moraine'
     *
     * <RadioGroup
     *   items={[
     *     'Free',
     *     { value: 'pro', label: 'Pro', description: 'Billed monthly' },
     *     { value: 'team', label: 'Team', disabled: true },
     *   ]}
     * />
     * ```
     */
    items?: (string | Item)[]

    /**
     * Whether arrow-key navigation wraps from the last item to the first and back. Disabled items are skipped.
     * @default true
     */
    loop?: boolean

    /**
     * Called when the user selects a different item, with that item's `value`. It does not fire for
     * programmatic changes to `value`, for re-selecting the current item, or while the group is
     * `disabled` or `readOnly`.
     */
    onValueChange?: (value: string) => void
  }

  /**
   * Props for the RadioGroup component.
   */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/**
 * Props for the RadioGroup component.
 */
export type RadioGroupProps = RadioGroupT.Props
