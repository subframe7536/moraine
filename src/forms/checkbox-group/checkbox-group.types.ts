import type { JSX } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { CheckboxProps } from '../checkbox/index.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

export namespace CheckboxGroupT {
  export interface Slot<T = unknown> {
    /** Group container that owns checkbox collection state and layout. */
    root?: T
    /** Fieldset element that groups checkbox options for accessibility. */
    fieldset?: T
    /** Legend text that labels the checkbox group. */
    legend?: T
    /** Wrapper for one checkbox option in the group. */
    item?: T
    /** Text column for an option label and description. */
    container?: T
    /** Visible checkbox control for an individual option. */
    control?: T
    /** Visual checked or indeterminate state layer for an option. */
    indicator?: T
    /** Check or indeterminate icon rendered for an option state. */
    icon?: T
    /** Inner layout wrapper used by grouped checkbox variants. */
    wrapper?: T
    /** Primary label text for an option. */
    label?: T
    /** Supporting description for an option. */
    description?: T
  }

  export interface Variant {
    orientation?: 'horizontal' | 'vertical'
    size?: 'sm' | 'md' | 'lg'
    variant?: 'card' | 'table' | 'list'
    tableOrientation?: 'horizontal' | 'vertical'
    required?: boolean
  }

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
export interface CheckboxGroupProps<TTrue = boolean, TFalse = boolean> extends CheckboxGroupT.Props<
  TTrue,
  TFalse
> {}
