import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type { CheckboxProps } from '../checkbox'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options'

import type {
  CheckboxGroupStyleSlot,
  CheckboxGroupStyleVariant,
} from './checkbox-group.style-types'

export namespace CheckboxGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = CheckboxGroupStyleSlot<T>

  export type Variant = CheckboxGroupStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item<TTrue = boolean, TFalse = boolean> {
    /** Value of the group item. */
    value?: string
    /** Label for the group item. */
    label?: JSX.Element
    /** Description for the group item. */
    description?: JSX.Element
    /** Whether the item is disabled. */
    disabled?: boolean
    /** Whether the item is indeterminate. */
    indeterminate?: CheckboxProps<TTrue, TFalse>['indeterminate']
    /** Custom checked icon for this item. */
    checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']
    /** Custom indeterminate icon for this item. */
    indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']
  }

  /** Base props for the CheckboxGroup component. */
  export interface Base<TTrue = boolean, TFalse = boolean>
    extends
      FormIdentityOptions,
      FormValueOptions<string[]>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /** Legend for the checkbox group. */
    legend?: JSX.Element

    /** Array of items to render in the group. */
    items?: (string | Item<TTrue, TFalse>)[]

    /** Default indicator position for all items. */
    indicator?: CheckboxProps<TTrue, TFalse>['indicator']

    /** Default checked icon for all items. */
    checkedIcon?: CheckboxProps<TTrue, TFalse>['checkedIcon']

    /** Default indeterminate icon for all items. */
    indeterminateIcon?: CheckboxProps<TTrue, TFalse>['indeterminateIcon']

    /** Callback when the selected values change. */
    onChange?: (value: string[]) => void
  }

  /** Props for the CheckboxGroup component. */
  export type Props<TTrue = boolean, TFalse = boolean> = BaseProps<
    'div',
    Base<TTrue, TFalse>,
    Variant,
    Classes,
    Styles
  >
}

/** Props for the CheckboxGroup component. */
export type CheckboxGroupProps<TTrue = boolean, TFalse = boolean> = CheckboxGroupT.Props<
  TTrue,
  TFalse
>
