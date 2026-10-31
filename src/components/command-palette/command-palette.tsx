import type { JSX } from 'solid-js'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { collatorIncludes, createSearchCollator } from '../../provider/locale/collator'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { renderWithProps } from '../../shared/render-with-props'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { callHandler, callRef, createId } from '../../shared/utils'
import { Icon } from '../icon'
import { List } from '../list'
import type { ListT } from '../list'
import {
  createCompositionState,
  isComposingKeyEvent,
  resolveDirection,
} from '../shared/overlay/utils'

import { defaultCommandPaletteMessages } from './command-palette.messages'
import { commandPaletteDataAttributes, commandPaletteRecipe } from './command-palette.recipe'
import type { CommandPaletteProps, CommandPaletteT } from './command-palette.types'

function isAndroidUserAgent(): boolean {
  return /android/i.test(globalThis.navigator?.userAgent ?? '')
}

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

function buildItemLabel(item: CommandPaletteT.Item): string {
  return item.label || item.value
}

function buildItemSearchText<TItem extends CommandPaletteT.Item>(
  item: TItem,
  group: CommandPaletteT.Group<TItem>,
  getItemSearchText: ((item: TItem, group: CommandPaletteT.Group<TItem>) => string) | undefined,
): string {
  if (getItemSearchText) {
    return getItemSearchText(item, group)
  }

  return [item.label, item.value, item.description, item.keywords?.join(' ')]
    .filter(Boolean)
    .join(' ')
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
  const { locale, dir: direction } = useLocale()
  const [local, rest] = splitProps(props, [
    'ref',
    'inputRef',
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
    'closable',
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
    'virtualizer',
    'listboxProps',
    'itemProps',
    'inputProps',
    'classes',
    'styles',
    'class',
    'style',
    'translations',
  ])
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

  const merged = mergeProps(
    {
      get placeholder() {
        return messages().placeholder
      },
      autofocus: true,
      closable: false,
      closeOnSelect: true,
      leadingIcon: 'icon-search',
      loadingIcon: 'icon-loading',
      closeIcon: 'icon-close',
    },

    local,
  )

  const [currentSearchTerm, setSearchTerm] = createControllableValue<string>({
    value: () => merged.searchTerm,
    defaultValue: () => '',
  })
  const [activeKey, setActiveKey] = createSignal<string | undefined>(undefined)
  const isActive = createSelector(activeKey)
  const [inputElement, setInputElement] = createSignal<HTMLInputElement | undefined>()
  let listboxElement: HTMLDivElement | undefined
  const listboxId = createId(undefined, 'command-palette-listbox')
  const descriptionPosition = () => variants.descriptionPosition
  const activeDescendantId = createMemo(() =>
    activeKey() ? `${listboxId()}-${encodeURIComponent(String(activeKey()))}` : undefined,
  )
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
    setSearchTerm(value)
    merged.onSearchTermChange?.(value)
  }

  createEffect(
    on([inputElement, () => merged.autofocus], ([input, autofocus]) => {
      if (!autofocus || !input) {
        return
      }

      queueMicrotask(() => {
        if (input.isConnected && !input.closest('[role="dialog"]')) {
          input.focus({ preventScroll: true })
        }
      })
    }),
  )

  createEffect(
    on([inputElement, () => merged.searchTerm], ([input, searchTerm]) => {
      if (searchTerm !== undefined && input && input.value !== searchTerm) {
        input.value = searchTerm
      }
    }),
  )

  const groups = createMemo<CommandPaletteT.Group<TItem>[]>(() => merged.groups ?? [])

  const normalizedGroups = createMemo(() =>
    createNormalizedGroups<TItem>(groups(), merged.getItemSearchText, warnDuplicateValue),
  )
  const visibleGroups = createMemo(() => {
    const term = currentSearchTerm().trim()
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

    const collator = createSearchCollator(locale())
    return normalizedGroups()
      .map((group) =>
        Object.assign({}, group, {
          items: group.items.filter(
            (item) => item.alwaysShow || collatorIncludes(collator, item.searchText, term),
          ),
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

  const enabledKeys = createMemo(
    () => new Set(visibleItems().flatMap((item) => (item.disabled ? [] : [item.key]))),
  )

  createEffect(
    on([enabledKeys, activeKey], ([keys, highlighted]) => {
      if (highlighted && keys.has(highlighted)) {
        return
      }
      setActiveKey(keys.values().next().value)
    }),
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
    on([activeKey, visibleItemByKey, () => merged.virtualizer], ([key, items, virtualizer]) => {
      if (!key) {
        return
      }
      const item = items.get(key)
      if (!item) {
        return
      }
      // Rows outside the virtual window have no element to scroll into view.
      const entryIndex = virtualizer ? virtualEntryIndexByKey().get(key) : undefined
      if (virtualizer && entryIndex !== undefined) {
        virtualizer.scrollToIndex(entryIndex)
        return
      }
      const id = activeDescendantId()
      queueMicrotask(() => {
        const element = id ? listboxElement?.ownerDocument.getElementById(id) : undefined
        if (element && listboxElement?.contains(element)) {
          element.scrollIntoView?.({ block: 'nearest' })
        }
      })
    }),
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
      merged.onClose?.()
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (isComposingKeyEvent(event, composition)) {
      return
    }

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

    if (event.key === 'Home' || event.key === 'End') {
      return
    }

    onNavigationKeyDown(event, activeKey(), 'vertical')
  }

  function getContext() {
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
            <Show when={itemProps.item.item.leadingRender !== undefined}>
              <span data-slot="command-palette-item-leading" {...itemLeadingSlot}>
                {renderWithProps(itemProps.item.item.leadingRender, itemProps.context)}
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

            <Show when={itemProps.item.item.trailingRender !== undefined}>
              <span data-slot="command-palette-item-trailing" {...itemTrailingSlot}>
                {renderWithProps(itemProps.item.item.trailingRender, itemProps.context)}
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
        tabIndex={-1}
        data-slot="command-palette-item"
        aria-selected={isActive(itemProps.item.key)}
        aria-disabled={itemProps.item.disabled || undefined}
        aria-posinset={
          merged.virtualizer ? visibleItemPositionByKey().get(itemProps.item.key) : undefined
        }
        aria-setsize={merged.virtualizer ? visibleItems().length : undefined}
        ref={(element) => {
          callRef(itemAttributes()?.ref, element)
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

  const listboxSlot = slotWith('listbox', {
    own: () => ({
      class: merged.listboxProps?.class,
      style: merged.listboxProps?.style,
    }),
  })

  return (
    <div data-slot="command-palette" {...rootSlot} {...rest} ref={(el) => callRef(local.ref, el)}>
      <div data-slot="command-palette-input-wrapper" {...inputWrapperSlot}>
        <Icon
          name={merged.loading ? merged.loadingIcon : merged.leadingIcon}
          data-slot="command-palette-input-leading"
          aria-busy={merged.loading || undefined}
          {...inputLeadingSlot}
        />

        <input
          {...merged.inputProps}
          ref={(el) => {
            setInputElement(el)
            callRef(merged.inputProps?.ref, el)
            callRef(local.inputRef, el)
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
          maxLength={merged.searchMaxLength}
          value={compositionQuery() ?? currentSearchTerm()}
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
          onKeyDown={(event) => {
            const { defaultPrevented } = callHandler(event, merged.inputProps?.onKeyDown)
            if (!defaultPrevented) {
              handleKeyDown(event)
            }
          }}
        />

        <Show when={merged.closable}>
          <button
            type="button"
            data-slot="command-palette-close"
            {...closeSlot}
            onClick={() => {
              merged.onClose?.()
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
            fallback={
              <div data-slot="command-palette-empty" {...emptySlot}>
                <Show when={merged.emptyRender !== undefined} fallback={messages().empty}>
                  {renderWithProps(merged.emptyRender, getContext())}
                </Show>
              </div>
            }
            itemRender={(context) => (
              <div data-slot="command-palette-group" {...groupSlot}>
                <Show when={context.item.label}>
                  <span data-slot="command-palette-group-label" {...groupLabelSlot}>
                    {context.item.label}
                  </span>
                </Show>

                <For each={context.item.items}>{(item) => <VisibleItem item={item} />}</For>
              </div>
            )}
            {...merged.listboxProps}
            id={listboxId()}
            role="listbox"
            data-slot="command-palette-listbox"
            ref={(element: HTMLDivElement) => {
              listboxElement = element
              callRef(merged.listboxProps?.ref, element)
            }}
            {...listboxSlot}
          />
        }
      >
        {(virtualizer) => (
          <List
            as="div"
            items={hasItems() ? virtualEntries() : []}
            fallback={
              <div data-slot="command-palette-empty" {...emptySlot}>
                <Show when={merged.emptyRender !== undefined} fallback={messages().empty}>
                  {renderWithProps(merged.emptyRender, getContext())}
                </Show>
              </div>
            }
            virtualizer={virtualizer()}
            itemRender={(context) => {
              const virtualGroupSlot = slotWith('group', {
                own: () => ({
                  class: context.props?.class,
                  style: context.props?.style,
                }),
              })

              return (
                <Show
                  when={context.item.type === 'label'}
                  fallback={
                    <Show when={visibleItemByKey().get(context.item.key)}>
                      {(item) => <VisibleItem item={item()} virtualProps={context.props} />}
                    </Show>
                  }
                >
                  <div
                    role="presentation"
                    data-slot="command-palette-group"
                    {...context.props}
                    {...virtualGroupSlot}
                  >
                    <span data-slot="command-palette-group-label" {...groupLabelSlot}>
                      {context.item.type === 'label' ? context.item.label : ''}
                    </span>
                  </div>
                </Show>
              )
            }}
            {...merged.listboxProps}
            id={listboxId()}
            role="listbox"
            data-slot="command-palette-listbox"
            ref={(element: HTMLDivElement) => {
              listboxElement = element
              callRef(merged.listboxProps?.ref, element)
            }}
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
