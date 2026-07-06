import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
} from 'solid-js'

import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import { IconButtonInner } from '../../elements/icon/icon-button-inner'
import { Kbd } from '../../elements/kbd'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { cn } from '../../shared/utils'

export namespace CommandPaletteT {
  export type DescriptionPosition = 'bottom' | 'trailing'

  export interface Item {
    /** Unique value for the item. */
    value: string
    /** Primary label for the item. */
    label?: string
    /** Secondary description text shown for the item. */
    description?: string
    /** Where the item description is rendered. Overrides the root setting. */
    descriptionPosition?: DescriptionPosition
    /** UnoCSS icon class or name to display. */
    icon?: string
    /** Array of keyboard shortcuts to display. */
    kbds?: string[]
    /** Whether to force the item into an active (highlighted) state. */
    active?: boolean
    /** Whether the item is disabled and cannot be selected. */
    disabled?: boolean
    /** Whether this item should be excluded from built-in search filtering. */
    alwaysShow?: boolean
    /** Selecting this item drills into a nested group of items. */
    children?: Item[]
    /** Callback triggered when the item is selected. */
    onSelect?: () => void
  }

  export interface Slot<T = unknown> {
    /**
     * Command palette container that owns search, navigation stack, and option list.
     */
    root?: T

    /** Search row that groups input, search icon, and navigation controls. */
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

    /** Leading icon or visual for a command row. */
    itemLeading?: T

    /** Text column that groups command label and description. */
    itemWrapper?: T

    /** Primary text for a command item. */
    itemLabel?: T

    /** Supporting text for a command item. */
    itemDescription?: T

    /** Trailing region for shortcuts, submenu indicators, or custom item metadata. */
    itemTrailing?: T

    /** Container for keyboard shortcut hints at the end of a command row. */
    itemTrailingKbds?: T

    /** Individual keyboard key hint in a command row. */
    itemTrailingKbd?: T

    /** Search icon or loading indicator displayed in the input row. */
    search?: T

    /** Button that returns from a nested command group. */
    back?: T

    /** Button that dismisses the command palette. */
    close?: T

    /** Message shown when no command items match the search. */
    empty?: T
  }
  export type Variant = never
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

  export interface Icons {
    /** Icon name for the search indicator. */
    search?: IconT.Name
    /** Icon name for the loading state. */
    loading?: IconT.Name
    /** Icon name for items with sub-groups. */
    expand?: IconT.Name
    /** Icon name for the group navigation back button. */
    back?: IconT.Name
    /** Icon name for the palette close button. */
    close?: IconT.Name
  }

  export interface BaseContext<TItem extends Item = Item> {
    searchTerm: string
    loading: boolean
    hasItems: boolean
    depth: number
    groups: Group<TItem>[]
    visibleGroups: Group<TItem>[]
  }

  export interface ItemRenderContext<TItem extends Item = Item> extends BaseContext<TItem> {
    item: TItem
    group: Group<TItem>
    selected: boolean
    focused: boolean
    disabled: boolean
    hasChildren: boolean
    level: number
  }

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
    /** Maximum allowed length for the search text. */
    searchMaxLength?: number
    /**
     * Whether to focus the search input automatically on mount.
     * @default true
     */
    autofocus?: boolean
    /** Icons used by the command palette. */
    icons?: Icons
    /**
     * Whether to show a close button in the header.
     * @default false
     */
    showClose?: boolean
    /** Callback triggered when the close button is clicked. */
    onClose?: () => void
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
    /**
     * Where descriptions render by default.
     * @default 'bottom'
     */
    descriptionPosition?: DescriptionPosition
    /** Custom empty state renderer. */
    emptyRender?: (ctx: BaseContext<TItem>) => JSX.Element
    /** Custom footer renderer. */
    footerRender?: (ctx: BaseContext<TItem>) => JSX.Element
    /** Custom command row content renderer. */
    itemRender?: (ctx: ItemRenderContext<TItem>) => JSX.Element
  }

  export interface Props<TItem extends Item = Item> extends BaseProps<Base<TItem>, Variant, Slot> {}
}

export interface CommandPaletteProps<
  TItem extends CommandPaletteT.Item = CommandPaletteT.Item,
> extends CommandPaletteT.Props<TItem> {}

const DEFAULT_ICONS = {
  search: 'icon-search',
  loading: 'icon-loading',
  expand: 'icon-chevron-right',
  back: 'icon-arrow-left',
  close: 'icon-close',
} satisfies Required<CommandPaletteT.Icons>

interface NormalizedItem<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> {
  key: string
  label: string
  searchText: string
  disabled: boolean
  item: TItem
  group: CommandPaletteT.Group<TItem>
  active: boolean
  alwaysShow: boolean
}

interface NormalizedGroup<TItem extends CommandPaletteT.Item = CommandPaletteT.Item> {
  source: CommandPaletteT.Group<TItem>
  label: string
  items: NormalizedItem<TItem>[]
}

function buildItemLabel(item: CommandPaletteT.Item): string {
  return item.label || item.value
}

function createNormalizedGroups<TItem extends CommandPaletteT.Item>(
  groups: CommandPaletteT.Group<TItem>[],
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
        searchText: label.toLowerCase(),
        disabled: Boolean(item.disabled),
        item,
        group,
        active: Boolean(item.active),
        alwaysShow: Boolean(item.alwaysShow),
      }
    }),
  }))
}

/**
 * CommandPalette is a component for displaying a searchable list of commands or options, optionally grouped into categories. It supports nested groups, keyboard navigation, and customizable rendering through slots and styles.
 */
export function CommandPalette<TItem extends CommandPaletteT.Item = CommandPaletteT.Item>(
  props: CommandPaletteProps<TItem>,
): JSX.Element {
  const merged = mergeProps(
    {
      placeholder: 'Search...',
      autofocus: true,
      showClose: false,
      descriptionPosition: 'bottom' as const,
    },
    props,
  )
  const icons = createMemo(() => Object.assign({}, DEFAULT_ICONS, merged.icons))

  const [history, setHistory] = createSignal<CommandPaletteT.Group<TItem>[]>([])
  const [internalSearch, setInternalSearch] = createSignal('')
  const [activeKey, setActiveKey] = createSignal<string | undefined>(undefined)
  const currentSearchTerm = createMemo(() => merged.searchTerm ?? internalSearch())
  const warnedDuplicateValues = new Set<string>()
  let inputRef: HTMLInputElement | undefined

  const warnDuplicateValue = (value: string): void => {
    if (process.env.NODE_ENV === 'production' || warnedDuplicateValues.has(value)) {
      return
    }

    warnedDuplicateValues.add(value)
    console.warn(
      `[platinum] CommandPalette received duplicate item value "${value}". ` +
        'Using a deduplicated internal key. Ensure item.value is unique for predictable selection.',
    )
  }

  function applySearchValue(value: string): void {
    if (merged.searchTerm === undefined) {
      setInternalSearch(value)
    }
    merged.onSearchTermChange?.(value)
  }

  onMount(() => {
    let dialogAutofocusTimer: ReturnType<typeof setTimeout> | undefined
    if (!merged.autofocus || !inputRef || !inputRef.closest('[role="dialog"]')) {
      return
    }

    dialogAutofocusTimer = setTimeout(() => {
      inputRef?.focus()
    }, 0)

    onCleanup(() => {
      if (dialogAutofocusTimer !== undefined) {
        clearTimeout(dialogAutofocusTimer)
      }
    })
  })

  createEffect(() => {
    if (merged.searchTerm !== undefined && inputRef && inputRef.value !== merged.searchTerm) {
      inputRef.value = merged.searchTerm
    }
  })

  const groups = createMemo<CommandPaletteT.Group<TItem>[]>(() => {
    const stack = history()
    const current = stack.at(-1)
    return current ? [current] : (merged.groups ?? [])
  })

  const normalizedGroups = createMemo(() =>
    createNormalizedGroups<TItem>(groups(), warnDuplicateValue),
  )
  const visibleGroups = createMemo(() => {
    const term = currentSearchTerm().trim().toLowerCase()
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

  createEffect(() => {
    const items = visibleItems().filter((item) => !item.disabled)
    const highlighted = activeKey()
    if (highlighted && items.some((item) => item.key === highlighted)) {
      return
    }
    setActiveKey(items[0]?.key)
  })

  function navigateBack(): void {
    setHistory((stack) => stack.slice(0, -1))
    applySearchValue('')
    setActiveKey(undefined)
  }

  function activateItem(item: NormalizedItem<TItem>): void {
    if (item.disabled) {
      return
    }

    if ((item.item.children?.length ?? 0) > 0) {
      setHistory((stack) => [
        ...stack,
        {
          id: `history-${item.key}`,
          label: item.item.label,
          items: item.item.children as TItem[],
        },
      ])
      applySearchValue('')
      setActiveKey(undefined)
      queueMicrotask(() => {
        inputRef?.focus()
      })
      return
    }

    item.item.onSelect?.()
  }

  function focusByOffset(delta: number): void {
    const items = visibleItems().filter((item) => !item.disabled)
    if (items.length === 0) {
      return
    }

    const currentIndex = items.findIndex((item) => item.key === activeKey())
    const nextIndex =
      currentIndex === -1
        ? delta > 0
          ? 0
          : items.length - 1
        : (currentIndex + delta + items.length) % items.length
    setActiveKey(items[nextIndex]?.key)
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !currentSearchTerm()) {
      navigateBack()
      return
    }

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
      setActiveKey(visibleItems().find((item) => !item.disabled)?.key)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      const items = visibleItems().filter((item) => !item.disabled)
      setActiveKey(items[items.length - 1]?.key)
      return
    }

    if (event.key === 'Enter') {
      const highlighted = visibleItems().find((item) => item.key === activeKey())
      if (highlighted) {
        event.preventDefault()
        activateItem(highlighted)
      }
    }
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
      get depth() {
        return history().length
      },
      get groups() {
        return groups()
      },
      get visibleGroups() {
        return visibleGroups().map((group) =>
          Object.assign({}, group.source, {
            label: group.source.label ?? group.label,
            children: group.items.map((item) => item.item),
          }),
        )
      },
    }
  }

  function getItemContext(item: NormalizedItem<TItem>): CommandPaletteT.ItemRenderContext<TItem> {
    return {
      ...getContext(),
      item: item.item,
      group: item.group,
      get selected() {
        return item.active
      },
      get focused() {
        return activeKey() === item.key
      },
      get disabled() {
        return item.disabled
      },
      get hasChildren() {
        return (item.item.children?.length ?? 0) > 0
      },
      get level() {
        return history().length
      },
    }
  }

  function renderItemDescription(item: NormalizedItem<TItem>): JSX.Element {
    return (
      <Show when={item.item.description}>
        <span
          data-slot="itemDescription"
          style={merged.styles?.itemDescription}
          class={cn('text-xs text-muted-foreground truncate', merged.classes?.itemDescription)}
        >
          {item.item.description}
        </span>
      </Show>
    )
  }

  return (
    <div
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn(
        'rounded-xl bg-background flex flex-col min-h-0 divide-(border y)',
        merged.classes?.root,
        merged.class,
      )}
    >
      <div
        data-slot="inputWrapper"
        style={merged.styles?.inputWrapper}
        class={cn('px-3 flex gap-2 h-12 items-center', merged.classes?.inputWrapper)}
      >
        <Show
          when={history().length > 0}
          fallback={
            <IconButtonInner
              name={merged.loading ? icons().loading : icons().search}
              data-slot="search"
              tabIndex={-1}
              style={merged.styles?.search}
              aria-busy={merged.loading || undefined}
              data-loading={merged.loading ? '' : undefined}
              disabled={merged.loading || undefined}
              class={cn('text-muted-foreground size-5 pointer-events-none', merged.classes?.search)}
            />
          }
        >
          <IconButtonInner
            name={merged.loading ? icons().loading : icons().back}
            data-slot="back"
            style={merged.styles?.back}
            aria-busy={merged.loading || undefined}
            data-loading={merged.loading ? '' : undefined}
            disabled={merged.loading || undefined}
            class={cn(
              'text-muted-foreground outline-none hover:text-foreground',
              merged.classes?.back,
            )}
            onClick={navigateBack}
            aria-label="Go back"
          />
        </Show>

        <input
          ref={(el) => {
            inputRef = el
          }}
          data-slot="input"
          style={merged.styles?.input}
          class={cn(
            'outline-none bg-transparent flex-1 placeholder:text-muted-foreground disabled:effect-dis',
            merged.classes?.input,
          )}
          placeholder={merged.placeholder}
          autofocus={merged.autofocus}
          maxLength={merged.searchMaxLength}
          value={currentSearchTerm()}
          onInput={(event) => applySearchValue(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />

        <Show when={merged.showClose}>
          <IconButtonInner
            name={icons().close}
            data-slot="close"
            style={merged.styles?.close}
            class={cn(
              'text-muted-foreground outline-none shrink-0 cursor-pointer hover:text-foreground',
              merged.classes?.close,
            )}
            onClick={() => merged.onClose?.()}
            aria-label="Close"
          />
        </Show>
      </div>

      <Show
        when={hasItems()}
        fallback={
          <div
            data-slot="empty"
            style={merged.styles?.empty}
            class={cn('text-muted-foreground py-6 text-center', merged.classes?.empty)}
          >
            {merged.emptyRender?.(getContext()) ?? 'No results.'}
          </div>
        }
      >
        <div
          role="listbox"
          data-slot="listbox"
          style={merged.styles?.listbox}
          class={cn(
            'p-1 max-h-36vh overflow-x-hidden overflow-y-auto focus:outline-none',
            merged.classes?.listbox,
          )}
        >
          <For each={visibleGroups()}>
            {(group) => (
              <div
                data-slot="group"
                style={merged.styles?.group}
                class={cn('mt-2 p-1', merged.classes?.group)}
              >
                <Show when={group.label}>
                  <span
                    data-slot="label"
                    style={merged.styles?.label}
                    class={cn(
                      'text-sm text-muted-foreground font-semibold px-1.5',
                      merged.classes?.label,
                    )}
                  >
                    {group.label}
                  </span>
                </Show>

                <For each={group.items}>
                  {(item) => {
                    const hasChildren = () => (item.item.children?.length ?? 0) > 0
                    const descriptionPosition = () =>
                      item.item.descriptionPosition ?? merged.descriptionPosition
                    return (
                      <div
                        role="option"
                        tabIndex={-1}
                        data-slot="item"
                        data-disabled={item.disabled ? '' : undefined}
                        data-highlighted={activeKey() === item.key ? '' : undefined}
                        aria-disabled={item.disabled || undefined}
                        style={merged.styles?.item}
                        class={cn(
                          'p-2 outline-none rounded-md flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:(text-accent-foreground bg-accent) data-disabled:effect-dis',
                          merged.classes?.item,
                        )}
                        onPointerMove={() => {
                          if (!item.disabled) {
                            setActiveKey(item.key)
                          }
                        }}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => activateItem(item)}
                      >
                        <Show
                          when={merged.itemRender}
                          fallback={
                            <>
                              <Show when={item.item.icon}>
                                <Icon
                                  name={item.item.icon}
                                  slotName="itemLeading"
                                  style={merged.styles?.itemLeading}
                                  class={cn(
                                    'text-muted-foreground shrink-0',
                                    merged.classes?.itemLeading,
                                  )}
                                />
                              </Show>

                              <span
                                data-slot="itemWrapper"
                                style={merged.styles?.itemWrapper}
                                class={cn(
                                  'text-start flex flex-1 flex-col min-w-0',
                                  merged.classes?.itemWrapper,
                                )}
                              >
                                <span
                                  data-slot="itemLabel"
                                  style={merged.styles?.itemLabel}
                                  class={cn(
                                    'text-sm truncate items-baseline',
                                    merged.classes?.itemLabel,
                                  )}
                                >
                                  {item.item.label ?? item.label}
                                </span>
                                <Show when={descriptionPosition() === 'bottom'}>
                                  {renderItemDescription(item)}
                                </Show>
                              </span>

                              <span
                                data-slot="itemTrailing"
                                style={merged.styles?.itemTrailing}
                                class={cn(
                                  'flex shrink-0 gap-2 items-center',
                                  merged.classes?.itemTrailing,
                                )}
                              >
                                <Show when={descriptionPosition() === 'trailing'}>
                                  {renderItemDescription(item)}
                                </Show>
                                <Show
                                  when={hasChildren()}
                                  fallback={
                                    <Kbd
                                      slotPrefix="itemTrailing"
                                      value={item.item.kbds}
                                      classes={{
                                        root: merged.classes?.itemTrailingKbds,
                                        item: merged.classes?.itemTrailingKbd,
                                      }}
                                    />
                                  }
                                >
                                  <Icon
                                    name={icons().expand}
                                    slotName="itemTrailingIcon"
                                    class="text-muted-foreground shrink-0"
                                  />
                                </Show>
                              </span>
                            </>
                          }
                        >
                          {(itemRender) => itemRender()(getItemContext(item))}
                        </Show>
                      </div>
                    )
                  }}
                </For>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={merged.footerRender}>
        <div
          data-slot="footer"
          style={merged.styles?.footer}
          class={cn('text-sm text-muted-foreground p-3', merged.classes?.footer)}
        >
          {merged.footerRender?.(getContext())}
        </div>
      </Show>
    </div>
  )
}
