import { Combobox } from '@kobalte/core/combobox'
import type { JSX } from 'solid-js'
import { Show, createEffect, createMemo, createSignal, mergeProps } from 'solid-js'

import { Icon, IconButton } from '../icon'
import type { IconName } from '../icon'
import { Kbd } from '../kbd'
import type { SlotClasses } from '../shared/slot-class'
import { cn } from '../shared/utils'

import type { CommandPaletteSize } from './command-palette.class'
import {
  commandPaletteEmptyVariants,
  commandPaletteGroupLabelVariants,
  commandPaletteInputVariants,
  commandPaletteInputWrapperVariants,
  commandPaletteItemIconVariants,
  commandPaletteItemVariants,
} from './command-palette.class'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CommandPaletteItem {
  value: string
  label?: string
  prefix?: string
  suffix?: string
  description?: string
  /** UnoCSS icon class, e.g. `icon-search` or `i-lucide-search` */
  icon?: string
  kbds?: string[]
  /** Force-active (highlighted) state */
  active?: boolean
  disabled?: boolean
  /** Selecting this item drills into a sub-group */
  children?: CommandPaletteItem[]
  onSelect?: () => void
}

export interface CommandPaletteGroup {
  id: string
  label?: string
  items?: CommandPaletteItem[]
}

type CommandPaletteSlots =
  | 'root'
  | 'inputWrapper'
  | 'input'
  | 'listbox'
  | 'group'
  | 'groupLabel'
  | 'item'
  | 'itemLeadingIcon'
  | 'itemWrapper'
  | 'itemLabel'
  | 'itemLabelBase'
  | 'itemPrefix'
  | 'itemSuffix'
  | 'itemDescription'
  | 'itemTrailing'
  | 'itemTrailingIcon'
  | 'itemTrailingKbds'
  | 'itemTrailingKbd'
  | 'searchIcon'
  | 'back'
  | 'close'
  | 'empty'

export type CommandPaletteClasses = SlotClasses<CommandPaletteSlots>

export interface CommandPaletteProps {
  groups?: CommandPaletteGroup[]
  /** @default 'md' */
  size?: CommandPaletteSize
  /** @default 'Search...' */
  placeholder?: string
  /** Controlled search term */
  searchTerm?: string
  onSearchTermChange?: (term: string) => void
  /** @default true */
  autofocus?: boolean
  /** @default 'icon-search' */
  searchIcon?: IconName
  /** @default 'icon-loading' */
  loadingIcon?: IconName
  /** @default 'icon-chevron-right' */
  childIcon?: IconName
  /** @default 'icon-arrow-left' */
  backIcon?: IconName
  /** @default 'icon-close' */
  closeIcon?: IconName
  /** Show a close button */
  close?: boolean
  onClose?: () => void
  /** Show a loading spinner in the search icon slot */
  loading?: boolean
  /** Custom empty state content. Defaults to "No results." */
  empty?: JSX.Element
  classes?: CommandPaletteClasses
}

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
      size: 'md' as CommandPaletteSize,
      placeholder: 'Search...',
      autofocus: true,
      close: false,
      searchIcon: 'icon-search' as IconName,
      loadingIcon: 'icon-loading' as IconName,
      childIcon: 'icon-chevron-right' as IconName,
      backIcon: 'icon-arrow-left' as IconName,
      closeIcon: 'icon-close' as IconName,
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

  function updateSearch(value: string): void {
    if (suppressInputChange) {
      suppressInputChange = false
      return
    }
    if (merged.searchTerm === undefined) {
      setInternalSearch(value)
    }
    merged.onSearchTermChange?.(value)
  }

  createEffect(() => {
    if (merged.searchTerm !== undefined && inputRef && inputRef.value !== merged.searchTerm) {
      inputRef.value = merged.searchTerm
    }
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
    updateSearch('')
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
      updateSearch('')
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
      onChange={handleChange}
      onInputChange={updateSearch}
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
            class={cn(
              commandPaletteItemVariants({
                size: merged.size,
                hasIcon: !!option().icon,
              }),
              merged.classes?.item,
            )}
            onPointerDown={(e: PointerEvent) => e.preventDefault()}
          >
            {/* Leading: loading spinner or icon */}
            <Show when={option().icon}>
              <Icon
                name={option().icon}
                data-slot="item-leading-icon"
                class={cn(
                  commandPaletteItemIconVariants({ size: merged.size }),
                  merged.classes?.itemLeadingIcon,
                )}
              />
            </Show>

            {/* Content wrapper */}
            <span
              data-slot="item-wrapper"
              class={cn('text-start flex flex-1 flex-col min-w-0', merged.classes?.itemWrapper)}
            >
              <Show when={option().prefix || option().itemLabel || option().suffix}>
                <span
                  data-slot="item-label"
                  class={cn('inline-flex gap-1 truncate items-baseline', merged.classes?.itemLabel)}
                >
                  <Show when={option().prefix}>
                    <span
                      data-slot="item-prefix"
                      class={cn('text-muted-foreground shrink-0', merged.classes?.itemPrefix)}
                    >
                      {option().prefix}
                    </span>
                  </Show>
                  <span
                    data-slot="item-label-base"
                    class={cn('truncate', merged.classes?.itemLabelBase)}
                  >
                    {option().itemLabel}
                  </span>
                  <Show when={option().suffix}>
                    <span
                      data-slot="item-suffix"
                      class={cn('text-muted-foreground shrink-0', merged.classes?.itemSuffix)}
                    >
                      {option().suffix}
                    </span>
                  </Show>
                </span>
              </Show>
              <Show when={option().description}>
                <span
                  data-slot="item-description"
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
            <span
              data-slot="item-trailing"
              class={cn(
                'ms-auto inline-flex shrink-0 gap-1.5 items-center',
                merged.classes?.itemTrailing,
              )}
            >
              <Show when={hasChildren()}>
                <Icon
                  name={merged.childIcon}
                  size={merged.size}
                  data-slot="item-trailing-icon"
                  class={commandPaletteItemIconVariants(
                    { size: merged.size },
                    merged.classes?.itemTrailingIcon,
                  )}
                />
              </Show>
              <Show when={!hasChildren()}>
                <Kbd
                  size="sm"
                  slotPrefix="item"
                  value={option().kbds}
                  classes={{
                    root: merged.classes?.itemTrailingKbds,
                    item: merged.classes?.itemTrailingKbd,
                  }}
                />
              </Show>
            </span>
          </Combobox.Item>
        )
      }}
      sectionComponent={(sectionProps) => (
        <Combobox.Section data-slot="group" class={cn('p-1', merged.classes?.group)}>
          <Show when={sectionProps.section.rawValue.label}>
            <span
              data-slot="group-label"
              class={commandPaletteGroupLabelVariants(
                { size: merged.size },
                merged.classes?.groupLabel,
              )}
            >
              {sectionProps.section.rawValue.label}
            </span>
          </Show>
        </Combobox.Section>
      )}
      data-slot="root"
      class={cn('flex flex-col min-h-0 divide-y divide-border', merged.classes?.root)}
    >
      {/* ── Input area ─────────────────────────────────────────────────── */}
      <Combobox.Control<NormalizedItem>
        data-slot="input-wrapper"
        class={commandPaletteInputWrapperVariants(
          { size: merged.size },
          merged.classes?.inputWrapper,
        )}
      >
        <Show
          when={history().length > 0}
          fallback={
            <IconButton
              name={merged.searchIcon}
              data-slot="search-icon"
              size={merged.size}
              loading={merged.loading}
              loadingIcon={merged.loadingIcon}
              class={cn('text-muted-foreground', merged.classes?.searchIcon)}
            />
          }
        >
          <IconButton
            name={merged.backIcon}
            size={merged.size}
            loading={merged.loading}
            loadingIcon={merged.loadingIcon}
            data-slot="back"
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
          class={commandPaletteInputVariants({ size: merged.size }, merged.classes?.input)}
          placeholder={merged.placeholder}
          autofocus={merged.autofocus}
          onKeyDown={handleKeyDown}
        />

        <Show when={merged.close}>
          <IconButton
            name={merged.closeIcon}
            data-slot="close"
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
            class={commandPaletteEmptyVariants({ size: merged.size }, merged.classes?.empty)}
          >
            {merged.empty ?? 'No results.'}
          </div>
        }
      >
        <Combobox.Listbox
          data-slot="listbox"
          class={cn(
            'p-1 overflow-x-hidden overflow-y-auto focus:outline-none',
            merged.classes?.listbox,
          )}
        />
      </Show>
    </Combobox>
  )
}
