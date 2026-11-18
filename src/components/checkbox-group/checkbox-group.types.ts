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

  export interface Item<TTrue = boolean, TFalse = boolean> {
    /**
     * Value of the item, added to the group's `value` array when selected and submitted as the
     * native checkbox value. Must be unique within the group (a duplicate logs a warning in
     * development). Falls back to the item's index as a string.
     */
    value?: string
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
     * Toggling it still adds or removes the `value` from the group's `value` array.
     */
    indeterminate?: boolean
    /** Custom checked icon for this item. Overrides the group's `checkedIcon`. */
    checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']
    /** Custom indeterminate icon for this item. Overrides the group's `indeterminateIcon`. */
    indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']
  }

  /** Base props for the CheckboxGroup component. */
  export interface Base<TTrue = boolean, TFalse = boolean> extends FieldT.ControlBase {
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
    items?: (string | Item<TTrue, TFalse>)[]

    /**
     * Where the checkbox control sits relative to the label for every item (`'leading'`,
     * `'trailing'`, or `'hidden'` to visually hide the control, as in selectable cards).
     */
    indicatorPosition?: CheckboxProps<TTrue, TFalse>['indicatorPosition']

    /** Checked icon for all items; an item's own `checkedIcon` takes precedence. */
    checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']

    /** Indeterminate icon for all items; an item's own `indeterminateIcon` takes precedence. */
    indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']

    /**
     * Called after the user toggles an item, with the full new array of selected item values
     * (previous values plus or minus the toggled one, in toggle order). Not called while the group
     * is `disabled` or `readOnly`.
     */
    onValueChange?: (value: string[]) => void
  }

  /** Props for the CheckboxGroup component. */
  export type Props<TTrue = boolean, TFalse = boolean> = BaseProps<
    'div',
    Base<TTrue, TFalse>,
    Variants,
    Classes,
    Styles
  >
}

/** Props for the CheckboxGroup component. */
export type CheckboxGroupProps<TTrue = boolean, TFalse = boolean> = CheckboxGroupT.Props<
  TTrue,
  TFalse
>
