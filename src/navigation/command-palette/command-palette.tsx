import type { Component, JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { List } from '../../elements/list/index.ts'
import type { ListProps, ListT } from '../../elements/list/index.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'

import type { CommandPaletteProps, CommandPaletteT } from './command-palette.types.ts'

export * from './command-palette.types.ts'

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
  const design = useMoraineDesign()
  const commandPaletteDesign = () => design().commandPalette

  const merged = mergeProps(
    {
      placeholder: 'Search...',
      autofocus: true,
      showClose: false,
      closeOnSelect: true,
      descriptionPosition: 'bottom' as const,
      leadingIcon: 'icon-search',
      loadingIcon: 'icon-loading',
      closeIcon: 'icon-close',
    },
    () => commandPaletteDesign()?.defaultVariants,
    local,
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return commandPaletteDesign()?.recipe()
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

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
        <span data-slot="itemDescription" {...resolved.slotClassAndStyle('itemDescription')}>
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
              <span data-slot="itemLeading" {...resolved.slotClassAndStyle('itemLeading')}>
                {renderComponentOrElement(item.item.leadingRender, itemContext)}
              </span>
            </Show>

            <span
              data-slot="itemWrapper"
              data-description-position={descriptionPosition()}
              {...resolved.slotClassAndStyle('itemWrapper')}
            >
              <span
                data-slot="itemLabel"
                data-description-position={descriptionPosition()}
                {...resolved.slotClassAndStyle('itemLabel')}
              >
                <span>{item.item.label ?? item.label}</span>
                <Show when={descriptionPosition() === 'trailing'}>
                  {renderItemDescription(item)}
                </Show>
              </span>
              <Show when={descriptionPosition() === 'bottom'}>{renderItemDescription(item)}</Show>
            </span>

            <Show when={item.item.trailingRender !== undefined}>
              <span data-slot="itemTrailing" {...resolved.slotClassAndStyle('itemTrailing')}>
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
        style={resolved.slotStyle('item', {
          get state() {
            return {
              style: {
                ...toStyleObject(itemAttributes()?.style),
                ...toStyleObject(virtualProps?.style),
              },
            }
          },
        })}
        class={resolved.slotClass('item', {
          get state() {
            return { class: [itemAttributes()?.class, virtualProps?.class] }
          },
        })}
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
      ref={(el) => callRef(local.ref, el)}
      data-slot="root"
      {...resolved.rootClassAndStyle()}
      {...rest}
    >
      <div data-slot="inputWrapper" {...resolved.slotClassAndStyle('inputWrapper')}>
        <Icon
          name={merged.loading ? merged.loadingIcon : merged.leadingIcon}
          slotName="search"
          aria-busy={merged.loading || undefined}
          data-loading={merged.loading ? '' : undefined}
          {...resolved.slotClassAndStyle('search')}
        />

        <input
          {...merged.inputProps}
          ref={(el) => {
            setInputElement(el)
            callRef((merged.inputProps as any)?.ref, el)
            callRef(local.inputRef, el)
          }}
          data-slot="input"
          {...resolved.slotClassAndStyle('input')}
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
            {...resolved.slotClassAndStyle('close')}
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
          <div data-slot="empty" {...resolved.slotClassAndStyle('empty')}>
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
                <div data-slot="group" {...resolved.slotClassAndStyle('group')}>
                  <Show when={(context.item as NormalizedGroup<TItem>).label}>
                    <span data-slot="label" {...resolved.slotClassAndStyle('label')}>
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
                  style={resolved.slotStyle('group', {
                    get state() {
                      return { style: { ...toStyleObject(context.props?.style) } }
                    },
                  })}
                  class={resolved.slotClass('group', {
                    get state() {
                      return { class: context.props?.class }
                    },
                  })}
                >
                  <span data-slot="label" {...resolved.slotClassAndStyle('label')}>
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
          style={resolved.slotStyle('listbox', {
            get state() {
              return { style: { ...toStyleObject(merged.listboxProps?.style) } }
            },
          })}
          class={resolved.slotClass('listbox', {
            get state() {
              return { class: merged.listboxProps?.class }
            },
          })}
        />
      </Show>

      <Show when={merged.footerRender !== undefined}>
        <div data-slot="footer" {...resolved.slotClassAndStyle('footer')}>
          {renderComponentOrElement(merged.footerRender, getContext())}
        </div>
      </Show>
    </div>
  )
}
