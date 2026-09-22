import type { JSX } from 'solid-js'
import {
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

import { Icon } from '../../elements/icon'
import { List } from '../../elements/list'
import type { ListT } from '../../elements/list'
import { createCompositionState, isComposingKeyEvent } from '../../overlays/base/utils'
import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
import { callHandler, callRef, useId } from '../../shared/utils'

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
  const cn = useCn()
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
      placeholder: 'Search...',
      autofocus: true,
      showClose: false,
      closeOnSelect: true,
      leadingIcon: 'icon-search',
      loadingIcon: 'icon-loading',
      closeIcon: 'icon-close',
    },

    local,
  )

  const [currentSearchTerm, setSearchTerm] = useControllableValue<string>({
    value: () => merged.searchTerm,
    defaultValue: () => '',
  })
  const [activeKey, setActiveKey] = createSignal<string | undefined>(undefined)
  const [inputElement, setInputElement] = createSignal<HTMLInputElement | undefined>()
  let listboxElement: HTMLDivElement | undefined
  const listboxId = useId(undefined, 'command-palette-listbox')
  const descriptionPosition = () => resolved.variants.descriptionPosition
  const activeDescendantId = createMemo(() =>
    activeKey() ? `${listboxId()}-${encodeURIComponent(String(activeKey()))}` : undefined,
  )
  const composition = createCompositionState()
  const warnedDuplicateValues = new Set<string>()

  function handleCompositionStart(): void {
    composition.onCompositionStart()
  }

  function handleCompositionEnd(): void {
    composition.onCompositionEnd()
  }

  onCleanup(() => {
    composition.dispose()
  })

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
            ?.querySelector<HTMLElement>('[data-slot="item"][data-highlighted]')
            ?.scrollIntoView?.({ block: 'nearest' })
        })
      },
    ),
  )

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
        <span data-slot="itemDescription" {...resolved.styles.itemDescription}>
          {item.item.description}
        </span>
      </Show>
    )
  }

  function renderCommandItem(
    item: NormalizedItem<TItem>,
    itemContext = getItemContext(item),
  ): JSX.Element {
    return (
      <Show
        when={merged.itemRender !== undefined}
        fallback={
          <>
            <Show when={item.item.leadingRender !== undefined}>
              <span data-slot="itemLeading" {...resolved.styles.itemLeading}>
                {renderComponentOrElement(item.item.leadingRender, itemContext)}
              </span>
            </Show>

            <span data-slot="itemWrapper" {...resolved.styles.itemWrapper}>
              <span data-slot="itemLabel" {...resolved.styles.itemLabel}>
                <span>{item.item.label ?? item.label}</span>
                <Show when={descriptionPosition() === 'trailing'}>
                  {renderItemDescription(item)}
                </Show>
              </span>
              <Show when={descriptionPosition() === 'bottom'}>{renderItemDescription(item)}</Show>
            </span>

            <Show when={item.item.trailingRender !== undefined}>
              <span data-slot="itemTrailing" {...resolved.styles.itemTrailing}>
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
        {...commandPaletteDataAttributes.item({
          disabled: () => item.disabled,
          highlighted: () => activeKey() === item.key,
        })}
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
          ...itemAttributes()?.style,
          ...virtualProps?.style,
          ...resolved.styles.item.style,
        }}
        class={cn(resolved.styles.item.class, [itemAttributes()?.class, virtualProps?.class])}
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

  return (
    <div ref={(el) => callRef(local.ref, el)} data-slot="root" {...resolved.styles.root} {...rest}>
      <div data-slot="inputWrapper" {...resolved.styles.inputWrapper}>
        <Icon
          name={merged.loading ? merged.loadingIcon : merged.leadingIcon}
          slotName="search"
          aria-busy={merged.loading || undefined}
          {...commandPaletteDataAttributes.search({ loading: () => merged.loading })}
          {...resolved.styles.search}
        />

        <input
          {...merged.inputProps}
          ref={(el) => {
            setInputElement(el)
            callRef(merged.inputProps?.ref, el)
            callRef(local.inputRef, el)
          }}
          data-slot="input"
          {...resolved.styles.input}
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
            const { defaultPrevented } = callHandler(event, merged.inputProps?.onInput)
            if (!defaultPrevented) {
              applySearchValue(event.currentTarget.value)
            }
          }}
          onCompositionStart={(event) => {
            callHandler(event, merged.inputProps?.onCompositionStart)
            handleCompositionStart()
          }}
          onCompositionEnd={(event) => {
            callHandler(event, merged.inputProps?.onCompositionEnd)
            handleCompositionEnd()
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
            data-slot="close"
            {...resolved.styles.close}
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
          <div data-slot="empty" {...resolved.styles.empty}>
            <Show when={merged.emptyRender !== undefined} fallback="No results.">
              {renderComponentOrElement(merged.emptyRender, getContext())}
            </Show>
          </div>
        }
      >
        <Show
          when={merged.virtualRender}
          fallback={
            <List
              as="div"
              items={visibleGroups()}
              itemRender={(context) => (
                <div data-slot="group" {...resolved.styles.group}>
                  <Show when={context.item.label}>
                    <span data-slot="label" {...resolved.styles.label}>
                      {context.item.label}
                    </span>
                  </Show>

                  <For each={context.item.items}>{(item) => renderVisibleItem(item)}</For>
                </div>
              )}
              id={listboxId()}
              role="listbox"
              data-slot="listbox"
              {...merged.listboxProps}
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
              items={virtualEntries()}
              virtualRender={virtualRender()}
              itemRender={(context) => (
                <Show
                  when={context.item.type === 'label'}
                  fallback={
                    <Show when={visibleItemByKey().get(context.item.key)}>
                      {(item) => renderVisibleItem(item(), context.props)}
                    </Show>
                  }
                >
                  <div
                    role="presentation"
                    data-slot="group"
                    {...context.props}
                    style={{
                      ...context.props?.style,
                      ...resolved.styles.group.style,
                    }}
                    class={cn(resolved.styles.group.class, context.props?.class)}
                  >
                    <span data-slot="label" {...resolved.styles.label}>
                      {context.item.type === 'label' ? context.item.label : ''}
                    </span>
                  </div>
                </Show>
              )}
              id={listboxId()}
              role="listbox"
              data-slot="listbox"
              {...merged.listboxProps}
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
      </Show>

      <Show when={merged.footerRender !== undefined}>
        <div data-slot="footer" {...resolved.styles.footer}>
          {renderComponentOrElement(merged.footerRender, getContext())}
        </div>
      </Show>
    </div>
  )
}
