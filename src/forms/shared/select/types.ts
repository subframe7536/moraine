import type { Component, JSX } from 'solid-js'

import type { IconT } from '../../../elements/icon/index.ts'
import type { ListT } from '../../../elements/list/index.ts'
import type { ComponentOrElement } from '../../../shared/render-prop.ts'
import type { ElementProps } from '../../../shared/types.ts'
import type { BaseSelectT, BaseSelectValue } from '../../base-select/base-select.types.ts'

import type { SelectControlStyleVariant, SelectItemStyleSlot } from './style-types.ts'

export interface SelectItem<
  V extends BaseSelectValue = BaseSelectValue,
> extends BaseSelectT.Item<V> {
  /** Leading item icon. */
  icon?: IconT.Name
  /** Secondary item description. */
  description?: JSX.Element
}
/** Shared visual variants for the Select-family field controls. */
export type SelectControlVariant = SelectControlStyleVariant
/** Shared item-content slots for collection-backed Select-family controls. */
export type SelectItemSlot<T = unknown> = SelectItemStyleSlot<T>
export type NormalizedSelectItem<T extends string | BaseSelectT.Item> = T extends string
  ? { value: T; label: T }
  : T

export interface SelectGroup<T extends string | BaseSelectT.Item> {
  /** Structural group discriminator. */
  type: 'group'
  value?: never
  label: JSX.Element
  items: T[]
}
export type SelectEntry<T extends string | BaseSelectT.Item> = T | SelectGroup<T>
export type SelectRow<T extends BaseSelectT.Item> =
  | { type: 'label'; key: string; label: JSX.Element; values: T['value'][] }
  | { type: 'item'; key: string; item: T }
export interface SelectView<T extends BaseSelectT.Item> {
  items: T[]
  rows: SelectRow<T>[]
  byValue?: ReadonlyMap<T['value'], T>
}
export type SelectVirtualRenderProps<T extends BaseSelectT.Item> = ListT.VirtualRenderProps<
  SelectRow<T>,
  HTMLDivElement,
  HTMLDivElement
>
export interface SearchProps<T extends BaseSelectT.Item> {
  /** Controlled search text. */
  searchValue?: string
  /**
   * Initial search text.
   * @default ''
   */
  defaultSearchValue?: string
  /** Called when search text changes. */
  onSearch?: (value: string) => void
  /** Maximum committed search length. */
  searchMaxLength?: number
  /**
   * The autocomplete attribute for the search input.
   * @default 'off'
   */
  autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']
  /**
   * Filtering strategy or predicate receiving the raw item.
   * @default true
   */
  filterItem?:
    | boolean
    | 'startsWith'
    | 'endsWith'
    | 'contains'
    | ((query: string, item: T) => boolean)
}
export interface ContentProps<T extends BaseSelectT.Item> {
  /** Custom item presentation. */
  itemRender?: ComponentOrElement<BaseSelectT.ItemRenderProps<T>>
  /** Additional row attributes. */
  itemProps?: (state: BaseSelectT.ItemRenderProps<T>) => ElementProps<HTMLDivElement> | undefined
  /** Additional listbox attributes. */
  listboxProps?: ElementProps<HTMLDivElement>
  /** Virtual rendering adapter. */
  virtualRender?: Component<SelectVirtualRenderProps<T>>
  /** Scroll a highlighted item to its logical entry index. */
  scrollToItem?: (item: T, entryIndex: number) => void
  /** Called once when scrolling reaches the bottom. */
  onScrollBottom?: () => void
  /**
   * Bottom threshold in pixels.
   * @default 20
   */
  scrollBottomThreshold?: number
  /**
   * Anchor gap in pixels.
   * @default 0
   */
  gutter?: number
  /**
   * Collision padding in pixels.
   * @default 4
   */
  overflowPadding?: number
}
