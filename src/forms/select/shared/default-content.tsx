import type { JSX } from 'solid-js'
import { createEffect, createMemo, For, Show, on } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../../elements/icon/index.ts'
import type { ListT } from '../../../elements/list/index.ts'
import { useCn } from '../../../shared/provider/cn-context.ts'
import type { SlotBinding } from '../../../shared/provider/create-component-styles.ts'
import { renderComponentOrElement } from '../../../shared/render-prop.ts'
import { callHandler, callRef } from '../../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../base-select.tsx'
import type { BaseSelectT } from '../base-select.types.ts'

import { isGroup, itemKey } from './collection.ts'
import type { ContentProps, SelectItem, SelectVirtualEntry } from './types.ts'

export function DefaultSelectContent<T extends SelectItem>(
  props: ContentProps<T> & {
    empty: JSX.Element
    slot: (name: 'itemLeading' | 'itemLabel' | 'itemDescription' | 'itemTrailing') => SlotBinding
  },
): JSX.Element {
  const state = useSelectState<T>()
  const cn = useCn()
  const entries = createMemo<SelectVirtualEntry<T>[]>(() =>
    state.view().flatMap((entry, index) => {
      const row = (item: T): SelectVirtualEntry<T> => ({
        type: 'item',
        key: itemKey(item.value),
        item,
        disabled: state.itemDisabled(item),
      })
      if (!isGroup(entry)) {
        return [row(entry)]
      }
      const rows: SelectVirtualEntry<T>[] = [
        {
          type: 'label',
          key: `group-${index}`,
          label: entry.label,
          itemKeys: entry.items.map((item) => itemKey(item.value)),
        },
      ]
      for (const item of entry.items) {
        rows.push(row(item))
      }
      return rows
    }),
  )
  const positions = createMemo(
    () => new Map(state.visibleItems().map((item, index) => [itemKey(item.value), index + 1])),
  )
  createEffect(
    on(
      [state.highlight, state.open, state.listbox, entries, () => props.virtualRender],
      ([key, open, listbox, rows, virtual]) => {
        if (!key || !open || !listbox) {
          return
        }
        const index = rows.findIndex((row) => row.type === 'item' && row.key === key)
        const row = rows[index]
        if (virtual && row?.type === 'item' && props.scrollToItem) {
          props.scrollToItem(row.item, index)
        }
      },
    ),
  )
  let atBottom = false
  function renderItem(item: T, rowProps?: ListT.RowProps<HTMLDivElement>) {
    const presentation: BaseSelectT.ItemState<T> = {
      get item() {
        return item
      },
      get selected() {
        return state.selectedKeys().has(itemKey(item.value))
      },
      get highlighted() {
        return state.highlight() === itemKey(item.value)
      },
      get disabled() {
        return state.itemDisabled(item)
      },
    }
    const attributes = createMemo(() => props.itemProps?.(presentation))
    return (
      <BaseSelect.Item
        {...attributes()}
        {...rowProps}
        item={item}
        ref={(element) => {
          callRef(attributes()?.ref, element)
          rowProps?.ref?.(element)
        }}
        class={cn(attributes()?.class, rowProps?.class)}
        style={{
          ...attributes()?.style,
          ...rowProps?.style,
        }}
        onClick={(event) => {
          callHandler(event, attributes()?.onClick)
          callHandler(event, rowProps?.onClick)
        }}
        onPointerMove={(event) => {
          callHandler(event, attributes()?.onPointerMove)
          callHandler(event, rowProps?.onPointerMove)
        }}
        onPointerDown={(event) => {
          callHandler(event, attributes()?.onPointerDown)
          callHandler(event, rowProps?.onPointerDown)
        }}
        aria-posinset={props.virtualRender ? positions().get(itemKey(item.value)) : undefined}
        aria-setsize={props.virtualRender ? state.visibleItems().length : undefined}
      >
        {(itemState) => (
          <Show
            when={props.itemRender !== undefined}
            fallback={
              <>
                <Show when={item.icon}>
                  {(icon) => (
                    <Icon name={icon()} slotName="itemLeading" {...props.slot('itemLeading')} />
                  )}
                </Show>
                <span data-slot="itemLabel" {...props.slot('itemLabel')}>
                  {item.label}
                  <Show when={item.description}>
                    {(description) => (
                      <span data-slot="itemDescription" {...props.slot('itemDescription')}>
                        {description()}
                      </span>
                    )}
                  </Show>
                </span>
                <Show when={itemState.selected}>
                  <span data-slot="itemTrailing" {...props.slot('itemTrailing')}>
                    <Icon name="icon-check" />
                  </span>
                </Show>
              </>
            }
          >
            {renderComponentOrElement(props.itemRender, itemState)}
          </Show>
        )}
      </BaseSelect.Item>
    )
  }
  function renderVirtual(
    entry: SelectVirtualEntry<T>,
    _index: number,
    rowProps?: ListT.RowProps<HTMLDivElement>,
  ) {
    if (entry.type === 'item') {
      return renderItem(entry.item, rowProps)
    }
    return (
      <BaseSelect.Group
        {...rowProps}
        aria-owns={entry.itemKeys
          .map((key) => `${state.listboxId()}-${encodeURIComponent(key)}`)
          .join(' ')}
      >
        <BaseSelect.GroupLabel>{entry.label}</BaseSelect.GroupLabel>
      </BaseSelect.Group>
    )
  }
  return (
    <BaseSelect.Content gutter={props.gutter} overflowPadding={props.overflowPadding}>
      <BaseSelect.Listbox
        {...props.listboxProps}
        onScroll={(event) => {
          callHandler(event, props.listboxProps?.onScroll)
          if (event.defaultPrevented) {
            return
          }
          const target = event.currentTarget
          const bottom =
            target.scrollTop + target.clientHeight >=
            target.scrollHeight - (props.scrollBottomThreshold ?? 20)
          if (bottom && !atBottom) {
            props.onScrollBottom?.()
          }
          atBottom = bottom
        }}
      >
        <Show
          when={props.virtualRender}
          fallback={
            <For each={state.view()}>
              {(entry) => {
                if (!isGroup(entry)) {
                  return renderItem(entry)
                }
                return (
                  <BaseSelect.Group>
                    <BaseSelect.GroupLabel>{entry.label}</BaseSelect.GroupLabel>
                    <For each={entry.items}>{(item) => renderItem(item)}</For>
                  </BaseSelect.Group>
                )
              }}
            </For>
          }
        >
          {(renderer) => (
            <Dynamic
              component={renderer()}
              entries={entries()}
              scrollElement={state.listbox()}
              render={renderVirtual}
            />
          )}
        </Show>
      </BaseSelect.Listbox>
      <BaseSelect.Empty>{props.empty}</BaseSelect.Empty>
    </BaseSelect.Content>
  )
}
