import type { Accessor, JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
import { callHandler, cn, useId } from '../../shared/utils'

import type { ListBoxVariantProps } from './list-box.class'
import { listBoxContentVariants, listBoxItemVariants } from './list-box.class'

export namespace ListBoxT {
  /** Value used to identify a selectable item. */
  export type Value = string | number

  /** Determines whether the list is static or supports single/multiple selection. */
  export type SelectionMode = 'none' | 'single' | 'multiple'

  /**
   * Filtering strategy applied when `searchValue` is not empty.
   * `true` uses substring matching and `false` disables filtering.
   */
  export type FilterOption<TItem extends Item = Item> =
    | boolean
    | 'startsWith'
    | 'endsWith'
    | 'contains'
    | ((searchValue: string, item: TItem) => boolean)

  export interface Item<TValue extends Value = Value> {
    /** Optional discriminator for item entries. */
    type?: 'item'
    /** Unique value used for selection, highlighting, and element identity. */
    value: TValue
    /** Primary item content. */
    label?: JSX.Element
    /** Secondary item content displayed below the label. */
    description?: JSX.Element
    /** Whether the item cannot be highlighted or selected. */
    disabled?: boolean
    /** Additional terms included by the default filter. */
    keywords?: string[]
    /** Renders content before the item label. */
    leadingRender?: (context: ItemRenderContext<Item<TValue>>) => JSX.Element
    /** Renders content after the item label and description. */
    trailingRender?: (context: ItemRenderContext<Item<TValue>>) => JSX.Element
  }

  export interface LabelItem {
    /** Discriminator for label entries. */
    type: 'label'
    /** Optional stable key for virtual renderers. */
    key?: string
    /** Label content. */
    label: JSX.Element
  }

  export interface SeparatorItem {
    /** Discriminator for separator entries. */
    type: 'separator'
    /** Optional stable key for virtual renderers. */
    key?: string
  }

  export type Entry<TItem extends Item = Item> = TItem | LabelItem | SeparatorItem

  export interface ItemRenderContext<TItem extends { value: Value } = Item> {
    /** Source item being rendered. */
    item: TItem
    /** Current index in the filtered entry list. */
    index: number
    /** Whether keyboard or pointer navigation currently highlights the item. */
    highlighted: boolean
    /** Whether the item value is currently selected. */
    selected: boolean
    /** Whether the item cannot be highlighted or selected. */
    disabled: boolean
    /** Selects or toggles the item according to `selectionMode`. */
    select: () => void
  }

  export interface VirtualRenderContext<TItem extends Item = Item> {
    /** Filtered entries that should be rendered. */
    entries: Entry<TItem>[]
    /** Renders an entry with the component's semantics and styles. */
    renderItem: (entry: Entry<TItem>, index: number) => JSX.Element
  }

  export interface Slot<T = unknown> {
    /** Root list element. */
    content?: T
    /** Structural label row. */
    label?: T
    /** Structural separator row. */
    separator?: T
    /** Selectable item row. */
    item?: T
    /** Leading item content. */
    itemLeading?: T
    /** Wrapper around the label and description. */
    itemWrapper?: T
    /** Item label. */
    itemLabel?: T
    /** Item description. */
    itemDescription?: T
    /** Trailing item content. */
    itemTrailing?: T
    /** Empty-state row. */
    empty?: T
  }

  export type Variant = ListBoxVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** ListBox-specific props before shared styling props are applied. */
  export interface Base<TItem extends Item = Item> {
    /** Root element ID used to derive option IDs. */
    id?: string
    /** Accessible name for the interactive listbox element. */
    ariaLabel?: string
    /** IDs of elements that label the interactive listbox element. */
    ariaLabelledby?: string
    /** Items and structural rows to display. */
    items?: Entry<TItem>[]
    /**
     * Selection behavior for the list.
     * @default 'none'
     */
    selectionMode?: SelectionMode
    /** Controlled selected value or values. */
    value?: Value | Value[] | null
    /** Initial selected value or values for uncontrolled usage. */
    defaultValue?: Value | Value[] | null
    /** Called when selection changes. */
    onChange?: (value: Value | Value[] | null) => void
    /** Called after an item is selected or toggled. */
    onSelect?: (item: TItem, context: ItemRenderContext<TItem>) => void
    /** External search text used to filter item entries. */
    searchValue?: string
    /**
     * Item filtering strategy.
     * @default true
     */
    filterOption?: FilterOption<TItem>
    /** Returns searchable text when labels are not plain strings. */
    getItemSearchText?: (item: TItem) => string
    /** Replaces the default contents of every item row. */
    itemRender?: (context: ItemRenderContext<TItem>) => JSX.Element
    /** Renders the empty state when no item entries remain. */
    emptyRender?: () => JSX.Element
    /** Returns additional attributes for an item row. */
    itemProps?: (context: ItemRenderContext<TItem>) => JSX.HTMLAttributes<HTMLLIElement>
    /** Enables delegation to `virtualRender`. */
    virtualized?: boolean
    /** Renders filtered entries through a caller-provided virtualization layer. */
    virtualRender?: (context: VirtualRenderContext<TItem>) => JSX.Element
    /** Called when keyboard navigation highlights an item. */
    scrollToItem?: (value: Value) => void
  }

  export interface Props<TItem extends Item = Item> extends BaseProps<Base<TItem>, Variant, Slot> {}
}

export interface ListBoxProps<
  TItem extends ListBoxT.Item = ListBoxT.Item,
> extends ListBoxT.Props<TItem> {}

function isItemEntry<TItem extends ListBoxT.Item>(entry: ListBoxT.Entry<TItem>): entry is TItem {
  return entry.type === 'item' || entry.type === undefined
}

function toSelectedValues(
  value: ListBoxT.Value | ListBoxT.Value[] | null | undefined,
): ListBoxT.Value[] {
  if (Array.isArray(value)) {
    return value
  }

  if (value === null || value === undefined) {
    return []
  }

  return [value]
}

function getItemText(item: ListBoxT.Item): string {
  if (typeof item.label === 'string') {
    return item.label
  }

  return [item.value, item.keywords?.join(' ')].filter(Boolean).join(' ')
}

function matchesFilter<TItem extends ListBoxT.Item>(
  item: TItem,
  searchValue: string,
  filterOption: ListBoxT.FilterOption<TItem> | undefined,
  getItemSearchText: ((item: TItem) => string) | undefined,
): boolean {
  if (!searchValue.trim() || filterOption === false) {
    return true
  }

  if (typeof filterOption === 'function') {
    return filterOption(searchValue, item)
  }

  const text = (getItemSearchText?.(item) ?? getItemText(item)).toLocaleLowerCase()
  const value = searchValue.toLocaleLowerCase()
  const strategy = filterOption === true || filterOption === undefined ? 'contains' : filterOption

  if (strategy === 'startsWith') {
    return text.startsWith(value)
  }

  if (strategy === 'endsWith') {
    return text.endsWith(value)
  }

  return text.includes(value)
}

/** Renders a flat semantic list with optional filtering and selection behavior. */
export function ListBox<TItem extends ListBoxT.Item = ListBoxT.Item>(
  props: ListBoxProps<TItem>,
): JSX.Element {
  type EntryProps = {
    entry: ListBoxT.Entry<TItem>
    index: Accessor<number>
  }
  type OptionProps = {
    item: TItem
    index: Accessor<number>
  }

  const merged = mergeProps(
    {
      selectionMode: 'none' as const,
      filterOption: true as const,
    },
    props,
  )
  const listBoxId = useId(() => merged.id, 'list-box')
  const [uncontrolledValue, setUncontrolledValue] = useControllableValue<
    ListBoxT.Value | ListBoxT.Value[] | null
  >({
    value: () => merged.value,
    defaultValue: () => merged.defaultValue ?? (merged.selectionMode === 'multiple' ? [] : null),
  })
  const [highlightedValue, setHighlightedValue] = createSignal<ListBoxT.Value | undefined>()
  let contentRef: HTMLUListElement | undefined
  const items = createMemo(() => merged.items ?? [])
  const visibleEntries = createMemo(() =>
    items().filter((entry) => {
      if (!isItemEntry(entry)) {
        return true
      }

      return matchesFilter(
        entry,
        merged.searchValue ?? '',
        merged.filterOption,
        merged.getItemSearchText,
      )
    }),
  )
  const visibleItems = createMemo(() => visibleEntries().filter(isItemEntry))
  const selectedValues = createMemo(() => new Set(toSelectedValues(uncontrolledValue())))
  const isInteractive = createMemo(() => merged.selectionMode !== 'none')
  const activeDescendantId = createMemo(() => {
    if (!isInteractive()) {
      return undefined
    }

    const value = highlightedValue()
    if (value === undefined) {
      return undefined
    }

    return `${listBoxId()}-${encodeURIComponent(String(value))}`
  })

  createEffect(() => {
    if (!isInteractive()) {
      setHighlightedValue(undefined)
      return
    }

    const enabledItems = visibleItems().filter((item) => !item.disabled)
    const highlighted = highlightedValue()
    if (highlighted !== undefined && enabledItems.some((item) => item.value === highlighted)) {
      return
    }

    const selected = enabledItems.find((item) => selectedValues().has(item.value))
    setHighlightedValue(selected?.value ?? enabledItems[0]?.value)
  })

  function createItemContext(
    item: Accessor<TItem>,
    index: Accessor<number>,
  ): ListBoxT.ItemRenderContext<TItem> {
    return {
      get item() {
        return item()
      },
      get index() {
        return index()
      },
      get highlighted() {
        return highlightedValue() === item().value
      },
      get selected() {
        return selectedValues().has(item().value)
      },
      get disabled() {
        return Boolean(item().disabled)
      },
      select: () => selectItem(item(), index()),
    }
  }

  function selectItem(item: TItem, index: number): void {
    if (item.disabled || !isInteractive()) {
      return
    }

    const context = createItemContext(
      () => item,
      () => index,
    )
    const currentValues = selectedValues()
    let nextValue: ListBoxT.Value | ListBoxT.Value[] | null

    if (merged.selectionMode === 'multiple') {
      nextValue = currentValues.has(item.value)
        ? [...currentValues].filter((value) => value !== item.value)
        : [...currentValues, item.value]
    } else {
      nextValue = item.value
    }

    setUncontrolledValue(nextValue)
    merged.onChange?.(nextValue)
    merged.onSelect?.(item, context)
  }

  const { onNavigationKeyDown } = useSelectableCollectionNavigation<TItem, ListBoxT.Value>({
    items: visibleItems,
    getValue: (item) => item.value,
    isDisabled: (item) => Boolean(item.disabled),
    loop: () => true,
    activationMode: () => 'manual',
    focusValue: (value) => {
      setHighlightedValue(value)
      merged.scrollToItem?.(value)
    },
    onSelect: (value) => {
      const item = visibleItems().find((candidate) => candidate.value === value)
      if (item) {
        selectItem(item, visibleEntries().indexOf(item))
      }
    },
  })

  function handleKeyDown(event: KeyboardEvent): void {
    if (!isInteractive()) {
      return
    }

    onNavigationKeyDown(event, highlightedValue(), 'vertical')
  }

  function focusContent(): void {
    if (isInteractive() && document.activeElement !== contentRef) {
      contentRef?.focus({ preventScroll: true })
    }
  }

  function ListBoxOption(optionProps: OptionProps): JSX.Element {
    const context = createItemContext(
      () => optionProps.item,
      () => optionProps.index(),
    )
    const itemAttributes = createMemo(() => merged.itemProps?.(context))
    const itemStyle = createMemo(() => {
      const style = itemAttributes()?.style
      return typeof style === 'object' ? style : {}
    })

    return (
      <li
        {...itemAttributes()}
        id={`${listBoxId()}-${encodeURIComponent(String(optionProps.item.value))}`}
        role={isInteractive() ? 'option' : undefined}
        aria-disabled={optionProps.item.disabled || undefined}
        aria-selected={isInteractive() ? context.selected : undefined}
        data-slot="item"
        data-disabled={optionProps.item.disabled ? '' : undefined}
        data-highlighted={context.highlighted ? '' : undefined}
        data-selected={context.selected ? '' : undefined}
        style={{
          ...itemStyle(),
          ...merged.styles?.item,
        }}
        class={listBoxItemVariants(
          { size: merged.size },
          itemAttributes()?.class,
          merged.classes?.item,
        )}
        onPointerMove={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onPointerMove)
          if (!defaultPrevented && isInteractive() && !optionProps.item.disabled) {
            setHighlightedValue(optionProps.item.value)
          }
        }}
        onClick={(event) => {
          focusContent()
          const { defaultPrevented } = callHandler(event, itemAttributes()?.onClick)
          if (!defaultPrevented) {
            selectItem(optionProps.item, optionProps.index())
          }
        }}
      >
        <Show
          when={merged.itemRender}
          fallback={
            <>
              <Show when={optionProps.item.leadingRender}>
                {(leadingRender) => (
                  <span
                    data-slot="itemLeading"
                    style={merged.styles?.itemLeading}
                    class={cn('shrink-0', merged.classes?.itemLeading)}
                  >
                    {leadingRender()(context)}
                  </span>
                )}
              </Show>
              <span
                data-slot="itemWrapper"
                style={merged.styles?.itemWrapper}
                class={cn('flex flex-1 flex-col min-w-0', merged.classes?.itemWrapper)}
              >
                <Show when={optionProps.item.label}>
                  <span
                    data-slot="itemLabel"
                    style={merged.styles?.itemLabel}
                    class={cn(merged.classes?.itemLabel)}
                  >
                    {optionProps.item.label}
                  </span>
                </Show>
                <Show when={optionProps.item.description}>
                  <span
                    data-slot="itemDescription"
                    style={merged.styles?.itemDescription}
                    class={cn('text-xs text-muted-foreground', merged.classes?.itemDescription)}
                  >
                    {optionProps.item.description}
                  </span>
                </Show>
              </span>
              <Show when={optionProps.item.trailingRender}>
                {(trailingRender) => (
                  <span
                    data-slot="itemTrailing"
                    style={merged.styles?.itemTrailing}
                    class={cn(merged.classes?.itemTrailing)}
                  >
                    {trailingRender()(context)}
                  </span>
                )}
              </Show>
            </>
          }
        >
          {(itemRender) => itemRender()(context)}
        </Show>
      </li>
    )
  }

  function ListBoxEntry(entryProps: EntryProps): JSX.Element {
    return (
      <Show
        when={entryProps.entry.type === 'label'}
        fallback={
          <Show
            when={entryProps.entry.type === 'separator'}
            fallback={<ListBoxOption item={entryProps.entry as TItem} index={entryProps.index} />}
          >
            <li
              role={isInteractive() ? 'presentation' : 'separator'}
              aria-hidden={isInteractive() || undefined}
              data-slot="separator"
              style={merged.styles?.separator}
              class={cn('my-1 bg-border h-px', merged.classes?.separator)}
            />
          </Show>
        }
      >
        <li
          role={isInteractive() ? 'presentation' : undefined}
          aria-hidden={isInteractive() || undefined}
          data-slot="label"
          style={merged.styles?.label}
          class={cn('text-xs text-muted-foreground font-medium px-2 py-1.5', merged.classes?.label)}
        >
          {(entryProps.entry as ListBoxT.LabelItem).label}
        </li>
      </Show>
    )
  }

  return (
    <ul
      ref={(element) => {
        contentRef = element
      }}
      id={listBoxId()}
      role={isInteractive() ? 'listbox' : undefined}
      aria-label={merged.ariaLabel}
      aria-labelledby={merged.ariaLabelledby}
      aria-multiselectable={merged.selectionMode === 'multiple' || undefined}
      aria-activedescendant={activeDescendantId()}
      tabIndex={isInteractive() ? 0 : undefined}
      data-slot="content"
      style={{ ...merged.styles?.content, ...merged.style }}
      class={listBoxContentVariants({ size: merged.size }, merged.classes?.content, merged.class)}
      onKeyDown={handleKeyDown}
    >
      <Show
        when={visibleItems().length > 0}
        fallback={
          <li
            role={isInteractive() ? 'presentation' : undefined}
            data-slot="empty"
            style={merged.styles?.empty}
            class={cn('text-muted-foreground p-3 text-center', merged.classes?.empty)}
          >
            {merged.emptyRender?.() ?? 'No results.'}
          </li>
        }
      >
        <Show
          when={merged.virtualized && merged.virtualRender}
          fallback={
            <For each={visibleEntries()}>
              {(entry, index) => <ListBoxEntry entry={entry} index={index} />}
            </For>
          }
        >
          {(virtualRender) =>
            virtualRender()({
              entries: visibleEntries(),
              renderItem: (entry, index) => <ListBoxEntry entry={entry} index={() => index} />,
            })
          }
        </Show>
      </Show>
    </ul>
  )
}
