import { Combobox } from '@kobalte/core/combobox'
import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
} from 'solid-js'

import { Icon, IconButton } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import { Kbd } from '../../elements/kbd'
import type { SlotClasses, SlotStyles } from '../../shared/slot'
import { cn } from '../../shared/utils'

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * An individual item in the command palette.
 */
export interface CommandPaletteItem {
  /**
   * Unique value for the item.
   */
  value: string

  /**
   * Primary label for the item.
   */
  label?: string

  /**
   * Optional prefix text shown before the label.
   */
  prefix?: string

  /**
   * Optional suffix text shown after the label.
   */
  suffix?: string

  /**
   * Secondary description text shown below the label.
   */
  description?: string

  /**
   * UnoCSS icon class or name to display.
   * @example 'icon-search'
   */
  icon?: string

  /**
   * Array of keyboard shortcuts to display.
   */
  kbds?: string[]

  /**
   * Whether to force the item into an active (highlighted) state.
   */
  active?: boolean

  /**
   * Whether the item is disabled and cannot be selected.
   */
  disabled?: boolean

  /**
   * Selecting this item drills into a nested group of items.
   */
  children?: CommandPaletteItem[]

  /**
   * Callback triggered when the item is selected.
   */
  onSelect?: () => void
}

/**
 * A grouped collection of items in the command palette.
 */
export interface CommandPaletteGroup {
  /**
   * Unique identifier for the group.
   */
  id: string

  /**
   * Display name for the group header.
   */
  label?: string

  /**
   * Items belonging to this group.
   */
  items?: CommandPaletteItem[]
}

type CommandPaletteSlots =
  | 'root'
  | 'inputWrapper'
  | 'input'
  | 'listbox'
  | 'footer'
  | 'group'
  | 'label'
  | 'item'
  | 'itemLeading'
  | 'itemWrapper'
  | 'itemLabel'
  | 'itemLabelBase'
  | 'itemLabelPrefix'
  | 'itemLabelSuffix'
  | 'itemDescription'
  | 'itemTrailing'
  | 'itemTrailingKbds'
  | 'itemTrailingKbd'
  | 'search'
  | 'back'
  | 'close'
  | 'empty'

export type CommandPaletteClasses = SlotClasses<CommandPaletteSlots>

export type CommandPaletteStyles = SlotStyles<CommandPaletteSlots>

/**
 * Base props for the CommandPalette component.
 */
export interface CommandPaletteBaseProps {
  /**
   * Command groups to display initially.
   */
  groups?: CommandPaletteGroup[]

  /**
   * Placeholder text for the search input.
   * @default 'Search...'
   */
  placeholder?: string

  /**
   * Controlled search term.
   */
  searchTerm?: string

  /**
   * Callback triggered when the search term changes.
   */
  onSearchTermChange?: (term: string) => void

  /**
   * Maximum allowed length for the search text.
   */
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
  searchIcon?: IconName

  /**
   * Icon name for the loading state.
   * @default 'icon-loading'
   */
  loadingIcon?: IconName

  /**
   * Icon name for items with sub-groups.
   * @default 'icon-chevron-right'
   */
  childIcon?: IconName

  /**
   * Icon name for the group navigation back button.
   * @default 'icon-arrow-left'
   */
  backIcon?: IconName

  /**
   * Icon name for the palette close button.
   * @default 'icon-close'
   */
  closeIcon?: IconName

  /**
   * Whether to show a close button in the header.
   * @default false
   */
  close?: boolean

  /**
   * Callback triggered when the close button is clicked.
   */
  onClose?: () => void

  /**
   * Whether the palette is in a loading state.
   */
  loading?: boolean

  /**
   * Elements to show when no items match the search.
   * @default 'No results.'
   */
  empty?: JSX.Element

  /**
   * Content to render at bottom of the palette.
   */
  footer?: JSX.Element

  /**
   * Slot-based class overrides.
   */
  classes?: CommandPaletteClasses

  /**
   * Slot-based style overrides.
   */
  styles?: CommandPaletteStyles
}

/**
 * Props for the CommandPalette component.
 */
export type CommandPaletteProps = CommandPaletteBaseProps

// ─── Internal normalized types ────────────────────────────────────────────────

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
  children?: CommandPaletteItem[]
  onSelect?: () => void
}

interface NormalizedGroup {
  label: string
  items: NormalizedItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildItemLabel(item: CommandPaletteItem): string {
  const text = [item.prefix, item.label, item.suffix]
    .filter((part): part is string => Boolean(part))
    .join(' ')

  return text || item.value
}

function createNormalizedGroups(
  groups: CommandPaletteGroup[] | undefined,
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

// ─── Component ────────────────────────────────────────────────────────────────
export function CommandPalette(props: CommandPaletteProps): JSX.Element {
  const merged = mergeProps(
    {
      placeholder: 'Search...',
      autofocus: true,
      close: false,
      searchIcon: 'icon-search' as IconName,
      loadingIcon: 'icon-loading' as IconName,
      childIcon: 'icon-chevron-right' as IconName,
      backIcon: 'icon-arrow-left' as IconName,
      closeIcon: 'icon-close' as IconName,
      empty: 'No results.',
    },
    props,
  )

  // ── History stack for sub-navigation ──────────────────────────────────────
  const [history, setHistory] = createSignal<CommandPaletteGroup[]>([])

  // ── Input ref — cleared visually after navigation ─────────────────────────
  let inputRef: HTMLInputElement | undefined

  // ── Search term ───────────────────────────────────────────────────────────
  const [internalSearch, setInternalSearch] = createSignal('')
  const currentSearchTerm = createMemo(() => merged.searchTerm ?? internalSearch())
  const warnedDuplicateValues = new Set<string>()

  const warnDuplicateValue = (value: string): void => {
    if (process.env.NODE_ENV === 'production' || warnedDuplicateValues.has(value)) {
      return
    }

    warnedDuplicateValues.add(value)
    console.warn(
      `[rock-ui] CommandPalette received duplicate item value "${value}". ` +
        'Using a deduplicated internal key. Ensure item.value is unique for predictable selection.',
    )
  }

  // Absorbs the one `onInputChange` call Kobalte fires after item selection
  // (setting the input to the selected item's label), which would overwrite
  // the '' we just set during navigation.
  let suppressInputChange = false

  function applySearchValue(value: string): void {
    if (merged.searchTerm === undefined) {
      setInternalSearch(value)
    }
    merged.onSearchTermChange?.(value)
  }

  function updateSearchFromInput(value: string): void {
    if (suppressInputChange) {
      suppressInputChange = false
      return
    }

    applySearchValue(value)
  }

  createEffect(() => {
    if (merged.searchTerm === undefined || !inputRef) {
      return
    }

    const nextValue = merged.searchTerm
    if (inputRef.value !== nextValue) {
      inputRef.value = nextValue
    }
  })

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

  // ── Custom filter: reads the effective search term ──────────────────────────
  function filter(option: NormalizedItem): boolean {
    const term = currentSearchTerm().trim().toLowerCase()
    return term === '' || option.searchText.includes(term)
  }

  // ── Current groups: last history entry or root ─────────────────────────────
  const currentGroups = createMemo<CommandPaletteGroup[]>(() => {
    const hist = history()
    return hist.length > 0 ? [hist[hist.length - 1]] : (merged.groups ?? [])
  })

  const normalizedGroups = createMemo<NormalizedGroup[]>(() =>
    createNormalizedGroups(currentGroups(), warnDuplicateValue),
  )

  const hasItems = createMemo(() => normalizedGroups().some((g) => g.items.length > 0))

  // ── Navigation ────────────────────────────────────────────────────────────
  function navigateBack(): void {
    setHistory((h) => h.slice(0, -1))
    applySearchValue('')
    // Clear the DOM input after Kobalte's sync updates finish
    queueMicrotask(() => {
      if (inputRef) {
        inputRef.value = ''
      }
    })
  }

  function handleChange(item: NormalizedItem | null): void {
    if (!item) {
      return
    }

    if ((item.children?.length ?? 0) > 0) {
      setHistory((h) => [
        ...h,
        { id: `history-${item.key}`, label: item.itemLabel, items: item.children! },
      ])
      applySearchValue('')
      // Suppress the onInputChange('More') Kobalte fires after selection
      suppressInputChange = true
      queueMicrotask(() => {
        suppressInputChange = false
        if (inputRef) {
          inputRef.value = ''
        }
      })
      return
    }

    item.onSelect?.()
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Backspace' && !currentSearchTerm()) {
      navigateBack()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Combobox<NormalizedItem, NormalizedGroup>
      options={normalizedGroups()}
      optionValue="key"
      optionLabel="label"
      optionTextValue="label"
      optionDisabled="disabled"
      optionGroupChildren="items"
      defaultFilter={filter}
      triggerMode="manual"
      open={true}
      onOpenChange={() => {}}
      value={null}
      data-slot="root"
      style={merged.styles?.root}
      class={cn(
        'rounded-xl bg-background flex flex-col min-h-0 divide-(border y)',
        merged.classes?.root,
      )}
      onChange={handleChange}
      onInputChange={updateSearchFromInput}
      allowsEmptyCollection={true}
      closeOnSelection={false}
      shouldFocusWrap={true}
      itemComponent={(itemProps) => {
        const option = (): NormalizedItem => itemProps.item.rawValue
        const hasChildren = (): boolean => (option().children?.length ?? 0) > 0

        return (
          <Combobox.Item
            item={itemProps.item}
            data-slot="item"
            style={merged.styles?.item}
            class={cn(
              'p-2 outline-none rounded-md flex gap-2 w-full cursor-default select-none items-center relative data-highlighted:(text-accent-foreground bg-accent) data-disabled:effect-dis',
              merged.classes?.item,
            )}
            onPointerDown={(e: PointerEvent) => e.preventDefault()}
          >
            {/* Leading: loading spinner or icon */}
            <Show when={option().icon}>
              <Icon
                name={option().icon}
                data-slot="itemLeading"
                style={merged.styles?.itemLeading}
                class={cn('text-muted-foreground shrink-0', merged.classes?.itemLeading)}
              />
            </Show>

            {/* Content wrapper */}
            <span
              data-slot="itemWrapper"
              style={merged.styles?.itemWrapper}
              class={cn('text-start flex flex-1 flex-col min-w-0', merged.classes?.itemWrapper)}
            >
              <Show when={option().prefix || option().itemLabel || option().suffix}>
                <span
                  data-slot="itemLabel"
                  style={merged.styles?.itemLabel}
                  class={cn(
                    'text-sm inline-flex gap-2 truncate items-baseline',
                    merged.classes?.itemLabel,
                  )}
                >
                  <Show when={option().prefix}>
                    <span
                      data-slot="itemLabelPrefix"
                      style={merged.styles?.itemLabelPrefix}
                      class={cn('text-muted-foreground shrink-0', merged.classes?.itemLabelPrefix)}
                    >
                      {option().prefix}
                    </span>
                  </Show>
                  <span
                    data-slot="itemLabelBase"
                    style={merged.styles?.itemLabelBase}
                    class={cn(merged.classes?.itemLabelBase)}
                  >
                    {option().itemLabel}
                  </span>
                  <Show when={option().suffix}>
                    <span
                      data-slot="itemLabelSuffix"
                      style={merged.styles?.itemLabelSuffix}
                      class={cn(
                        'text-xs text-muted-foreground shrink-0',
                        merged.classes?.itemLabelSuffix,
                      )}
                    >
                      {option().suffix}
                    </span>
                  </Show>
                </span>
              </Show>
              <Show when={option().description}>
                <span
                  data-slot="itemDescription"
                  style={merged.styles?.itemDescription}
                  class={cn(
                    'text-xs text-muted-foreground truncate',
                    merged.classes?.itemDescription,
                  )}
                >
                  {option().description}
                </span>
              </Show>
            </span>

            {/* Trailing: children indicator or kbds */}
            <Show
              when={hasChildren()}
              fallback={
                <Kbd
                  slotPrefix="itemTrailing"
                  value={option().kbds}
                  classes={{
                    root: merged.classes?.itemTrailingKbds,
                    item: merged.classes?.itemTrailingKbd,
                  }}
                />
              }
            >
              <Icon
                name={merged.childIcon}
                data-slot="itemTrailing"
                style={merged.styles?.itemTrailing}
                class={cn('text-muted-foreground shrink-0', merged.classes?.itemTrailing)}
              />
            </Show>
          </Combobox.Item>
        )
      }}
      sectionComponent={(sectionProps) => (
        <Combobox.Section
          data-slot="group"
          style={merged.styles?.group}
          class={cn('mt-2 p-1', merged.classes?.group)}
        >
          <Show when={sectionProps.section.rawValue.label}>
            <span
              data-slot="label"
              style={merged.styles?.label}
              class={cn(
                'text-sm text-muted-foreground font-semibold px-1.5',
                merged.classes?.label,
              )}
            >
              {sectionProps.section.rawValue.label}
            </span>
          </Show>
        </Combobox.Section>
      )}
    >
      {/* ── Input area ─────────────────────────────────────────────────── */}
      <Combobox.Control<NormalizedItem>
        data-slot="inputWrapper"
        style={merged.styles?.inputWrapper}
        class={cn('px-3 flex gap-2 h-12 items-center', merged.classes?.inputWrapper)}
      >
        <Show
          when={history().length > 0}
          fallback={
            <IconButton
              name={merged.searchIcon}
              data-slot="search"
              style={merged.styles?.search}
              loading={merged.loading}
              loadingIcon={merged.loadingIcon}
              class={cn('text-muted-foreground size-5 pointer-events-none', merged.classes?.search)}
            />
          }
        >
          <IconButton
            name={merged.backIcon}
            loading={merged.loading}
            loadingIcon={merged.loadingIcon}
            data-slot="back"
            style={merged.styles?.back}
            class={cn(
              'text-muted-foreground outline-none hover:text-foreground',
              merged.classes?.back,
            )}
            onClick={navigateBack}
            aria-label="Go back"
          />
        </Show>

        <Combobox.Input
          ref={(el: any) => (inputRef = el)}
          data-slot="input"
          style={merged.styles?.input}
          class={cn(
            'outline-none bg-transparent flex-1 placeholder:text-muted-foreground disabled:effect-dis',
            merged.classes?.input,
          )}
          placeholder={merged.placeholder}
          autofocus={merged.autofocus}
          maxLength={merged.searchMaxLength}
          onKeyDown={handleKeyDown}
        />

        <Show when={merged.close}>
          <IconButton
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
      </Combobox.Control>

      {/* ── List ───────────────────────────────────────────────────────── */}
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
        <Combobox.Listbox
          data-slot="listbox"
          style={merged.styles?.listbox}
          class={cn(
            'p-1 max-h-36vh overflow-x-hidden overflow-y-auto focus:outline-none',
            merged.classes?.listbox,
          )}
        />
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
    </Combobox>
  )
}
