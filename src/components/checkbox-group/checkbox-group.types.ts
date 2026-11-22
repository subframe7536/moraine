import type { JSX } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { CheckboxProps } from '../checkbox'
import type { FieldT } from '../field'

import type {
  CheckboxGroupStyleSlot,
  CheckboxGroupStyleVariants,
} from './checkbox-group.style-types'

export namespace CheckboxGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = CheckboxGroupStyleSlot<T>

  export type Variants = CheckboxGroupStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {
    /**
     * Value of the item, added to the group's `value` array when selected and submitted as the
     * native checkbox value. Must be unique within the group (a duplicate logs a warning in
     * development).
     */
    value: string
    /** Label rendered beside the item's checkbox. */
    label?: JSX.Element
    /** Description rendered under the item's label. */
    description?: JSX.Element
    /**
     * Whether this item is disabled. A disabled item is skipped by the group's `required`
     * validation.
     */
    disabled?: boolean
    /**
     * Displays the item in the mixed state regardless of whether its `value` is selected.
     * Toggling a mixed item always checks it: it adds the `value` to the group's `value` array, or
     * changes nothing when the `value` is already selected. Clear `indeterminate` to let the user
     * uncheck it.
     */
    indeterminate?: boolean
    /** Custom checked icon for this item. Overrides the group's `checkedIcon`. */
    checkedIcon?: CheckboxProps['checkedIcon']
    /** Custom indeterminate icon for this item. Overrides the group's `indeterminateIcon`. */
    indeterminateIcon?: CheckboxProps['indeterminateIcon']
  }

  /** Base props for the CheckboxGroup component. */
  export interface Base extends FieldT.ControlBase {
    /**
     * The `value` of every selected item (controlled). Leave it `undefined` for uncontrolled
     * state and update it from `onValueChange`.
     */
    value?: string[]
    /**
     * Initially selected item values when uncontrolled; also the selection restored when the
     * surrounding native form is reset.
     * @default []
     */
    defaultValue?: string[]

    /**
     * Legend that labels the group (rendered as a `<legend>` inside the `<fieldset>`). A `Field`
     * label takes precedence for `aria-labelledby`.
     */
    legend?: JSX.Element

    /**
     * The id of a `<form>` the hidden inputs belong to, instead of the closest
     * ancestor form.
     */
    form?: string

    /**
     * Options to render. A string is shorthand for an item whose `value` and `label` are that
     * string.
     * @example
     * ```tsx
     * import { CheckboxGroup } from 'moraine'
     *
     * <CheckboxGroup
     *   legend="Toppings"
     *   defaultValue={['cheese']}
     *   items={[
     *     'cheese',
     *     { value: 'mushroom', label: 'Mushroom', description: 'Fresh, sliced' },
     *     { value: 'olives', label: 'Olives', disabled: true },
     *   ]}
     * />
     * ```
     */
    items?: (string | Item)[]

    /**
     * Where the checkbox control sits relative to the label for every item (`'leading'`,
     * `'trailing'`, or `'hidden'` to visually hide the control, as in selectable cards).
     * @default 'leading'
     */
    indicatorPosition?: CheckboxProps['indicatorPosition']

    /** Checked icon for all items; an item's own `checkedIcon` takes precedence. */
    checkedIcon?: CheckboxProps['checkedIcon']

    /** Indeterminate icon for all items; an item's own `indeterminateIcon` takes precedence. */
    indeterminateIcon?: CheckboxProps['indeterminateIcon']

    /**
     * Called after the user toggles an item, with the full new array of selected item values
     * (previous values plus or minus the toggled one, in toggle order). Not called while the group
     * is `disabled` or `readOnly`.
     */
    onValueChange?: (value: string[]) => void

    /**
     * Focus event when focus enters the checkbox group from outside, called before the `Field`
     * focus notification. Moving focus between items does not fire it.
     */
    onFocus?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>

    /**
     * Focus event when focus leaves the checkbox group entirely, called before the `Field` blur
     * notification. Moving focus between items does not fire it.
     */
    onBlur?: JSX.FocusEventHandlerUnion<HTMLDivElement, FocusEvent>
  }

  /** Props for the CheckboxGroup component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the CheckboxGroup component. */
export type CheckboxGroupProps = CheckboxGroupT.Props
