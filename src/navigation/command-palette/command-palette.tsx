import type { Component, JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { List } from '../../elements/list/index.ts'
import type { ListProps, ListT } from '../../elements/list/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation.ts'
import { callHandler, cn, useId } from '../../shared/utils.ts'

import {
  COMMAND_PALETTE_CLOSE_CLASS,
  COMMAND_PALETTE_EMPTY_CLASS,
  COMMAND_PALETTE_FOOTER_CLASS,
  COMMAND_PALETTE_GROUP_CLASS,
  COMMAND_PALETTE_INPUT_CLASS,
  COMMAND_PALETTE_INPUT_WRAPPER_CLASS,
  COMMAND_PALETTE_ITEM_CLASS,
  COMMAND_PALETTE_ITEM_DESCRIPTION_CLASS,
  COMMAND_PALETTE_ITEM_ICON_CLASS,
  COMMAND_PALETTE_ITEM_LABEL_CLASS,
  COMMAND_PALETTE_ITEM_WRAPPER_CLASS,
  COMMAND_PALETTE_LABEL_CLASS,
  COMMAND_PALETTE_LIST_CLASS,
  COMMAND_PALETTE_ROOT_CLASS,
  COMMAND_PALETTE_SEARCH_ICON_CLASS,
  COMMAND_PALETTE_SEARCH_INPUT_CLASS,
  COMMAND_PALETTE_TRAILING_CLASS,
} from './command-palette.class.ts'

export namespace CommandPaletteT {
  export type DescriptionPosition = 'bottom' | 'trailing'

  export interface Slot<T = unknown> {
    /**
     * Command palette container that owns search and option list.
     */
    root?: T

    /** Search row that groups input, search icon, and dismiss controls. */
    inputWrapper?: T

    /** Search input used to filter commands. */
    input?: T

    /** Scrollable command list that owns option and active-descendant semantics. */
    listbox?: T

    /** Bottom region for keyboard hints or custom footer content. */
    footer?: T

    /** Section wrapper for a group of command items. */
    group?: T

    /** Group heading text. */
    label?: T

    /** Command row that can be highlighted, selected, or disabled. */
    item?: T

    /** Leading region for a command row. */
    itemLeading?: T

    /** Text column that groups command label and description. */
    itemWrapper?: T

    /** Primary text for a command item. */
    itemLabel?: T

    /** Supporting text for a command item. */
    itemDescription?: T

    /** Trailing region for shortcuts or custom item metadata. */
    itemTrailing?: T

    /** Search icon or loading indicator displayed in the input row. */
    search?: T

    /** Button that dismisses the command palette. */
    close?: T

    /** Message shown when no command items match the search. */
    empty?: T
  }

  export type Variant = {}
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Group<TItem extends Item = Item> {
    /** Unique identifier for the group. */
    id: string
    /** Display name for the group header. */
    label?: string
    /** Items belonging to this group. */
    items?: TItem[]
  }

  export interface Item {
    /** Unique value for the item. */
    value: string
    /** Primary label for the item. */
    label?: string
    /** Secondary description text shown for the item. */
    description?: string
    /** Additional keywords included in built-in search matching. */
    keywords?: string[]
    /** Where the item description is rendered. Overrides the root setting. */
    descriptionPosition?: DescriptionPosition
    /** Custom visual rendered at the start of the item. */
    leadingRender?: ComponentOrElement<ItemRenderProps>
    /** Custom visual rendered at the end of the item. */
    trailingRender?: ComponentOrElement<ItemRenderProps>
    /** Whether the item is disabled and cannot be selected. */
    disabled?: boolean
    /** Whether this item should be excluded from built-in search filtering. */
    alwaysShow?: boolean
    /** Callback triggered when the item is selected. */
    onSelect?: () => void
  }

  export interface VirtualLabelEntry<TItem extends Item = Item> {
    /** Structural entry rendered before a command group. */
    type: 'label'
    /** Stable key used by a virtualizer. */
    key: string
    /** Visible group label. */
    label: string
    /** Source group containing the command. */
    group: Group<TItem>
  }

  export interface VirtualItemEntry<TItem extends Item = Item> {
    /** Selectable command entry. */
    type: 'item'
    /** Stable normalized command key. */
    key: string
    /** Source command. */
    item: TItem
    /** Source group containing the command. */
    group: Group<TItem>
    /** Whether the command cannot be selected. */
    disabled: boolean
  }

  export type VirtualEntry<TItem extends Item = Item> =
    | VirtualLabelEntry<TItem>
    | VirtualItemEntry<TItem>

  export type VirtualRenderProps<TItem extends Item = Item> = ListT.VirtualRenderProps<
    VirtualEntry<TItem>,
    HTMLDivElement,
    HTMLDivElement
  >

  export interface BaseContext<TItem extends Item = Item> {
    searchTerm: string
    loading: boolean
    hasItems: boolean
    groups: Group<TItem>[]
    visibleGroups: Group<TItem>[]
  }

  export interface ItemRenderProps<TItem extends Item = Item> extends BaseContext<TItem> {
    item: TItem
    group: Group<TItem>
    focused: boolean
    active: boolean
    /** Compatibility alias for the currently active item state. */
    selected: boolean
    disabled: boolean
  }

  export type EmptyRenderProps<TItem extends Item = Item> = BaseContext<TItem>
  export type FooterRenderProps<TItem extends Item = Item> = BaseContext<TItem>

  export interface Base<TItem extends Item = Item> {
    /**
     * Command groups to display initially.
     * @default []
     */
    groups?: Group<TItem>[]
    /**
     * Placeholder text for the search input.
     * @default 'Search...'
     */
    placeholder?: string
    /** Controlled search term. */
    searchTerm?: string
    /** Callback triggered when the search term changes. */
    onSearchTermChange?: (term: string) => void
    /** Callback triggered when an enabled item is selected. */
    onSelect?: (item: TItem) => void
    /** Maximum allowed length for the search text. */
    searchMaxLength?: number
    /**
     * Whether to focus the search input automatically on mount.
     * @default true
     */
    autofocus?: boolean
    /**
     * Icon name of input's leading icon.
     * @default 'icon-search'
     */
    leadingIcon?: IconT.Name
    /**
     * Icon name of input's leading icon for the loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /**
     * Icon name for the palette close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name
    /**
     * Whether to show a close button in the header.
     * @default false
     */
    showClose?: boolean
    /** Callback triggered when the close button is clicked or selection requests closing. */
    onClose?: () => void
    /**
     * Whether to request closing the palette after an enabled item is selected.
     * @default true
     */
    closeOnSelect?: boolean
    /**
     * Whether the palette is in a loading state.
     * @default false
     */
    loading?: boolean
    /**
     * Disable built-in search filtering and render all provided items.
     * @default false
     */
    disableFilter?: boolean
    /** Custom search text builder for built-in filtering. */
    getItemSearchText?: (item: TItem, group: Group<TItem>) => string
    /** Custom filter function that fully controls which groups and items are visible. */
    filterItems?: (args: { groups: Group<TItem>[]; searchTerm: string }) => Group<TItem>[]
    /**
     * Where descriptions render by default.
     * @default 'bottom'
     */
    descriptionPosition?: DescriptionPosition
    /** Custom empty state renderer. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /** Custom footer renderer. */
    footerRender?: ComponentOrElement<FooterRenderProps<TItem>>
    /** Custom command row content renderer. */
    itemRender?: ComponentOrElement<ItemRenderProps<TItem>>
    /** Renders flattened group labels and commands through a virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted command into view using its flattened entry index. */
    scrollToItem?: (item: TItem, entryIndex: number) => void
    /** Additional attributes for the command listbox. */
    listboxProps?: ElementProps<HTMLDivElement>
    /** Additional attributes for a command row. */
    itemProps?: (context: ItemRenderProps<TItem>) => ElementProps<HTMLDivElement> | undefined
    /** Additional props of input */
    inputProps?: JSX.HTMLAttributes<HTMLInputElement>
  }

  export type Props<TItem extends Item = Item> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export interface CommandPaletteProps<
  TItem extends CommandPaletteT.Item = CommandPaletteT.Item,
> extends CommandPaletteT.Props<TItem> {}

interface NormalizedItem<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> {
  key: string
  label: string
  searchText: string
  disabled: boolean
  item: TItem
  group: CommandPaletteT.Group<TItem>
  alwaysShow: boolean
}

interface NormalizedGroup<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> {
  source: CommandPaletteT.Group<TItem>
  label: string
  items: NormalizedItem<TItem>[]
}

function toStyleObject(
  style: string | JSX.CSSProperties | undefined,
): JSX.CSSProperties | undefined {
  return typeof style === 'object' ? style : undefined
}

function callRef<T extends HTMLElement>(
  ref: T | ((element: T) => void) | undefined,
  element: T,
): void {
  if (typeof ref === 'function') {
    ref(element)
  }
}

function buildItemLabel(item: CommandPaletteT.Item): string {
  return item.label || item.value
}

function buildItemSearchText<TItem extends CommandPaletteT.Item>(
  item: TItem,
  group: CommandPaletteT.Group<TItem>,
  getItemSearchText: ((item: TItem, group: CommandPaletteT.Group<TItem>) => string) | undefined,
): string {
  if (getItemSearchText) {
    return getItemSearchText(item, group).toLowerCase()
  }

  return [item.label, item.value, item.description, item.keywords?.join(' ')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function createNormalizedGroups<TItem extends CommandPaletteT.Item>(
  groups: CommandPaletteT.Group<TItem>[],
  getItemSearchText: ((item: TItem, group: CommandPaletteT.Group<TItem>) => string) | undefined,
  warnDuplicateValue: (value: string) => void,
): NormalizedGroup<TItem>[] {
  const seenValues = new Set<string>()
  const seenKeys = new Set<string>()

  const createItemKey = (value: string, groupId: string, itemIndex: number): string => {
    if (!seenKeys.has(value)) {
      seenKeys.add(value)
      return value
    }

    let suffix = 0
    let key = `${value}::${groupId}:${itemIndex}`
    while (seenKeys.has(key)) {
      suffix += 1
      key = `${value}::${groupId}:${itemIndex}:${suffix}`
    }

    seenKeys.add(key)
    return key
  }

  return groups.map((group) => ({
    source: group,
    label: group.label ?? '',
    items: (group.items ?? []).map((item, index) => {
      if (seenValues.has(item.value)) {
        warnDuplicateValue(item.value)
      }

      seenValues.add(item.value)
      const label = buildItemLabel(item)

      return {
        key: createItemKey(item.value, group.id, index),
        label,
        searchText: buildItemSearchText(item, group, getItemSearchText),
        disabled: Boolean(item.disabled),
        item,
        group,
        alwaysShow: Boolean(item.alwaysShow),
      }
    }),
  }))
}

/**
 * CommandPalette is a component for displaying a searchable list of commands or options, optionally grouped into categories. It supports keyboard navigation and customizable rendering through slots and styles.
 */
export function CommandPalette<TItem extends CommandPaletteT.Item = CommandPaletteT.Item>(
  props: CommandPaletteProps<TItem>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'groups',
    'placeholder',
    'searchTerm',
    'onSearchTermChange',
    'onSelect',
    'searchMaxLength',
    'autofocus',
    'leadingIcon',
    'loadingIcon',
    'closeIcon',
    'showClose',
    'onClose',
    'closeOnSelect',
    'loading',
    'disableFilter',
    'getItemSearchText',
    'filterItems',
    'descriptionPosition',
    'emptyRender',
    'footerRender',
    'itemRender',
    'virtualRender',
    'scrollToItem',
    'listboxProps',
    'itemProps',
    'inputProps',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const merged = mergeProps(
    {
      placeholder: 'Search...',
      autofocus: true,
      showClose: false,
      closeOnSelect: true,
      size: 'md' as const,
      descriptionPosition: 'bottom' as const,
      leadingIcon: 'icon-search',
      loadingIcon: 'icon-loading',
      closeIcon: 'icon-close',
    },
    local,
  )

  const [internalSearch, setInternalSearch] = createSignal('')
  const [activeKey, setActiveKey] = createSignal<string | undefined>(undefined)
  const [inputElement, setInputElement] = createSignal<HTMLInputElement | undefined>()
  let listboxElement: HTMLDivElement | undefined
  const listboxId = useId(undefined, 'command-palette-listbox')
  const currentSearchTerm = createMemo(() => merged.searchTerm ?? internalSearch())
  const activeDescendantId = createMemo(() =>
    activeKey() ? `${listboxId()}-${encodeURIComponent(String(activeKey()))}` : undefined,
  )
  const warnedDuplicateValues = new Set<string>()

  const warnDuplicateValue = (value: string): void => {
    if (process.env.NODE_ENV === 'production' || warnedDuplicateValues.has(value)) {
      return
    }

    warnedDuplicateValues.add(value)
    console.warn(
      `[moraine] CommandPalette received duplicate item value "${value}". ` +
        'Using a deduplicated internal key. Ensure item.value is unique for predictable selection.',
    )
  }

  function applySearchValue(value: string): void {
    if (merged.searchTerm === undefined) {
      setInternalSearch(value)
    }
    merged.onSearchTermChange?.(value)
  }

  createEffect(() => {
    const input = inputElement()
    if (!merged.autofocus || !input) {
      return
    }

    queueMicrotask(() => {
      if (input.isConnected && !input.closest('[role="dialog"]')) {
        input.focus({ preventScroll: true })
      }
    })
  })

  createEffect(() => {
    const input = inputElement()
    if (merged.searchTerm !== undefined && input && input.value !== merged.searchTerm) {
      input.value = merged.searchTerm
    }
  })

  const groups = createMemo<CommandPaletteT.Group<TItem>[]>(() => merged.groups ?? [])

  const normalizedGroups = createMemo(() =>
    createNormalizedGroups<TItem>(groups(), merged.getItemSearchText, warnDuplicateValue),
  )
  const visibleGroups = createMemo(() => {
    const term = currentSearchTerm().trim().toLowerCase()
    if (merged.filterItems) {
      return createNormalizedGroups<TItem>(
        merged.filterItems({
          groups: groups(),
          searchTerm: currentSearchTerm(),
        }),
        merged.getItemSearchText,
        warnDuplicateValue,
      )
    }

    if (merged.disableFilter || term === '') {
      return normalizedGroups()
    }

    return normalizedGroups()
      .map((group) =>
        Object.assign({}, group, {
          items: group.items.filter((item) => item.alwaysShow || item.searchText.includes(term)),
        }),
      )
      .filter((group) => group.items.length > 0)
  })
  const visibleItems = createMemo(() => visibleGroups().flatMap((group) => group.items))
  const hasItems = createMemo(() => visibleItems().length > 0)
  const visibleItemByKey = createMemo(() => new Map(visibleItems().map((item) => [item.key, item])))
  const visibleItemPositionByKey = createMemo(
    () => new Map(visibleItems().map((item, index) => [item.key, index + 1])),
  )
  const virtualEntries = createMemo<CommandPaletteT.VirtualEntry<TItem>[]>(() => {
    const entries: CommandPaletteT.VirtualEntry<TItem>[] = []

    for (const group of visibleGroups()) {
      if (group.label) {
        entries.push({
          type: 'label',
          key: `group-${group.source.id}`,
          label: group.label,
          group: group.source,
        })
      }

      for (const item of group.items) {
        entries.push({
          type: 'item',
          key: item.key,
          item: item.item,
          group: item.group,
          disabled: item.disabled,
        })
      }
    }

    return entries
  })

  createEffect(() => {
    const items = visibleItems().filter((item) => !item.disabled)
    const highlighted = activeKey()
    if (highlighted && items.some((item) => item.key === highlighted)) {
      return
    }
    setActiveKey(items[0]?.key)
  })

  createEffect(() => {
    const key = activeKey()
    if (!key) {
      return
    }

    const item = visibleItemByKey().get(key)
    if (!item) {
      return
    }

    if (merged.virtualRender && merged.scrollToItem) {
      const entryIndex = virtualEntries().findIndex(
        (entry) => entry.type === 'item' && entry.key === key,
      )
      if (entryIndex >= 0) {
        merged.scrollToItem(item.item, entryIndex)
        return
      }
    }

    queueMicrotask(() => {
      listboxElement
        ?.querySelector<HTMLElement>('[data-slot="item"][data-highlighted]')
        ?.scrollIntoView?.({ block: 'nearest' })
    })
  })

  const { onNavigationKeyDown } = useSelectableCollectionNavigation<NormalizedItem<TItem>, string>({
    items: () => visibleItems(),
    getValue: (item) => item.key,
    isDisabled: (item) => item.disabled,
    loop: () => true,
    activationMode: () => 'manual',
    focusValue: (value) => {
      setActiveKey(value)
    },
    onSelect: (value) => {
      const highlighted = visibleItems().find((item) => item.key === value)
      if (highlighted) {
        activateItem(highlighted.item)
      }
    },
  })

  function activateItem(item: TItem): void {
    if (item.disabled) {
      return
    }

    item.onSelect?.()
    merged.onSelect?.(item)
    if (merged.closeOnSelect) {
      merged.onClose?.()
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Spacebar') {
      return
    }

    if (event.key === 'Enter') {
      const highlighted = visibleItems().find((item) => item.key === activeKey())
      if (highlighted) {
        event.preventDefault()
        activateItem(highlighted.item)
      }
      return
    }

    onNavigationKeyDown(event, activeKey(), 'vertical')
  }

  function getContext(): CommandPaletteT.BaseContext<TItem> {
    return {
      get searchTerm() {
        return currentSearchTerm()
      },
      get loading() {
        return Boolean(merged.loading)
      },
      get hasItems() {
        return hasItems()
      },
      get groups() {
        return groups()
      },
      get visibleGroups() {
        return visibleGroups().map((group) =>
          Object.assign({}, group.source, {
            label: group.source.label ?? group.label,
            items: group.items.map((item) => item.item),
          }),
        )
      },
    }
  }

  function getItemContext(item: NormalizedItem<TItem>): CommandPaletteT.ItemRenderProps<TItem> {
    const isActive = () => activeKey() === item.key
    const context = getContext()
    return {
      get searchTerm() {
        return context.searchTerm
      },
      get loading() {
        return context.loading
      },
      get hasItems() {
        return context.hasItems
      },
      get groups() {
        return context.groups
      },
      get visibleGroups() {
        return context.visibleGroups
      },
      item: item.item,
      group: item.group,
      get focused() {
        return isActive()
      },
      get active() {
        return isActive()
      },
      get selected() {
        return isActive()
      },
      get disabled() {
        return item.disabled
      },
    }
  }

  function renderItemDescription(item: NormalizedItem<TItem>): JSX.Element {
    return (
      <Show when={item.item.description}>
        <span
          data-slot="itemDescription"
          style={merged.styles?.itemDescription}
          class={cn(COMMAND_PALETTE_ITEM_DESCRIPTION_CLASS, merged.classes?.itemDescription)}
        >
          {item.item.description}
        </span>
      </Show>
    )
  }

  function renderCommandItem(
    item: NormalizedItem<TItem>,
    itemContext = getItemContext(item),
  ): JSX.Element {
    const descriptionPosition = () => item.item.descriptionPosition ?? merged.descriptionPosition

    return (
      <Show
        when={merged.itemRender !== undefined}
        fallback={
          <>
            <Show when={item.item.leadingRender !== undefined}>
              <span
                data-slot="itemLeading"
                style={merged.styles?.itemLeading}
                class={cn(COMMAND_PALETTE_ITEM_ICON_CLASS, merged.classes?.itemLeading)}
              >
                {renderComponentOrElement(item.item.leadingRender, itemContext)}
              </span>
            </Show>

            <span
              data-slot="itemWrapper"
              style={merged.styles?.itemWrapper}
              class={cn(
                COMMAND_PALETTE_ITEM_WRAPPER_CLASS,
                descriptionPosition() === 'trailing' && 'flex-row gap-2 items-baseline',
                merged.classes?.itemWrapper,
              )}
            >
              <span
                data-slot="itemLabel"
                style={merged.styles?.itemLabel}
                class={cn(
                  COMMAND_PALETTE_ITEM_LABEL_CLASS,
                  descriptionPosition() === 'trailing' && 'flex flex-1 gap-2',
                  merged.classes?.itemLabel,
                )}
              >
                <span class="truncate">{item.item.label ?? item.label}</span>
                <Show when={descriptionPosition() === 'trailing'}>
                  {renderItemDescription(item)}
                </Show>
              </span>
              <Show when={descriptionPosition() === 'bottom'}>{renderItemDescription(item)}</Show>
            </span>

            <Show when={item.item.trailingRender !== undefined}>
              <span
                data-slot="itemTrailing"
                style={merged.styles?.itemTrailing}
                class={cn(COMMAND_PALETTE_TRAILING_CLASS, merged.classes?.itemTrailing)}
              >
                {renderComponentOrElement(item.item.trailingRender, itemContext)}
              </span>
            </Show>
          </>
        }
      >
        {renderComponentOrElement(merged.itemRender, itemContext)}
      </Show>
    )
  }

  function renderVisibleItem(
    item: NormalizedItem<TItem>,
    virtualProps?: ListT.RowProps<HTMLDivElement>,
  ): JSX.Element {
    const itemContext = getItemContext(item)
    const itemAttributes = createMemo(() => merged.itemProps?.(itemContext))

    return (
      <div
        id={`${listboxId()}-${encodeURIComponent(item.key)}`}
        role="option"
        tabIndex={-1}
        data-slot="item"
        data-disabled={item.disabled ? '' : undefined}
        data-highlighted={activeKey() === item.key ? '' : undefined}
        aria-selected={activeKey() === item.key}
        aria-disabled={item.disabled || undefined}
        aria-posinset={merged.virtualRender ? visibleItemPositionByKey().get(item.key) : undefined}
        aria-setsize={merged.virtualRender ? visibleItems().length : undefined}
        {...itemAttributes()}
        {...virtualProps}
        ref={(element) => {
          callRef(itemAttributes()?.ref, element)
          virtualProps?.ref?.(element)
        }}
        style={{
          ...merged.styles?.item,
          ...toStyleObject(itemAttributes()?.style),
          ...toStyleObject(virtualProps?.style),
        }}
        class={cn(
          COMMAND_PALETTE_ITEM_CLASS,
          merged.classes?.item,
          itemAttributes()?.class,
          virtualProps?.class,
        )}
        onPointerMove={(event) => {
          callHandler(event, itemAttributes()?.onPointerMove)
          callHandler(event, virtualProps?.onPointerMove)
          if (!event.defaultPrevented && event.pointerType === 'mouse' && !item.disabled) {
            setActiveKey(item.key)
          }
        }}
        onPointerDown={(event) => {
          callHandler(event, itemAttributes()?.onPointerDown)
          callHandler(event, virtualProps?.onPointerDown)
          if (
            !event.defaultPrevented &&
            event.pointerType !== 'touch' &&
            event.pointerType !== 'pen'
          ) {
            event.preventDefault()
          }
        }}
        onClick={(event) => {
          callHandler(event, itemAttributes()?.onClick)
          callHandler(event, virtualProps?.onClick)
          if (event.defaultPrevented || item.disabled) {
            return
          }

          setActiveKey(item.key)
          activateItem(item.item)
        }}
      >
        {renderCommandItem(item, itemContext)}
      </div>
    )
  }

  type CommandListEntry = CommandPaletteT.VirtualEntry<TItem> | NormalizedGroup<TItem>
  const listEntries = createMemo<readonly CommandListEntry[]>(() =>
    merged.virtualRender ? virtualEntries() : visibleGroups(),
  )
  const RuntimeList = List as unknown as Component<
    ListProps<CommandListEntry, 'div', HTMLDivElement> & JSX.HTMLAttributes<HTMLDivElement>
  >

  return (
    <div
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn(COMMAND_PALETTE_ROOT_CLASS, merged.classes?.root, merged.class)}
      {...rest}
    >
      <div
        data-slot="inputWrapper"
        style={merged.styles?.inputWrapper}
        class={cn(COMMAND_PALETTE_INPUT_WRAPPER_CLASS, merged.classes?.inputWrapper)}
      >
        <Icon
          name={merged.loading ? merged.loadingIcon : merged.leadingIcon}
          slotName="search"
          style={merged.styles?.search}
          aria-busy={merged.loading || undefined}
          data-loading={merged.loading ? '' : undefined}
          class={cn(COMMAND_PALETTE_SEARCH_ICON_CLASS, merged.classes?.search)}
        />

        <input
          {...merged.inputProps}
          ref={(el) => {
            setInputElement(el)
          }}
          data-slot="input"
          style={merged.styles?.input}
          class={cn(
            COMMAND_PALETTE_SEARCH_INPUT_CLASS,
            COMMAND_PALETTE_INPUT_CLASS,
            merged.classes?.input,
          )}

          role="combobox"
          aria-controls={listboxId()}
          aria-expanded="true"
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeDescendantId()}
          placeholder={merged.placeholder}
          maxLength={merged.searchMaxLength}
          value={currentSearchTerm()}
          onInput={(event) => {
            const { defaultPrevented } = callHandler(event, merged.inputProps?.onInput as any)
            if (!defaultPrevented) {
              applySearchValue(event.currentTarget.value)
            }
          }}
          onKeyDown={(event) => {
            const { defaultPrevented } = callHandler(event, merged.inputProps?.onKeyDown as any)
            if (!defaultPrevented) {
              handleKeyDown(event)
            }
          }}
        />

        <Show when={merged.showClose}>
          <button
            type="button"
            data-slot="close"
            style={merged.styles?.close}
            class={cn(COMMAND_PALETTE_CLOSE_CLASS, merged.classes?.close)}
            onClick={() => {
              merged.onClose?.()
            }}
            aria-label="Close"
          >
            <Icon name={merged.closeIcon} />
          </button>
        </Show>
      </div>

      <Show
        when={hasItems()}
        fallback={
          <div
            data-slot="empty"
            style={merged.styles?.empty}
            class={cn(COMMAND_PALETTE_EMPTY_CLASS, merged.classes?.empty)}
          >
            <Show when={merged.emptyRender !== undefined} fallback="No results.">
              {renderComponentOrElement(merged.emptyRender, getContext())}
            </Show>
          </div>
        }
      >
        <RuntimeList
          as="div"
          items={listEntries()}
          itemRender={(context) => (
            <Show
              when={merged.virtualRender}
              fallback={
                <div
                  data-slot="group"
                  style={merged.styles?.group}
                  class={cn(COMMAND_PALETTE_GROUP_CLASS, merged.classes?.group)}
                >
                  <Show when={(context.item as NormalizedGroup<TItem>).label}>
                    <span
                      data-slot="label"
                      style={merged.styles?.label}
                      class={cn(COMMAND_PALETTE_LABEL_CLASS, merged.classes?.label)}
                    >
                      {(context.item as NormalizedGroup<TItem>).label}
                    </span>
                  </Show>

                  <For each={(context.item as NormalizedGroup<TItem>).items}>
                    {(item) => renderVisibleItem(item)}
                  </For>
                </div>
              }
            >
              <Show
                when={(context.item as CommandPaletteT.VirtualEntry<TItem>).type === 'label'}
                fallback={
                  <Show
                    when={visibleItemByKey().get(
                      (context.item as CommandPaletteT.VirtualEntry<TItem>).key,
                    )}
                  >
                    {(item) => renderVisibleItem(item(), context.props)}
                  </Show>
                }
              >
                <div
                  role="presentation"
                  data-slot="group"
                  {...context.props}
                  style={{
                    ...merged.styles?.group,
                    ...toStyleObject(context.props?.style),
                  }}
                  class={cn(
                    'mt-2',
                    COMMAND_PALETTE_GROUP_CLASS,
                    merged.classes?.group,
                    context.props?.class,
                  )}
                >
                  <span
                    data-slot="label"
                    style={merged.styles?.label}
                    class={cn(COMMAND_PALETTE_LABEL_CLASS, merged.classes?.label)}
                  >
                    {(context.item as CommandPaletteT.VirtualLabelEntry<TItem>).label}
                  </span>
                </div>
              </Show>
            </Show>
          )}
          virtualRender={
            merged.virtualRender as
              | Component<ListT.VirtualRenderProps<CommandListEntry, HTMLElement, HTMLDivElement>>
              | undefined
          }
          id={listboxId()}
          role="listbox"
          data-slot="listbox"
          {...merged.listboxProps}
          ref={(element: HTMLDivElement) => {
            listboxElement = element
            callRef(merged.listboxProps?.ref, element)
          }}
          style={{
            ...merged.styles?.listbox,
            ...toStyleObject(merged.listboxProps?.style),
          }}
          class={cn(
            COMMAND_PALETTE_LIST_CLASS,
            merged.classes?.listbox,
            merged.listboxProps?.class,
          )}
        />
      </Show>

      <Show when={merged.footerRender !== undefined}>
        <div
          data-slot="footer"
          style={merged.styles?.footer}
          class={cn(COMMAND_PALETTE_FOOTER_CLASS, merged.classes?.footer)}
        >
          {renderComponentOrElement(merged.footerRender, getContext())}
        </div>
      </Show>
    </div>
  )
}
