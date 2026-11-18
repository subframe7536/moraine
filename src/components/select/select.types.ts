import type { Component, JSX } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type {
  BaseSelectCloseOnSelectOption,
  BaseSelectDisclosureProps,
  BaseSelectItemBehaviorProps,
  BaseSelectResetProps,
  BaseSelectT,
} from '../base-select/base-select.types'
import type { FieldT } from '../field'
import type { IconT } from '../icon/index'
import type {
  NormalizedSelectItem,
  ContentProps,
  SelectGroup,
  SelectEntry,
} from '../shared/form/select/types'

import type { defaultSelectMessages } from './select.messages'
import type { SelectStyleSlot, SelectStyleVariants } from './select.style-types'

export namespace SelectT {
  export type Kind = 'single'
  export type Slot<T = unknown> = SelectStyleSlot<T>
  export type Variants = SelectStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultSelectMessages>
  export type Translations = Partial<Messages>

  export interface Item<
    Val extends string | number = string | number,
  > extends BaseSelectT.Item<Val> {
    /** Icon rendered before the label in the default item content. Ignored when `itemRender` is set. */
    icon?: IconT.Name
    /** Secondary text rendered under the label in the default item content. Ignored when `itemRender` is set. */
    description?: JSX.Element
  }
  export type NormalizedItem<T extends string | Item> = NormalizedSelectItem<T>
  export type Group<TItem extends string | Item = string | Item> = SelectGroup<TItem>
  export type Entry<TItem extends string | Item = string | Item> = SelectEntry<TItem>
  export type ItemRenderProps<TItem extends string | Item = string | Item> =
    BaseSelectT.ItemRenderProps<NormalizedItem<TItem>>
  export interface EmptyRenderProps<TItem extends string | Item = string | Item> {
    /** Currently selected value, or `null` when nothing is selected. */
    selectedValue: NormalizedItem<TItem>['value'] | null
    /** Closes the popup. */
    close: () => void
  }

  export interface Base<TItem extends string | Item = string | Item>
    extends
      FieldT.ControlBase,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<NormalizedItem<TItem>>,
      BaseSelectCloseOnSelectOption,
      BaseSelectResetProps,
      Omit<ContentProps<NormalizedItem<TItem>>, 'virtualizer'> {
    /**
     * Initial selected value when `value` is not set. Read once on creation; a native form reset
     * restores it.
     */
    defaultValue?: NormalizedItem<TItem>['value']
    /**
     * Overrides the built-in messages (`clear`, `placeholder`) for this instance, merged over
     * the messages from the provider and locale.
     * @example
     * ```tsx
     * import { Select } from 'moraine'
     *
     * <Select
     *   items={['Small', 'Large']}
     *   clearable
     *   translations={{ clear: 'Remove size', placeholder: 'Pick a size' }}
     * />
     * ```
     */
    translations?: Translations
    /**
     * Controlled selected value. `undefined` keeps the selection uncontrolled; `null` keeps it
     * controlled and empty. A value that matches no item is displayed as `String(value)`. In
     * controlled mode the selection changes only when you update this prop in `onValueChange`.
     */
    value?: NormalizedItem<TItem>['value'] | null
    /**
     * Options of the popup list: plain strings (shorthand for `{ value, label }`), item objects,
     * `{ type: 'group', label, items }` groups, and `{ type: 'separator' }` dividers. Item values
     * must be unique across the whole collection; a repeated value is ignored and logs an error
     * in development.
     * @example
     * ```tsx
     * import { Select } from 'moraine'
     *
     * <Select
     *   items={[
     *     { label: 'Apple', value: 'apple' },
     *     { type: 'separator' },
     *     {
     *       type: 'group',
     *       label: 'Citrus',
     *       items: [
     *         { label: 'Lemon', value: 'lemon' },
     *         { label: 'Lime', value: 'lime', disabled: true },
     *       ],
     *     },
     *     { label: 'Pear', value: 'pear' },
     *   ]}
     * />
     * ```
     */
    items?: Entry<TItem>[]
    /**
     * Called with the new item `value` when the user changes the selection, or with `null` when
     * it is cleared. Not called for prop updates, when the same item is chosen again, or while
     * the select is disabled or read-only.
     */
    onValueChange?: (value: NoInfer<NormalizedItem<TItem>['value']> | null) => void
    /**
     * Content shown in the popup when `items` is empty; nothing is rendered when omitted. A
     * function receives `{ selectedValue, close }`.
     * @example
     * ```tsx
     * import { Select } from 'moraine'
     *
     * <Select
     *   items={[]}
     *   emptyRender={(state) => <button onClick={() => state.close()}>No options. Close</button>}
     * />
     * ```
     */
    emptyRender?: JSX.Element | Component<EmptyRenderProps<TItem>>
    /**
     * Text shown in the trigger while no value is selected. Takes precedence over the
     * `placeholder` translation.
     * @default ''
     */
    placeholder?: string
    /**
     * Replaces the `trailing` icon with `loadingIcon` and hides the clear button. It does not
     * disable the select.
     */
    loading?: boolean
    /**
     * Shows a clear button while a value is selected (hidden during `loading`). Backspace or
     * Delete on the focused trigger clears too. Clearing calls `onValueChange(null)`, then
     * `onClear`, and returns focus to the trigger.
     */
    clearable?: boolean
    /**
     * Called after a clear action (see `clearable`), following `onValueChange(null)`. Not called
     * while the select is disabled or read-only.
     */
    onClear?: () => void
    /**
     * Icon shown instead of `trailing` while `loading`.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Icon rendered before the selected value or placeholder. */
    leading?: IconT.Name
    /**
     * Icon at the end of the trigger; replaced by `loadingIcon` while `loading`.
     * @default 'icon-chevron-down'
     */
    trailing?: IconT.Name
    /**
     * Icon used by the clear affordance.
     * @default 'icon-close'
     */
    clearIcon?: IconT.Name
  }

  export type Props<TItem extends string | Item = string | Item> = BaseProps<
    'div',
    Base<TItem>,
    Variants,
    Classes,
    Styles
  >
}

export type SelectProps<TItem extends string | SelectT.Item = string | SelectT.Item> =
  SelectT.Props<TItem>
