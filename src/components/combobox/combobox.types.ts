import type { Component, JSX, Ref } from 'solid-js'

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
  SearchProps,
  SelectEntry,
  SelectGroup,
  SelectRow,
  SelectVirtualizer,
} from '../shared/form/select/types'

import type { defaultComboboxMessages } from './combobox.messages'
import type { ComboboxStyleSlot, ComboboxStyleVariants } from './combobox.style-types'

export namespace ComboboxT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ComboboxStyleSlot<T>
  export type Variants = ComboboxStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultComboboxMessages>
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
  export type Row<TItem extends string | Item = string | Item> = SelectRow<NormalizedItem<TItem>>
  /** Virtualizer over `Row` entries, such as `createListVirtualizer<ComboboxT.Row>()`. */
  export type Virtualizer<TItem extends string | Item = string | Item> = SelectVirtualizer<
    NormalizedItem<TItem>
  >
  export type ItemRenderProps<TItem extends string | Item = string | Item> =
    BaseSelectT.ItemRenderProps<NormalizedItem<TItem>>
  export interface EmptyRenderProps<TItem extends string | Item = string | Item> {
    /** Current search text. */
    searchValue: string
    /** Whether the filtered collection has matches. */
    hasMatches: boolean
    /** Currently selected value, or `null` when nothing is selected. */
    selectedValue: NormalizedItem<TItem>['value'] | null
    /** Close the popup. */
    close: () => void
  }
  export interface Base<TItem extends string | Item = string | Item>
    extends
      FieldT.ControlBase,
      BaseSelectDisclosureProps,
      BaseSelectItemBehaviorProps<NormalizedItem<TItem>>,
      BaseSelectCloseOnSelectOption,
      BaseSelectResetProps,
      SearchProps<NormalizedItem<TItem>>,
      ContentProps<NormalizedItem<TItem>> {
    /**
     * Initial selected value when `value` is not set. Read once on creation; a native form reset
     * restores it.
     */
    defaultValue?: NormalizedItem<TItem>['value']
    /**
     * Overrides the built-in messages (`clear`, `loading`, `toggle`, `empty`, `placeholder`) for
     * this instance, merged over the messages from the provider and locale. `empty` is the
     * default text of the empty state.
     */
    translations?: Translations
    /**
     * Controlled committed value. `undefined` keeps the selection uncontrolled; `null` keeps it
     * controlled and empty. Typed search text is never a value; it lives in `searchValue`. In
     * controlled mode the selection changes only when you update this prop in `onValueChange`.
     */
    value?: NormalizedItem<TItem>['value'] | null
    /**
     * Options of the popup list: plain strings (shorthand for `{ value, label }`), item objects,
     * `{ type: 'group', label, items }` groups, and `{ type: 'separator' }` dividers. Item values
     * must be unique across the whole collection; a repeated value is ignored and logs an error
     * in development. Filtering by the search text hides non-matching items from the list but
     * never changes the selection.
     * @example
     * ```tsx
     * import { Combobox } from 'moraine'
     *
     * <Combobox
     *   items={[
     *     { type: 'group', label: 'Fruit', items: ['Apple', { label: 'Pear', value: 'pear' }] },
     *     { type: 'separator' },
     *     { type: 'group', label: 'Veg', items: [{ label: 'Leek', value: 'leek' }] },
     *   ]}
     * />
     * ```
     */
    items?: Entry<TItem>[]
    /**
     * Called with the new item `value` when the user commits a different item, or with `null`
     * when the selection is cleared. Typing alone does not call it (see `onSearchValueChange`).
     * Not called for prop updates, when the same item is chosen again, or while disabled or
     * read-only.
     */
    onValueChange?: (value: NoInfer<NormalizedItem<TItem>['value']> | null) => void
    /**
     * Content shown in the popup when no item matches the search text. A function receives
     * `{ searchValue, hasMatches, selectedValue, close }`. Defaults to the `empty` translation
     * (`'No items'`).
     * @example
     * ```tsx
     * import { Combobox } from 'moraine'
     *
     * <Combobox
     *   items={['Apple', 'Pear']}
     *   emptyRender={(state) => <span>No fruit matches "{state.searchValue}"</span>}
     * />
     * ```
     */
    emptyRender?: JSX.Element | Component<EmptyRenderProps<TItem>>
    /**
     * Native placeholder of the input, so it shows whenever the input text is empty. Takes
     * precedence over the `placeholder` translation.
     */
    placeholder?: string
    /**
     * Replaces the toggle icon with `loadingIcon`, and disables the toggle button and marks it
     * `aria-busy`. Typing and the clear button keep working.
     */
    loading?: boolean
    /**
     * Shows a clear button while there is a selected value or search text. Escape (with the popup
     * closed) and Backspace or Delete (with an empty input) clear too. Clearing resets the
     * selection (`onValueChange(null)` if one existed) and the search text, calls `onClear`, and
     * returns focus to the input.
     * @default false
     */
    clearable?: boolean
    /** Called once after a clear action (see `clearable`), following `onValueChange(null)`. */
    onClear?: () => void
    /**
     * Whether a pointer click on the control (outside the toggle and clear buttons) opens the
     * popup. Typing non-blank text, `ArrowDown`, and the toggle button open it regardless.
     * @default false
     */
    openOnControlClick?: boolean
    /** Receives the inner `<input>` element, for example to focus it programmatically. */
    inputRef?: Ref<HTMLInputElement>
    /**
     * Icon shown instead of `trailing` while `loading`.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Icon rendered before the input. */
    leading?: IconT.Name
    /**
     * Icon of the toggle button that opens and closes the popup; replaced by `loadingIcon` while
     * `loading`.
     * @default 'icon-chevron-down'
     */
    trailing?: IconT.Name
    /**
     * Icon of the clear button.
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

export type ComboboxProps<TItem extends string | ComboboxT.Item = string | ComboboxT.Item> =
  ComboboxT.Props<TItem>
