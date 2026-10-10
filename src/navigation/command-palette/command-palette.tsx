import type { JSX } from 'solid-js'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { Icon } from '../../element/icon'
import { List } from '../../element/list'
import type { ListT } from '../../element/list'
import {
  createCompositionState,
  isComposingKeyEvent,
  resolveDirection,
} from '../../overlay/base/utils'
import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { collatorIncludes, createSearchCollator } from '../../provider/locale/collator'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createControllableValue } from '../../shared/controllable-value'
import { renderWithProps } from '../../shared/render-with-props'
import { createSelectableCollectionNavigation } from '../../shared/selectable-collection-navigation'
import { callHandler, callRef, createId } from '../../shared/utils'

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
  const cn = useCn()
  const messages = useMessages('commandPalette', defaultCommandPaletteMessages)
  const locale = useLocale()
  const direction = locale.dir
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
    'classes',
    'styles',
    'class',
    'style',
  ])
  const resolved = createStyles(commandPaletteRecipe, local)

  const merged = mergeProps(
    {
      get placeholder() {
        return messages().placeholder
      },
      autofocus: true,
      showClose: false,
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
  const [inputElement, setInputElement] = createSignal<HTMLInputElement | undefined>()
  let listboxElement: HTMLDivElement | undefined
  const listboxId = createId(undefined, 'command-palette-listbox')
  const descriptionPosition = () => resolved.variants.descriptionPosition
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

    const collator = createSearchCollator(locale.locale())
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

  const visibleItemSnapshot = () =>
    visibleItems().map((item) => ({ key: item.key, disabled: item.disabled }))

  createEffect(
    on([visibleItemSnapshot, activeKey], ([visibleItems, highlighted]) => {
      const items = visibleItems.filter((item) => !item.disabled)
      if (highlighted && items.some((item) => item.key === highlighted)) {
        return
      }
      setActiveKey(items[0]?.key)
    }),
  )

  createEffect(
    on(
      [activeKey, visibleItemByKey, () => merged.virtualRender, virtualEntries],
      ([key, items, virtual, virtualItems]) => {
        if (!key) {
          return
        }
        const item = items.get(key)
        if (!item) {
          return
        }
        const entries = virtual ? virtualItems : undefined
        const scrollToItem = merged.scrollToItem
        if (entries && scrollToItem) {
          const entryIndex = entries.findIndex(
            (entry) => entry.type === 'item' && entry.key === key,
          )
          if (entryIndex >= 0) {
            scrollToItem(item.item, entryIndex)
            return
          }
        }
        queueMicrotask(() => {
          listboxElement
            ?.querySelector<HTMLElement>('[data-slot="command-palette-item"][data-highlighted]')
            ?.scrollIntoView?.({ block: 'nearest' })
        })
      },
    ),
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
    return (
      <Show when={itemProps.item.item.description}>
        <span
          data-slot="command-palette-item-description"
          {...resolved.styles.itemDescription}
          {...commandPaletteDataAttributes.itemDescription({
            highlighted: () => itemProps.highlighted,
          })}
        >
          {itemProps.item.item.description}
        </span>
      </Show>
    )
  }

  function CommandItem(itemProps: {
    item: NormalizedItem<TItem>
    context: CommandPaletteT.ItemRenderProps<TItem>
  }): JSX.Element {
    return (
      <Show
        when={merged.itemRender}
        keyed
        fallback={
          <>
            <Show when={itemProps.item.item.leadingRender !== undefined}>
              <span
                data-slot="command-palette-item-leading"
                {...resolved.styles.itemLeading}
                {...commandPaletteDataAttributes.itemLeading({
                  highlighted: () => itemProps.context.highlighted,
                })}
              >
                {renderWithProps(itemProps.item.item.leadingRender, itemProps.context)}
              </span>
            </Show>

            <span data-slot="command-palette-item-wrapper" {...resolved.styles.itemWrapper}>
              <span data-slot="command-palette-item-label" {...resolved.styles.itemLabel}>
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
              <span
                data-slot="command-palette-item-trailing"
                {...resolved.styles.itemTrailing}
                {...commandPaletteDataAttributes.itemTrailing({
                  highlighted: () => itemProps.context.highlighted,
                })}
              >
                {renderWithProps(itemProps.item.item.trailingRender, itemProps.context)}
              </span>
            </Show>
          </>
        }
      >
        {(ItemRender) => <ItemRender {...itemProps.context} />}
      </Show>
    )
  }

  function VisibleItem(itemProps: {
    item: NormalizedItem<TItem>
    virtualProps?: ListT.RowProps<HTMLDivElement>
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
        return activeKey() === itemProps.item.key
      },
      get disabled() {
        return itemProps.item.disabled
      },
    }

    const itemAttributes = createMemo(() => merged.itemProps?.(itemContext))

    return (
      <div
        {...itemAttributes()}
        {...itemProps.virtualProps}
        id={`${listboxId()}-${encodeURIComponent(itemProps.item.key)}`}
        role="option"
        tabIndex={-1}
        data-slot="command-palette-item"
        {...commandPaletteDataAttributes.item({
          disabled: () => itemProps.item.disabled,
          highlighted: () => activeKey() === itemProps.item.key,
        })}
        aria-selected={activeKey() === itemProps.item.key}
        aria-disabled={itemProps.item.disabled || undefined}
        aria-posinset={
          merged.virtualRender ? visibleItemPositionByKey().get(itemProps.item.key) : undefined
        }
        aria-setsize={merged.virtualRender ? visibleItems().length : undefined}
        ref={(element) => {
          callRef(itemAttributes()?.ref, element)
          itemProps.virtualProps?.ref?.(element)
        }}
        style={{
          ...itemAttributes()?.style,
          ...itemProps.virtualProps?.style,
          ...resolved.styles.item.style,
        }}
        class={cn(resolved.styles.item.class, [
          itemAttributes()?.class,
          itemProps.virtualProps?.class,
        ])}
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

  return (
    <div
      data-slot="command-palette"
      {...rest}
      ref={(el) => callRef(local.ref, el)}
      {...resolved.styles.root}
    >
      <div data-slot="command-palette-input-wrapper" {...resolved.styles.inputWrapper}>
        <Icon
          name={merged.loading ? merged.loadingIcon : merged.leadingIcon}
          slotName="command-palette-input-leading"
          aria-busy={merged.loading || undefined}
          {...commandPaletteDataAttributes.inputLeading({ loading: () => merged.loading })}
          {...resolved.styles.inputLeading}
        />

        <input
          {...merged.inputProps}
          ref={(el) => {
            setInputElement(el)
            callRef(merged.inputProps?.ref, el)
            callRef(local.inputRef, el)
          }}
          data-slot="command-palette-input"
          {...resolved.styles.input}
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

        <Show when={merged.showClose}>
          <button
            type="button"
            data-slot="command-palette-close"
            {...resolved.styles.close}
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
        when={merged.virtualRender}
        fallback={
          <List
            as="div"
            items={hasItems() ? visibleGroups() : []}
            fallback={
              <div data-slot="command-palette-empty" {...resolved.styles.empty}>
                <Show when={merged.emptyRender !== undefined} fallback={messages().empty}>
                  {renderWithProps(merged.emptyRender, getContext())}
                </Show>
              </div>
            }
            itemRender={(context) => (
              <div data-slot="command-palette-group" {...resolved.styles.group}>
                <Show when={context.item.label}>
                  <span data-slot="command-palette-group-label" {...resolved.styles.groupLabel}>
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
            style={{
              ...merged.listboxProps?.style,
              ...resolved.styles.listbox.style,
            }}
            class={cn(resolved.styles.listbox.class, merged.listboxProps?.class)}
          />
        }
      >
        {(virtualRender) => (
          <List
            as="div"
            items={hasItems() ? virtualEntries() : []}
            fallback={
              <div data-slot="command-palette-empty" {...resolved.styles.empty}>
                <Show when={merged.emptyRender !== undefined} fallback={messages().empty}>
                  {renderWithProps(merged.emptyRender, getContext())}
                </Show>
              </div>
            }
            virtualRender={virtualRender()}
            itemRender={(context) => (
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
                  style={{
                    ...context.props?.style,
                    ...resolved.styles.group.style,
                  }}
                  class={cn(resolved.styles.group.class, context.props?.class)}
                >
                  <span data-slot="command-palette-group-label" {...resolved.styles.groupLabel}>
                    {context.item.type === 'label' ? context.item.label : ''}
                  </span>
                </div>
              </Show>
            )}
            {...merged.listboxProps}
            id={listboxId()}
            role="listbox"
            data-slot="command-palette-listbox"
            ref={(element: HTMLDivElement) => {
              listboxElement = element
              callRef(merged.listboxProps?.ref, element)
            }}
            style={{
              ...merged.listboxProps?.style,
              ...resolved.styles.listbox.style,
            }}
            class={cn(resolved.styles.listbox.class, merged.listboxProps?.class)}
          />
        )}
      </Show>

      <Show when={merged.footerRender !== undefined}>
        <div data-slot="command-palette-footer" {...resolved.styles.footer}>
          {renderWithProps(merged.footerRender, getContext())}
        </div>
      </Show>
    </div>
  )
}
