import type { Accessor, JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps } from 'solid-js'

import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { callHandler, cn, useId } from '../../shared/utils'

import type { ListBoxVariantProps } from './list-box.class'
import { listBoxContentVariants, listBoxItemVariants } from './list-box.class'

export namespace ListBoxT {
  export type Value = string | number
  export type SelectionMode = 'none' | 'single' | 'multiple'
  export type FilterOption<TItem extends Item = Item> =
    | boolean
    | 'startsWith'
    | 'endsWith'
    | 'contains'
    | ((searchValue: string, item: TItem) => boolean)

  export interface Item<TValue extends Value = Value> {
    type?: 'item'
    value: TValue
    label?: JSX.Element
    description?: JSX.Element
    disabled?: boolean
    keywords?: string[]
    leadingRender?: (context: ItemRenderContext<{ value: Value }>) => JSX.Element
    trailingRender?: (context: ItemRenderContext<{ value: Value }>) => JSX.Element
  }

  export interface LabelItem {
    type: 'label'
    key?: string
    label: JSX.Element
  }

  export interface SeparatorItem {
    type: 'separator'
    key?: string
  }

  export type Entry<TItem extends Item = Item> = TItem | LabelItem | SeparatorItem

  export interface ItemRenderContext<TItem extends { value: Value } = Item> {
    item: TItem
    index: number
    highlighted: boolean
    selected: boolean
    disabled: boolean
    select: () => void
  }

  export interface VirtualRenderContext<TItem extends Item = Item> {
    entries: Entry<TItem>[]
    renderItem: (entry: Entry<TItem>, index: number) => JSX.Element
  }

  export interface Slot<T = unknown> {
    content?: T
    label?: T
    separator?: T
    item?: T
    itemLeading?: T
    itemWrapper?: T
    itemLabel?: T
    itemDescription?: T
    itemTrailing?: T
    empty?: T
  }

  export type Variant = ListBoxVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base<TItem extends Item = Item> {
    id?: string
    items?: Entry<TItem>[]
    selectionMode?: SelectionMode
    value?: Value | Value[] | null
    defaultValue?: Value | Value[] | null
    onChange?: (value: Value | Value[] | null) => void
    onSelect?: (item: TItem, context: ItemRenderContext<TItem>) => void
    searchValue?: string
    filterOption?: FilterOption<TItem>
    getItemSearchText?: (item: TItem) => string
    itemRender?: (context: ItemRenderContext<TItem>) => JSX.Element
    emptyRender?: () => JSX.Element
    itemProps?: (context: ItemRenderContext<TItem>) => JSX.HTMLAttributes<HTMLLIElement>
    virtualized?: boolean
    virtualRender?: (context: VirtualRenderContext<TItem>) => JSX.Element
    scrollToItem?: (value: Value) => void
  }

  export interface Props<TItem extends Item = Item> extends BaseProps<Base<TItem>, Variant, Slot> {}
}

export interface ListBoxProps<
  TItem extends ListBoxT.Item = ListBoxT.Item,
> extends ListBoxT.Props<TItem> {}

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

export function ListBox<TItem extends ListBoxT.Item = ListBoxT.Item>(
  props: ListBoxProps<TItem>,
): JSX.Element {
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
  const items = createMemo(() => merged.items ?? [])
  const visibleEntries = createMemo(() =>
    items().filter((entry) =>
      entry.type === 'item' || entry.type === undefined
        ? matchesFilter(
            entry as TItem,
            merged.searchValue ?? '',
            merged.filterOption,
            merged.getItemSearchText,
          )
        : true,
    ),
  )
  const visibleItems = createMemo(() =>
    visibleEntries().filter(
      (entry): entry is TItem => entry.type === 'item' || entry.type === undefined,
    ),
  )
  const selectedValues = createMemo(() => {
    const value = uncontrolledValue()
    return new Set(
      Array.isArray(value) ? value : value === null || value === undefined ? [] : [value],
    )
  })
  const isInteractive = createMemo(() => merged.selectionMode !== 'none')

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
    item: TItem,
    index: Accessor<number>,
  ): ListBoxT.ItemRenderContext<TItem> {
    return {
      item,
      get index() {
        return index()
      },
      get highlighted() {
        return highlightedValue() === item.value
      },
      get selected() {
        return selectedValues().has(item.value)
      },
      get disabled() {
        return Boolean(item.disabled)
      },
      select: () => selectItem(item, index()),
    }
  }

  function selectItem(item: TItem, index: number): void {
    if (item.disabled || !isInteractive()) {
      return
    }

    const context = createItemContext(item, () => index)
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

  function focusByOffset(offset: number): void {
    const enabledItems = visibleItems().filter((item) => !item.disabled)
    if (enabledItems.length === 0) {
      return
    }

    const currentIndex = enabledItems.findIndex((item) => item.value === highlightedValue())
    const nextIndex =
      currentIndex === -1
        ? offset > 0
          ? 0
          : enabledItems.length - 1
        : (currentIndex + offset + enabledItems.length) % enabledItems.length
    const item = enabledItems[nextIndex]
    if (!item) {
      return
    }

    setHighlightedValue(item.value)
    merged.scrollToItem?.(item.value)
  }

  function focusBoundary(kind: 'first' | 'last'): void {
    const enabledItems = visibleItems().filter((item) => !item.disabled)
    const item = kind === 'first' ? enabledItems[0] : enabledItems[enabledItems.length - 1]
    if (!item) {
      return
    }

    setHighlightedValue(item.value)
    merged.scrollToItem?.(item.value)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusByOffset(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusByOffset(-1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      focusBoundary('first')
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      focusBoundary('last')
      return
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      const item = visibleItems().find((candidate) => candidate.value === highlightedValue())
      if (!item) {
        return
      }

      event.preventDefault()
      selectItem(item, visibleItems().indexOf(item))
    }
  }

  function renderEntry(entry: ListBoxT.Entry<TItem>, index: Accessor<number>): JSX.Element {
    if (entry.type === 'label') {
      return (
        <li
          data-slot="label"
          style={merged.styles?.label}
          class={cn('text-xs text-muted-foreground font-medium px-2 py-1.5', merged.classes?.label)}
        >
          {entry.label}
        </li>
      )
    }

    if (entry.type === 'separator') {
      return (
        <li
          role="separator"
          data-slot="separator"
          style={merged.styles?.separator}
          class={cn('my-1 bg-border h-px', merged.classes?.separator)}
        />
      )
    }

    const item = entry as TItem
    const context = createItemContext(item, index)
    const itemAttributes = merged.itemProps?.(context)
    const selected = () => context.selected
    const highlighted = () => context.highlighted

    return (
      <li
        {...itemAttributes}
        id={`${listBoxId()}-${item.value}`}
        role={isInteractive() ? 'option' : undefined}
        aria-disabled={item.disabled || undefined}
        aria-selected={isInteractive() ? selected() : undefined}
        data-slot="item"
        data-disabled={item.disabled ? '' : undefined}
        data-highlighted={highlighted() ? '' : undefined}
        data-selected={selected() ? '' : undefined}
        style={{
          ...(typeof itemAttributes?.style === 'object' ? itemAttributes.style : {}),
          ...merged.styles?.item,
        }}
        class={listBoxItemVariants(
          { size: merged.size },
          itemAttributes?.class,
          merged.classes?.item,
        )}
        onPointerMove={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes?.onPointerMove)
          if (!defaultPrevented && isInteractive() && !item.disabled) {
            setHighlightedValue(item.value)
          }
        }}
        onClick={(event) => {
          const { defaultPrevented } = callHandler(event, itemAttributes?.onClick)
          if (!defaultPrevented) {
            selectItem(item, index())
          }
        }}
      >
        <Show
          when={merged.itemRender}
          fallback={
            <>
              <Show when={item.leadingRender}>
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
                <Show when={item.label}>
                  <span
                    data-slot="itemLabel"
                    style={merged.styles?.itemLabel}
                    class={cn(merged.classes?.itemLabel)}
                  >
                    {item.label}
                  </span>
                </Show>
                <Show when={item.description}>
                  <span
                    data-slot="itemDescription"
                    style={merged.styles?.itemDescription}
                    class={cn('text-xs text-muted-foreground', merged.classes?.itemDescription)}
                  >
                    {item.description}
                  </span>
                </Show>
              </span>
              <Show when={item.trailingRender}>
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

  const content = () => (
    <Show
      when={visibleItems().length > 0}
      fallback={
        <li
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
        fallback={<For each={visibleEntries()}>{(entry, index) => renderEntry(entry, index)}</For>}
      >
        {merged.virtualRender!({
          entries: visibleEntries(),
          renderItem: (entry, index) => renderEntry(entry, () => index),
        })}
      </Show>
    </Show>
  )

  return (
    <Show
      when={isInteractive()}
      fallback={
        <ul
          id={listBoxId()}
          data-slot="content"
          style={{ ...merged.styles?.content, ...merged.style }}
          class={listBoxContentVariants(
            { size: merged.size },
            merged.classes?.content,
            merged.class,
          )}
        >
          {content()}
        </ul>
      }
    >
      <ul
        id={listBoxId()}
        role="listbox"
        aria-multiselectable={merged.selectionMode === 'multiple' || undefined}
        tabIndex={0}
        data-slot="content"
        style={{ ...merged.styles?.content, ...merged.style }}
        class={listBoxContentVariants({ size: merged.size }, merged.classes?.content, merged.class)}
        onKeyDown={handleKeyDown}
      >
        {content()}
      </ul>
    </Show>
  )
}
