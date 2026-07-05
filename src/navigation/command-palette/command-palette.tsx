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
  export interface SubItem {
    /** Unique value for the item. */
    value: string
    /** Primary label for the item. */
    label?: string
    /** Optional prefix text shown before the label. */
    prefix?: string
    /** Optional suffix text shown after the label. */
    suffix?: string
    /** Secondary description text shown below the label. */
    description?: string
    /** UnoCSS icon class or name to display. */
    icon?: string
    /** Array of keyboard shortcuts to display. */
    kbds?: string[]
    /** Whether to force the item into an active (highlighted) state. */
    active?: boolean
    /** Whether the item is disabled and cannot be selected. */
    disabled?: boolean
    /** Selecting this item drills into a nested group of items. */
    children?: SubItem[]
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

    /** Base text region for an item label before prefix or suffix decoration. */
    itemLabelBase?: T

    /** Prefix text rendered before the main item label. */
    itemLabelPrefix?: T

    /** Suffix text rendered after the main item label. */
    itemLabelSuffix?: T

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

  export interface Item {
    /** Unique identifier for the group. */
    id: string
    /** Display name for the group header. */
    label?: string
    /** Items belonging to this group. */
    children?: SubItem[]
  }

  export interface Base {
    /**
     * Command groups to display initially.
     * @default []
     */
    items?: Item[]
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
    /**
     * Icon name for the search indicator.
     * @default 'icon-search'
     */
    searchIcon?: IconT.Name
    /**
     * Icon name for the loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /**
     * Icon name for items with sub-groups.
     * @default 'icon-chevron-right'
     */
    childIcon?: IconT.Name
    /**
     * Icon name for the group navigation back button.
     * @default 'icon-arrow-left'
     */
    backIcon?: IconT.Name
    /**
     * Icon name for the palette close button.
     * @default 'icon-close'
     */
    closeIcon?: IconT.Name
    /**
     * Whether to show a close button in the header.
     * @default false
     */
    close?: boolean
    /** Callback triggered when the close button is clicked. */
    onClose?: () => void
    /**
     * Whether the palette is in a loading state.
     * @default false
     */
    loading?: boolean
    /**
     * Elements to show when no items match the search.
     * @default 'No results.'
     */
    empty?: JSX.Element
    /** Content to render at bottom of the palette. */
    footer?: JSX.Element
  }

  export interface Props extends BaseProps<Base, Variant, Slot> {}
}

export interface CommandPaletteProps extends CommandPaletteT.Props {}

interface NormalizedItem {
  key: string
  label: string
  searchText: string
  disabled: boolean
  itemLabel?: string
  prefix?: string
  suffix?: string
  description?: string
  icon?: string
  kbds?: string[]
  children?: CommandPaletteT.SubItem[]
  onSelect?: () => void
}

interface NormalizedGroup {
  label: string
  items: NormalizedItem[]
}

function buildItemLabel(item: CommandPaletteT.SubItem): string {
  const text = [item.prefix, item.label, item.suffix]
    .filter((part): part is string => Boolean(part))
    .join(' ')

  return text || item.value
}

function createNormalizedGroups(
  groups: CommandPaletteT.Item[] | undefined,
  warnDuplicateValue: (value: string) => void,
): NormalizedGroup[] {
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

  return (groups ?? []).map((group) => ({
    label: group.label ?? '',
    items: (group.children ?? []).map((item, index) => {
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
        itemLabel: item.label,
        prefix: item.prefix,
        suffix: item.suffix,
        description: item.description,
        icon: item.icon,
        kbds: item.kbds,
        children: item.children,
        onSelect: item.onSelect,
      }
    }),
  }))
}

/**
 * CommandPalette is a component for displaying a searchable list of commands or options, optionally grouped into categories. It supports nested groups, keyboard navigation, and customizable rendering through slots and styles.
 */
export function CommandPalette(props: CommandPaletteProps): JSX.Element {
  const merged = mergeProps(
    {
      placeholder: 'Search...',
      autofocus: true,
      close: false,
      searchIcon: 'icon-search' as IconT.Name,
      loadingIcon: 'icon-loading' as IconT.Name,
      childIcon: 'icon-chevron-right' as IconT.Name,
      backIcon: 'icon-arrow-left' as IconT.Name,
      closeIcon: 'icon-close' as IconT.Name,
      emptyRender: 'No results.',
    },
    props,
  )

  const [history, setHistory] = createSignal<CommandPaletteT.Item[]>([])
  const [internalSearch, setInternalSearch] = createSignal('')
  const [highlightedKey, setHighlightedKey] = createSignal<string | undefined>(undefined)
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

  const currentGroups = createMemo<CommandPaletteT.Item[]>(() => {
    const stack = history()
    const current = stack.at(-1)
    return current ? [current] : (merged.items ?? [])
  })

  const normalizedGroups = createMemo(() =>
    createNormalizedGroups(currentGroups(), warnDuplicateValue),
  )
  const visibleGroups = createMemo(() => {
    const term = currentSearchTerm().trim().toLowerCase()
    if (term === '') {
      return normalizedGroups()
    }

    return normalizedGroups()
      .map((group) =>
        Object.assign({}, group, {
          items: group.items.filter((item) => item.searchText.includes(term)),
        }),
      )
      .filter((group) => group.items.length > 0)
  })
  const visibleItems = createMemo(() => visibleGroups().flatMap((group) => group.items))
  const hasItems = createMemo(() => visibleItems().length > 0)

  createEffect(() => {
    const items = visibleItems().filter((item) => !item.disabled)
    const highlighted = highlightedKey()
    if (highlighted && items.some((item) => item.key === highlighted)) {
      return
    }
    setHighlightedKey(items[0]?.key)
  })

  function navigateBack(): void {
    setHistory((stack) => stack.slice(0, -1))
    applySearchValue('')
    setHighlightedKey(undefined)
  }

  function activateItem(item: NormalizedItem): void {
    if (item.disabled) {
      return
    }

    if ((item.children?.length ?? 0) > 0) {
      setHistory((stack) => [
        ...stack,
        { id: `history-${item.key}`, label: item.itemLabel, children: item.children! },
      ])
      applySearchValue('')
      setHighlightedKey(undefined)
      queueMicrotask(() => {
        inputRef?.focus()
      })
      return
    }

    item.onSelect?.()
  }

  function focusByOffset(delta: number): void {
    const items = visibleItems().filter((item) => !item.disabled)
    if (items.length === 0) {
      return
    }

    const currentIndex = items.findIndex((item) => item.key === highlightedKey())
    const nextIndex =
      currentIndex === -1
        ? delta > 0
          ? 0
          : items.length - 1
        : (currentIndex + delta + items.length) % items.length
    setHighlightedKey(items[nextIndex]?.key)
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
      setHighlightedKey(visibleItems().find((item) => !item.disabled)?.key)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      const items = visibleItems().filter((item) => !item.disabled)
      setHighlightedKey(items[items.length - 1]?.key)
      return
    }

    if (event.key === 'Enter') {
      const highlighted = visibleItems().find((item) => item.key === highlightedKey())
      if (highlighted) {
        event.preventDefault()
        activateItem(highlighted)
      }
    }
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
              name={merged.loading ? (merged.loadingIcon ?? 'icon-loading') : merged.searchIcon}
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
            name={merged.loading ? (merged.loadingIcon ?? 'icon-loading') : merged.backIcon}
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

        <Show when={merged.close}>
          <IconButtonInner
            name={merged.closeIcon}
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
            {merged.empty}
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
                    const hasChildren = () => (item.children?.length ?? 0) > 0
                    return (
                      <div
                        role="option"
                        tabIndex={-1}
                        data-slot="item"
                        data-disabled={item.disabled ? '' : undefined}
                        data-highlighted={highlightedKey() === item.key ? '' : undefined}
                        aria-disabled={item.disabled || undefined}
                        style={merged.styles?.item}
                        class={cn(
                          'p-2 outline-none rounded-md flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:(text-accent-foreground bg-accent) data-disabled:effect-dis',
                          merged.classes?.item,
                        )}
                        onPointerMove={() => {
                          if (!item.disabled) {
                            setHighlightedKey(item.key)
                          }
                        }}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => activateItem(item)}
                      >
                        <Show when={item.icon}>
                          <Icon
                            name={item.icon}
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
                          <Show when={item.prefix || item.itemLabel || item.suffix}>
                            <span
                              data-slot="itemLabel"
                              style={merged.styles?.itemLabel}
                              class={cn(
                                'text-sm inline-flex gap-2 truncate items-baseline',
                                merged.classes?.itemLabel,
                              )}
                            >
                              <Show when={item.prefix}>
                                <span
                                  data-slot="itemLabelPrefix"
                                  style={merged.styles?.itemLabelPrefix}
                                  class={cn(
                                    'text-muted-foreground shrink-0',
                                    merged.classes?.itemLabelPrefix,
                                  )}
                                >
                                  {item.prefix}
                                </span>
                              </Show>
                              <span
                                data-slot="itemLabelBase"
                                style={merged.styles?.itemLabelBase}
                                class={cn(merged.classes?.itemLabelBase)}
                              >
                                {item.itemLabel}
                              </span>
                              <Show when={item.suffix}>
                                <span
                                  data-slot="itemLabelSuffix"
                                  style={merged.styles?.itemLabelSuffix}
                                  class={cn(
                                    'text-xs text-muted-foreground shrink-0',
                                    merged.classes?.itemLabelSuffix,
                                  )}
                                >
                                  {item.suffix}
                                </span>
                              </Show>
                            </span>
                          </Show>
                          <Show when={item.description}>
                            <span
                              data-slot="itemDescription"
                              style={merged.styles?.itemDescription}
                              class={cn(
                                'text-xs text-muted-foreground truncate',
                                merged.classes?.itemDescription,
                              )}
                            >
                              {item.description}
                            </span>
                          </Show>
                        </span>

                        <Show
                          when={hasChildren()}
                          fallback={
                            <Kbd
                              slotPrefix="itemTrailing"
                              value={item.kbds}
                              classes={{
                                root: merged.classes?.itemTrailingKbds,
                                item: merged.classes?.itemTrailingKbd,
                              }}
                            />
                          }
                        >
                          <Icon
                            name={merged.childIcon}
                            slotName="itemTrailing"
                            style={merged.styles?.itemTrailing}
                            class={cn(
                              'text-muted-foreground shrink-0',
                              merged.classes?.itemTrailing,
                            )}
                          />
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

      <Show when={merged.footer}>
        <div
          data-slot="footer"
          style={merged.styles?.footer}
          class={cn('text-sm text-muted-foreground p-3', merged.classes?.footer)}
        >
          {merged.footer}
        </div>
      </Show>
    </div>
  )
}
