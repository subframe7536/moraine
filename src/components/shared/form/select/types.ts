import type { Component, JSX } from 'solid-js'

import type { ElementProps } from '../../../../shared/types'
import type { ListVirtualizer } from '../../../../virtualizer/virtualizer.types'
import type { BaseSelectT, BaseSelectValue } from '../../../base-select/base-select.types'
import type { IconT } from '../../../icon/index'

import type { SelectControlStyleVariants, SelectItemStyleSlot } from './style-types'

export interface SelectItem<
  V extends BaseSelectValue = BaseSelectValue,
> extends BaseSelectT.Item<V> {
  /** Icon rendered before the label in the default item content. Ignored when `itemRender` is set. */
  icon?: IconT.Name
  /** Secondary text rendered under the label in the default item content. Ignored when `itemRender` is set. */
  description?: JSX.Element
}
/** Shared visual variants for the Select-family field controls. */
export type SelectControlVariants = SelectControlStyleVariants
/** Shared item-content slots for collection-backed Select-family controls. */
export type SelectItemSlot<T = unknown> = SelectItemStyleSlot<T>
/** Item passed to callbacks and render props; a string item arrives as `{ value, label }`. */
export type NormalizedSelectItem<T extends string | BaseSelectT.Item> = T extends string
  ? { value: T; label: T }
  : T

export interface SelectGroup<T extends string | BaseSelectT.Item> {
  /** Structural group discriminator. */
  type: 'group'
  value?: never
  /** Heading rendered above the group's items. Not selectable. */
  label: JSX.Element
  /**
   * Items in the group. Item values must be unique across the whole collection, not just the
   * group: a repeated value is ignored (the first occurrence wins). A group with no remaining
   * items, or none matching the current search, renders nothing.
   */
  items: T[]
}
export interface SelectSeparator {
  /** Structural separator discriminator. */
  type: 'separator'
  value?: never
}
export type SelectEntry<T extends string | BaseSelectT.Item> = T | SelectGroup<T> | SelectSeparator
export type SelectRow<T extends BaseSelectT.Item> =
  | { type: 'label'; key: string; label: JSX.Element; values: T['value'][] }
  | { type: 'item'; key: string; item: T }
  | { type: 'separator'; key: string }
export interface SelectView<T extends BaseSelectT.Item> {
  items: T[]
  rows: SelectRow<T>[]
  byValue?: ReadonlyMap<T['value'], T>
}
export type SelectVirtualizer<T extends BaseSelectT.Item> = ListVirtualizer<SelectRow<T>>
export interface SearchProps<T extends BaseSelectT.Item> {
  /**
   * Controlled search text. `undefined` keeps the text uncontrolled. The component also resets
   * the text to `''` when the popup finishes closing, after a native form reset, and (in
   * `MultiSelect`) after the selection changes; in controlled mode these resets are reported
   * through `onSearchValueChange('')` and you decide whether to apply them.
   */
  searchValue?: string
  /**
   * Initial search text when `searchValue` is not set.
   * @default ''
   */
  defaultSearchValue?: string
  /**
   * Called with the new search text when it changes, including the component's own resets to
   * `''`. The text is already truncated to `searchMaxLength`. During IME composition it fires
   * once the composition ends.
   */
  onSearchValueChange?: (value: string) => void
  /**
   * Maximum number of characters in the search text. Applied as the input's `maxLength` and by
   * truncating text the user commits; a controlled `searchValue` is not truncated. Unlimited when
   * omitted.
   */
  searchMaxLength?: number
  /**
   * Native `autocomplete` attribute of the search input. In `MultiSelect` the input exists only
   * when `searchable` or `createItem` is set.
   * @default 'off'
   */
  autoComplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']
  /**
   * How items are matched against the search text; filtering runs only while the text is not
   * empty. The named strategies compare the item's plain-text label (see `getItemLabel`)
   * ignoring case and accents using the active locale. A predicate receives the search text and
   * the item (string items arrive as `{ value, label }`) and returns whether the item stays
   * visible; it replaces the built-in matching. `false` always shows every item (use it when you
   * filter on the server). Groups with no visible items are hidden. In `MultiSelect`, filtering
   * applies only when `searchable` or `createItem` is set.
   * @default 'contains'
   * @example
   * ```tsx
   * import { Combobox } from 'moraine'
   *
   * <Combobox
   *   items={[
   *     { label: 'Apple', value: 'apple', description: 'Red fruit' },
   *     { label: 'Lime', value: 'lime', description: 'Green fruit' },
   *   ]}
   *   filterMethod={(query, item) =>
   *     `${item.value} ${item.description}`.toLowerCase().includes(query.toLowerCase())
   *   }
   * />
   * ```
   */
  filterMethod?:
    | false
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | ((query: string, item: T) => boolean)
}
export interface ContentProps<T extends BaseSelectT.Item> extends BaseSelectT.PopupProps {
  /**
   * Replaces the default content of every item row (icon, label, description, and selected
   * check). The row element itself (`role="option"`, click and hover handling) stays owned by the
   * component. Receives `{ item, selected, highlighted, disabled }`; for `Select` and `Combobox`
   * string items arrive as `{ value, label }`. Declare the parameter even when unused: a
   * zero-argument function is called as an accessor, not mounted as a component.
   * @example
   * ```tsx
   * import { Select } from 'moraine'
   *
   * <Select
   *   items={[
   *     { label: 'Free', value: 'free' },
   *     { label: 'Pro', value: 'pro' },
   *   ]}
   *   itemRender={(state) => (
   *     <span>
   *       {state.item.label}
   *       {state.selected ? ' ✓' : ''}
   *     </span>
   *   )}
   * />
   * ```
   */
  itemRender?: Component<BaseSelectT.ItemRenderProps<T>>
  /**
   * Returns extra attributes spread on each item row, computed per item from the same state as
   * `itemRender`. `class`, `style`, `ref`, and the `onClick`, `onPointerMove`, and `onPointerDown`
   * handlers are merged with the component's own; calling `event.preventDefault()` in `onClick`
   * stops the selection. `id`, `tabIndex`, `aria-selected`, and `aria-disabled` stay
   * component-owned.
   * @example
   * ```tsx
   * import { Select } from 'moraine'
   *
   * <Select
   *   items={['Apple', 'Pear']}
   *   itemProps={(state) => ({ 'data-testid': `option-${state.item.value}` })}
   * />
   * ```
   */
  itemProps?: (state: BaseSelectT.ItemRenderProps<T>) => ElementProps<HTMLDivElement> | undefined
  /**
   * Extra attributes spread on the listbox `div` inside the popup, such as `aria-label`, `data-*`
   * or an `onScroll` handler (calling `event.preventDefault()` there skips `onBottomReached`).
   * `id` and `tabIndex` stay component-owned.
   */
  listboxProps?: ElementProps<HTMLDivElement>
  /**
   * Renders only the visible rows, such as `createListVirtualizer()` from `moraine/virtualizer`
   * typed over `ComboboxT.Row`. Rows include group labels and separators. The listbox is the
   * scroll container, items get `aria-posinset` and `aria-setsize`, and keyboard highlight scrolls
   * through the virtualizer. Not available on `Select`.
   * @example
   * ```tsx
   * import { Combobox } from 'moraine'
   * import type { ComboboxT } from 'moraine'
   * import { createListVirtualizer } from 'moraine/virtualizer'
   *
   * const items = Array.from({ length: 5000 }, (_, index) => `Item ${index}`)
   * const virtualizer = createListVirtualizer<ComboboxT.Row<string>>({ estimateSize: () => 32 })
   *
   * <Combobox items={items} virtualizer={virtualizer} />
   * ```
   */
  virtualizer?: SelectVirtualizer<T>
  /**
   * Called once each time scrolling brings the listbox within `scrollThreshold` of its end,
   * for example to load the next page. It fires again only after the user scrolls away from the
   * bottom and back.
   */
  onBottomReached?: () => void
  /**
   * Distance from the end of the listbox, in pixels, within which `onBottomReached` fires.
   * @default 20
   */
  scrollThreshold?: number
}
