import type { JSX } from '@solidjs/web'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  merge,
  onCleanup,
  omit,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { collatorMatches, createSearchCollator } from '../../provider/locale/collator'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { createKeyDownHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import {
  callHandler,
  callRef,
  createId,
  isAndroidUserAgent,
  pick,
  createSelector,
} from '../../shared/utils'
import { Icon } from '../icon'
import { KbdGroup } from '../kbd-group'
import { List } from '../list'
import type { ListT } from '../list'
import { useSearchQuery } from '../shared/form/select/search-query'
import { createCompositionState } from '../shared/overlay/composition'
import { resolveDirection } from '../shared/overlay/direction'

import { defaultCommandPaletteMessages } from './command-palette.messages'
import { commandPaletteDataAttributes, commandPaletteRecipe } from './command-palette.recipe'
import type { CommandPaletteProps, CommandPaletteT } from './command-palette.types'
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
  /** Positional identifier; the public `Group` has none. */
  id: string
  source: CommandPaletteT.Group<TItem>
  label: string
  items: Array<NormalizedItem<TItem>>
}

function buildItemLabel(item: CommandPaletteT.Item): string {
  return item.label || item.value
}

function buildItemSearchText<TItem extends CommandPaletteT.Item>(
  item: TItem,
  getItemSearchText: ((item: TItem) => string) | undefined,
): string {
  if (getItemSearchText) {
    return getItemSearchText(item)
  }

  return [item.label, item.value, item.description, item.keywords?.join(' ')]
    .filter(Boolean)
    .join(' ')
}

function isGroup<TItem extends CommandPaletteT.Item>(
  entry: CommandPaletteT.Entry<TItem>,
): entry is CommandPaletteT.Group<TItem> {
  return (entry as CommandPaletteT.Group<TItem>).type === 'group'
}

/** Collects each run of loose items into one unlabelled group, so every item has a group. */
function toGroups<TItem extends CommandPaletteT.Item>(
  entries: Array<CommandPaletteT.Entry<TItem>>,
): Array<CommandPaletteT.Group<TItem>> {
  const groups: Array<CommandPaletteT.Group<TItem>> = []
  let loose: Array<TItem> | undefined

  for (const entry of entries) {
    if (isGroup(entry)) {
      loose = undefined
      groups.push(entry)
      continue
    }

    if (!loose) {
      loose = []
      groups.push({ type: 'group', children: loose })
    }
    loose.push(entry)
  }

  return groups
}

function createNormalizedGroups<TItem extends CommandPaletteT.Item>(
  groups: Array<CommandPaletteT.Group<TItem>>,
  getItemSearchText: ((item: TItem) => string) | undefined,
  warnDuplicateValue: (value: string) => void,
): Array<NormalizedGroup<TItem>> {
  const seenValues = new Set<string>()
  const seenKeys = new Set<string>()

  const createItemKey = (value: string, groupIndex: number, itemIndex: number): string => {
    if (!seenKeys.has(value)) {
      seenKeys.add(value)
      return value
    }

    const key = `${value}::${groupIndex}:${itemIndex}`
    seenKeys.add(key)
    return key
  }

  return groups.map((group, groupIndex) => ({
    id: `group-${groupIndex}`,
    source: group,
    label: group.label ?? '',
    items: (group.children ?? []).map((item, index) => {
      if (seenValues.has(item.value)) {
        warnDuplicateValue(item.value)
      }

      seenValues.add(item.value)
      const label = buildItemLabel(item)

      return {
        key: createItemKey(item.value, groupIndex, index),
        label,
        searchText: buildItemSearchText(item, getItemSearchText),
        disabled: Boolean(item.disabled),
        item,
        group,
        alwaysShow: Boolean(item.alwaysShow),
      }
    }),
  }))
}

/**
 * Searchable list of commands or navigation targets, optionally grouped, shown on an inline
 * surface with keyboard navigation. The application decides when to open it and registers any
 * global shortcut; wrap it in `Dialog` or `BaseDialog` for a focused overlay, which also owns Escape
 * dismissal. Use `NavigationMenu` for persistent site destinations. It filters the supplied
 * `items` and calls `onSelect` or the item's own `onSelect`.
 *
 * @example
 * ```tsx
 * import { CommandPalette } from 'moraine'
 *
 * <CommandPalette
 *   placeholder="Find a page..."
 *   items={[
 *     {
 *       type: 'group',
 *       label: 'Pages',
 *       children: [
 *         { value: 'settings', label: 'Settings' },
 *         { value: 'billing', label: 'Billing' },
 *       ],
 *     },
 *   ]}
 *   onSelect={(item) => console.log(item.value)}
 * />
 * ```
 */
export function CommandPalette<TItem extends CommandPaletteT.Item = CommandPaletteT.Item>(
  props: CommandPaletteProps<TItem>,
): JSX.Element {
  const { locale, dir: direction } = useLocale()
  const local = pick(
    props,
    'ref',
    'inputRef',
    'items',
    'placeholder',
    'searchValue',
    'defaultSearchValue',
    'onSearchValueChange',
    'onSelect',
    'searchMaxLength',
    'autoFocus',
    'leading',
    'loadingIcon',
    'closeIcon',
    'closable',
    'onCloseRequest',
    'closeOnSelect',
    'loading',
    'getItemSearchText',
    'filterMethod',
    'descriptionPosition',
    'emptyRender',
    'footerRender',
    'itemRender',
    'virtualizer',
    'listboxProps',
    'itemProps',
    'inputProps',
    'classes',
    'styles',
    'class',
    'style',
    'translations',
  )
  const rest = omit(
    props,
    'ref',
    'inputRef',
    'items',
    'placeholder',
    'searchValue',
    'defaultSearchValue',
    'onSearchValueChange',
    'onSelect',
    'searchMaxLength',
    'autoFocus',
    'leading',
    'loadingIcon',
    'closeIcon',
    'closable',
    'onCloseRequest',
    'closeOnSelect',
    'loading',
    'getItemSearchText',
    'filterMethod',
    'descriptionPosition',
    'emptyRender',
    'footerRender',
    'itemRender',
    'virtualizer',
    'listboxProps',
    'itemProps',
    'inputProps',
    'classes',
    'styles',
    'class',
    'style',
    'translations',
  )
  const messages = useMessages(
    'commandPalette',
    defaultCommandPaletteMessages,
    () => local.translations,
  )
  const {
    slots: {
      root: rootSlot,
      inputWrapper: inputWrapperSlot,
      inputLeading: inputLeadingSlot,
      input: inputSlot,
      close: closeSlot,
      empty: emptySlot,
      group: groupSlot,
      groupLabel: groupLabelSlot,
      itemWrapper: itemWrapperSlot,
      itemLabel: itemLabelSlot,
      footer: footerSlot,
    },
    variants,
    slotWith,
  } = useRecipe(commandPaletteRecipe, local, {
    data: {
      inputLeading: commandPaletteDataAttributes.inputLeading(() => ({
        loading: () => merged.loading,
      })),
    },
  })

  const merged = merge(
    {
      get placeholder() {
        return messages().placeholder
      },
      autoFocus: true,
      closable: false,
      closeOnSelect: true,
      leading: 'icon-search',
      loadingIcon: 'icon-loading',
      closeIcon: 'icon-close',
    },

    local,
  )

  const search = useSearchQuery({
    get value() {
      return merged.searchValue
    },
    get defaultValue() {
      return merged.defaultSearchValue
    },
    get onValueChange() {
      return merged.onSearchValueChange
    },
    get maxLength() {
      return merged.searchMaxLength
    },
  })
  const currentSearchValue = search.value
  const [inputElement, setInputElement] = createSignal<HTMLInputElement | undefined>()
  let listboxElement: HTMLDivElement | undefined
  const listboxId = createId(undefined, 'command-palette-listbox')
  const descriptionPosition = () => variants.descriptionPosition
  const composition = createCompositionState()
  const [compositionQuery, setCompositionQuery] = createSignal<string>()
  const warnedDuplicateValues = new Set<string>()

  function handleCompositionStart(value: string): void {
    if (isAndroidUserAgent()) {
      return
    }
    composition.onCompositionStart()
    setCompositionQuery(value)
  }

  function handleCompositionEnd(value: string): void {
    composition.onCompositionEnd()
    if (compositionQuery() === undefined) {
      return
    }
    setCompositionQuery(undefined)
    applySearchValue(value)
  }

  onCleanup(() => {
    composition.dispose()
  })

  const warnDuplicateValue = (value: string): void => {
    if (!DEV || warnedDuplicateValues.has(value)) {
      return
    }

    warnedDuplicateValues.add(value)
    console.warn(
      `[moraine] CommandPalette received duplicate item value "${value}". ` +
        'Using a deduplicated internal key. Ensure item.value is unique for predictable selection.',
    )
  }

  function applySearchValue(value: string): void {
    const next = search.setValue(value)
    const input = inputElement()
    // Committed text past `searchMaxLength` (IME or programmatic input) is cut back in the field too.
    if (input && next !== value) {
      input.value = next
    }
  }

  createEffect(
    () => [inputElement(), (() => merged.autoFocus)()],
    ([input, autoFocus]) => {
      if (!autoFocus || !input) {
        return
      }

      queueMicrotask(() => {
        if (input.isConnected && !input.closest('[role="dialog"]')) {
          input.focus({ preventScroll: true })
        }
      })
    },
  )

  const groups = createMemo<Array<CommandPaletteT.Group<TItem>>>(() => toGroups(merged.items ?? []))

  const normalizedGroups = createMemo(() =>
    createNormalizedGroups<TItem>(groups(), merged.getItemSearchText, warnDuplicateValue),
  )
  const visibleGroups = createMemo(() => {
    const term = currentSearchValue().trim()
    const method = merged.filterMethod
    if (method === false || term === '') {
      return normalizedGroups()
    }

    const collator = createSearchCollator(locale())
    const matches = (item: NormalizedItem<TItem>): boolean =>
      typeof method === 'function'
        ? method(term, item.item)
        : collatorMatches(collator, method ?? 'contains', item.searchText, term)
    return normalizedGroups()
      .map((group) =>
        Object.assign({}, group, {
          items: group.items.filter((item) => item.alwaysShow || matches(item)),
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
  const virtualEntries = createMemo<Array<CommandPaletteT.VirtualEntry<TItem>>>(() => {
    const entries: Array<CommandPaletteT.VirtualEntry<TItem>> = []

    for (const group of visibleGroups()) {
      if (group.label) {
        entries.push({
          type: 'label',
          key: group.id,
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

  const enabledKeys = createMemo(
    () => new Set(visibleItems().flatMap((item) => (item.disabled ? [] : [item.key]))),
  )

  // The highlighted item, or the first enabled one once it is filtered out or disabled. Writes
  // highlight an item until the next change of the enabled items re-derives it.
  const [activeKey, setActiveKey] = createSignal<string | undefined>((previous) => {
    const keys = enabledKeys()
    return previous !== undefined && keys.has(previous) ? previous : keys.values().next().value
  })
  const isActive = createSelector(activeKey)
  const activeDescendantId = createMemo(() =>
    activeKey() ? `${listboxId()}-${encodeURIComponent(String(activeKey()))}` : undefined,
  )

  const virtualEntryIndexByKey = createLazyMemo(() => {
    const indexes = new Map<string, number>()
    virtualEntries().forEach((entry, index) => {
      if (entry.type === 'item') {
        indexes.set(entry.key, index)
      }
    })
    return indexes
  })

  createEffect(
    () => {
      const key = activeKey()
      const virtualizer = merged.virtualizer
      const visible = key !== undefined && visibleItemByKey().has(key)
      return {
        visible,
        virtualizer,
        // Rows outside the virtual window have no element to scroll into view.
        entryIndex: visible && virtualizer ? virtualEntryIndexByKey().get(key) : undefined,
        id: activeDescendantId(),
      }
    },
    ({ visible, virtualizer, entryIndex, id }) => {
      if (!visible) {
        return
      }
      if (virtualizer && entryIndex !== undefined) {
        virtualizer.scrollToIndex(entryIndex)
        return
      }
      queueMicrotask(() => {
        const element = id ? listboxElement?.ownerDocument.getElementById(id) : undefined
        if (element && listboxElement?.contains(element)) {
          element.scrollIntoView?.({ block: 'nearest' })
        }
      })
    },
  )

  const { onNavigationKeyDown } = createSelectableCollectionNavigation<
    NormalizedItem<TItem>,
    string
  >({
    items: () => visibleItems(),
    getValue: (item) => item.key,
    isDisabled: (item) => item.disabled,
    loop: () => true,
    activationMode: () => 'manual',
    getDirection: () => resolveDirection(listboxElement, direction()),
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
      merged.onCloseRequest?.()
    }
  }

  const handleKeyDown = createKeyDownHandler<HTMLInputElement>({
    onKeyDown: () => merged.inputProps?.onKeyDown,
    composing: composition.isComposing,
    // Space types a search term; Home/End move the text caret.
    ignore: [' ', 'Home', 'End'],
    keys: {
      Enter: {
        when: () => visibleItems().some((item) => item.key === activeKey()),
        handle: () => {
          const highlighted = visibleItems().find((item) => item.key === activeKey())
          if (highlighted) {
            activateItem(highlighted.item)
          }
        },
      },
    },
    onUnhandled: (event) => onNavigationKeyDown(event, activeKey(), 'vertical'),
  })

  function getContext() {
    return {
      get searchValue() {
        return currentSearchValue()
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
            children: group.items.map((item) => item.item),
          }),
        )
      },
    }
  }

  function ItemDescription(itemProps: {
    highlighted: boolean
    item: NormalizedItem<TItem>
  }): JSX.Element {
    const itemDescriptionSlot = slotWith('itemDescription', {
      data: commandPaletteDataAttributes.itemDescription({
        highlighted: () => itemProps.highlighted,
      }),
    })

    return (
      <Show when={itemProps.item.item.description}>
        <span data-slot="command-palette-item-description" {...itemDescriptionSlot}>
          {itemProps.item.item.description}
        </span>
      </Show>
    )
  }

  function CommandItem(itemProps: {
    item: NormalizedItem<TItem>
    context: CommandPaletteT.ItemRenderProps<TItem>
  }): JSX.Element {
    const itemLeadingSlot = slotWith('itemLeading', {
      data: commandPaletteDataAttributes.itemLeading({
        highlighted: () => itemProps.context.highlighted,
      }),
    })
    const itemTrailingSlot = slotWith('itemTrailing', {
      data: commandPaletteDataAttributes.itemTrailing({
        highlighted: () => itemProps.context.highlighted,
      }),
    })

    return (
      <Show
        when={merged.itemRender}
        keyed
        fallback={
          <>
            <Show
              when={
                itemProps.item.item.leadingRender !== undefined ||
                itemProps.item.item.icon !== undefined
              }
            >
              <span data-slot="command-palette-item-leading" {...itemLeadingSlot}>
                <Show
                  when={itemProps.item.item.leadingRender !== undefined}
                  fallback={
                    <Show when={itemProps.item.item.icon}>{(icon) => <Icon name={icon()} />}</Show>
                  }
                >
                  {renderWithProps(itemProps.item.item.leadingRender, itemProps.context)}
                </Show>
              </span>
            </Show>

            <span data-slot="command-palette-item-wrapper" {...itemWrapperSlot}>
              <span data-slot="command-palette-item-label" {...itemLabelSlot}>
                <span>{itemProps.item.item.label ?? itemProps.item.label}</span>
                <Show when={descriptionPosition() === 'trailing'}>
                  <ItemDescription
                    highlighted={itemProps.context.highlighted}
                    item={itemProps.item}
                  />
                </Show>
              </span>
              <Show when={descriptionPosition() === 'bottom'}>
                <ItemDescription
                  highlighted={itemProps.context.highlighted}
                  item={itemProps.item}
                />
              </Show>
            </span>

            <Show
              when={
                itemProps.item.item.trailingRender !== undefined ||
                (itemProps.item.item.kbds?.length ?? 0) > 0
              }
            >
              <span data-slot="command-palette-item-trailing" {...itemTrailingSlot}>
                <Show
                  when={itemProps.item.item.trailingRender !== undefined}
                  fallback={
                    <Show when={itemProps.item.item.kbds}>
                      {(kbds) => <KbdGroup size="sm" items={kbds()} />}
                    </Show>
                  }
                >
                  {renderWithProps(itemProps.item.item.trailingRender, itemProps.context)}
                </Show>
              </span>
            </Show>
          </>
        }
      >
        {(render) => renderWithProps(render, itemProps.context)}
      </Show>
    )
  }

  function VisibleItem(itemProps: {
    item: NormalizedItem<TItem>
    virtualProps?: ListT.RowProps
  }): JSX.Element {
    const context = getContext()
    const itemContext: CommandPaletteT.ItemRenderProps<TItem> = {
      get searchValue() {
        return context.searchValue
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
      get item() {
        return itemProps.item.item
      },
      get group() {
        return itemProps.item.group
      },
      get highlighted() {
        return isActive(itemProps.item.key)
      },
      get disabled() {
        return itemProps.item.disabled
      },
    }

    const itemAttributes = createMemo(() => merged.itemProps?.(itemContext))
    const itemSlot = slotWith('item', {
      own: () => ({ class: itemAttributes()?.class, style: itemAttributes()?.style }),
      enforced: () => ({
        class: itemProps.virtualProps?.class,
        style: itemProps.virtualProps?.style,
      }),
      data: commandPaletteDataAttributes.item({
        disabled: () => itemProps.item.disabled,
        highlighted: () => isActive(itemProps.item.key),
      }),
    })

    return (
      <div
        {...itemAttributes()}
        {...itemProps.virtualProps}
        id={`${listboxId()}-${encodeURIComponent(itemProps.item.key)}`}
        role="option"
        tabindex={-1}
        data-slot="command-palette-item"
        aria-selected={isActive(itemProps.item.key) ? 'true' : 'false'}
        aria-disabled={itemProps.item.disabled ? 'true' : undefined}
        aria-posinset={
          merged.virtualizer ? visibleItemPositionByKey().get(itemProps.item.key) : undefined
        }
        aria-setsize={merged.virtualizer ? visibleItems().length : undefined}
        ref={(element) => {
          callRef(() => itemAttributes()?.ref, element)
          itemProps.virtualProps?.ref?.(element)
        }}
        {...itemSlot}
        onPointerMove={(event) => {
          callHandler(event, itemAttributes()?.onPointerMove)
          callHandler(event, itemProps.virtualProps?.onPointerMove)
          if (
            !event.defaultPrevented &&
            event.pointerType === 'mouse' &&
            !itemProps.item.disabled
          ) {
            setActiveKey(itemProps.item.key)
          }
        }}
        onPointerDown={(event) => {
          callHandler(event, itemAttributes()?.onPointerDown)
          callHandler(event, itemProps.virtualProps?.onPointerDown)
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
          callHandler(event, itemProps.virtualProps?.onClick)
          if (event.defaultPrevented || itemProps.item.disabled) {
            return
          }

          setActiveKey(itemProps.item.key)
          activateItem(itemProps.item.item)
        }}
      >
        <CommandItem item={itemProps.item} context={itemContext} />
      </div>
    )
  }

  function EmptyState(): JSX.Element {
    return (
      <div data-slot="command-palette-empty" {...emptySlot}>
        <Show when={merged.emptyRender !== undefined} fallback={messages().empty}>
          {renderWithProps(merged.emptyRender, getContext())}
        </Show>
      </div>
    )
  }

  function handleListboxRef(element: HTMLDivElement): void {
    listboxElement = element
    callRef(() => merged.listboxProps?.ref, element)
  }

  const listboxSlot = slotWith('listbox', {
    own: () => ({
      class: merged.listboxProps?.class,
      style: merged.listboxProps?.style,
    }),
  })

  function VirtualRow(
    props: ListT.ItemRenderProps<CommandPaletteT.VirtualEntry<TItem>>,
  ): JSX.Element {
    const virtualGroupSlot = slotWith('group', {
      own: () => ({
        class: props.rowProps?.class,
        style: props.rowProps?.style,
      }),
    })

    return (
      <Show
        when={props.item.type === 'label'}
        fallback={
          <Show when={visibleItemByKey().get(props.item.key)}>
            {(item) => <VisibleItem item={item()} virtualProps={props.rowProps} />}
          </Show>
        }
      >
        <div
          role="presentation"
          data-slot="command-palette-group"
          {...props.rowProps}
          {...virtualGroupSlot}
        >
          <span data-slot="command-palette-group-label" {...groupLabelSlot}>
            {props.item.type === 'label' ? props.item.label : ''}
          </span>
        </div>
      </Show>
    )
  }

  function GroupRow(props: ListT.ItemRenderProps<NormalizedGroup<TItem>>): JSX.Element {
    const groupLabelId = () => `${listboxId()}-${props.item.id}-label`
    return (
      <div
        role="group"
        aria-labelledby={props.item.label ? groupLabelId() : undefined}
        data-slot="command-palette-group"
        {...groupSlot}
      >
        <Show when={props.item.label}>
          <span id={groupLabelId()} data-slot="command-palette-group-label" {...groupLabelSlot}>
            {props.item.label}
          </span>
        </Show>

        <For each={props.item.items}>{(item) => <VisibleItem item={item} />}</For>
      </div>
    )
  }

  return (
    <div
      data-slot="command-palette"
      {...rootSlot}
      {...rest}
      ref={(el) => callRef(() => local.ref, el)}
    >
      <div data-slot="command-palette-input-wrapper" {...inputWrapperSlot}>
        <Icon
          name={merged.loading ? merged.loadingIcon : merged.leading}
          data-slot="command-palette-input-leading"
          aria-busy={merged.loading ? 'true' : undefined}
          {...inputLeadingSlot}
        />

        <input
          {...merged.inputProps}
          ref={(el) => {
            setInputElement(el)
            callRef(() => merged.inputProps?.ref, el)
            callRef(() => local.inputRef, el)
          }}
          data-slot="command-palette-input"
          {...inputSlot}
          role="combobox"
          aria-label={
            merged.inputProps?.['aria-label'] ??
            (merged.inputProps?.['aria-labelledby'] === undefined ? merged.placeholder : undefined)
          }
          aria-controls={listboxId()}
          aria-expanded="true"
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeDescendantId()}
          placeholder={merged.placeholder}
          maxlength={merged.searchMaxLength}
          value={compositionQuery() ?? currentSearchValue()}
          onInput={(event) => {
            const { defaultPrevented } = callHandler(event, merged.inputProps?.onInput)
            if (defaultPrevented) {
              return
            }
            if (!isAndroidUserAgent() && compositionQuery() !== undefined) {
              setCompositionQuery(event.currentTarget.value)
              return
            }
            applySearchValue(event.currentTarget.value)
          }}
          onCompositionStart={(event) => {
            callHandler(event, merged.inputProps?.onCompositionStart)
            handleCompositionStart(event.currentTarget.value)
          }}
          onCompositionEnd={(event) => {
            callHandler(event, merged.inputProps?.onCompositionEnd)
            handleCompositionEnd(event.currentTarget.value)
          }}
          onKeyDown={handleKeyDown}
        />

        <Show when={merged.closable}>
          <button
            type="button"
            data-slot="command-palette-close"
            {...closeSlot}
            onClick={() => {
              merged.onCloseRequest?.()
            }}
            aria-label={messages().close}
          >
            <Icon name={merged.closeIcon} />
          </button>
        </Show>
      </div>

      <Show
        when={merged.virtualizer}
        fallback={
          <List
            as="div"
            items={hasItems() ? visibleGroups() : []}
            emptyRender={<EmptyState />}
            itemRender={GroupRow}
            {...merged.listboxProps}
            id={listboxId()}
            role="listbox"
            data-slot="command-palette-listbox"
            ref={handleListboxRef}
            {...listboxSlot}
          />
        }
      >
        {(virtualizer) => (
          <List
            as="div"
            items={hasItems() ? virtualEntries() : []}
            emptyRender={<EmptyState />}
            virtualizer={virtualizer()}
            itemRender={VirtualRow}
            {...merged.listboxProps}
            id={listboxId()}
            role="listbox"
            data-slot="command-palette-listbox"
            ref={handleListboxRef}
            {...listboxSlot}
          />
        )}
      </Show>

      <Show when={merged.footerRender !== undefined}>
        <div data-slot="command-palette-footer" {...footerSlot}>
          {renderWithProps(merged.footerRender, getContext())}
        </div>
      </Show>
    </div>
  )
}
