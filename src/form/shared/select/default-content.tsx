import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show, on } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../../element/icon/index.ts'
import type { ListT } from '../../../element/list/index.ts'
import { useCn } from '../../../provider/cn-context.ts'
import type { SlotBinding } from '../../../provider/create-styles.ts'
import { renderComponentOrElement } from '../../../shared/render-prop.ts'
import { callHandler, callRef } from '../../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../../base-select/base-select.tsx'
import type { BaseSelectT } from '../../base-select/base-select.types.ts'

import { sameValue } from './collection.ts'
import type { ContentProps, SelectItem, SelectRow, SelectView } from './types.ts'

export interface DefaultSelectContentProps<T extends SelectItem> extends ContentProps<T> {
  view: SelectView<T>
  onExitComplete?: () => void
  empty?: JSX.Element
  renderEmpty?: () => JSX.Element
  slot: (
    name: 'itemLeading' | 'itemWrapper' | 'itemLabel' | 'itemDescription' | 'itemIndicator',
  ) => SlotBinding
}

function DefaultSelectContentBody<T extends SelectItem>(
  props: DefaultSelectContentProps<T>,
): JSX.Element {
  const state = useSelectState<T>()
  const cn = useCn()
  const itemRender = createMemo(() => props.itemRender)
  const [listbox, setListbox] = createSignal<HTMLDivElement>()
  const positions = createMemo(
    () => new Map(props.view.items.map((item, index) => [item.value, index + 1])),
  )
  createEffect(
    on(
      [
        state.highlightedValue,
        state.open,
        listbox,
        () => props.view.rows,
        () => props.virtualRender,
      ],
      ([key, open, listbox, rows, virtual]) => {
        if (key === undefined || !open || !listbox) {
          return
        }
        const index = rows.findIndex((row) => row.type === 'item' && sameValue(row.item.value, key))
        const row = rows[index]
        if (virtual && row?.type === 'item' && props.scrollToItem) {
          props.scrollToItem(row.item, index)
        }
      },
    ),
  )
  let atBottom = false
  function renderItem(entryItem: T, rowProps?: ListT.RowProps<HTMLDivElement>) {
    const item = () => props.view.byValue?.get(entryItem.value) ?? entryItem
    const presentation: BaseSelectT.ItemRenderProps<T> = {
      get item() {
        return item()
      },
      get selected() {
        return state.value().includes(item().value)
      },
      get highlighted() {
        return sameValue(state.highlightedValue(), item().value)
      },
      get disabled() {
        return state.itemDisabled(item())
      },
    }
    const attributes = createMemo(() => props.itemProps?.(presentation))
    return (
      <BaseSelect.Item<T>
        item={item()}
        {...attributes()}
        {...rowProps}
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
        aria-posinset={props.virtualRender ? positions().get(item().value) : undefined}
        aria-setsize={props.virtualRender ? props.view.items.length : undefined}
      >
        {(itemState) => (
          <Show
            when={itemRender() !== undefined}
            fallback={
              <>
                <Show when={item().icon}>
                  {(icon) => (
                    <Icon
                      name={icon()}
                      slotName={state.slotName('itemLeading')}
                      {...props.slot('itemLeading')}
                    />
                  )}
                </Show>
                <span data-slot={state.slotName('itemWrapper')} {...props.slot('itemWrapper')}>
                  <span data-slot={state.slotName('itemLabel')} {...props.slot('itemLabel')}>
                    {item().label}
                  </span>
                  <Show when={item().description}>
                    {(description) => (
                      <span
                        data-slot={state.slotName('itemDescription')}
                        {...props.slot('itemDescription')}
                      >
                        {description()}
                      </span>
                    )}
                  </Show>
                </span>
                <Show when={itemState.selected}>
                  <span
                    data-slot={state.slotName('itemIndicator')}
                    {...props.slot('itemIndicator')}
                  >
                    <Icon name="icon-check" />
                  </span>
                </Show>
              </>
            }
          >
            {renderComponentOrElement(itemRender(), presentation)}
          </Show>
        )}
      </BaseSelect.Item>
    )
  }
  function renderRow(
    entry: SelectRow<T>,
    _index: number,
    rowProps?: ListT.RowProps<HTMLDivElement>,
  ) {
    if (entry.type === 'item') {
      return renderItem(entry.item, rowProps)
    }
    return (
      <BaseSelect.Group {...rowProps} aria-owns={entry.values.map(state.itemId).join(' ')}>
        <BaseSelect.GroupLabel>{entry.label}</BaseSelect.GroupLabel>
      </BaseSelect.Group>
    )
  }
  return (
    <>
      <BaseSelect.Listbox
        {...props.listboxProps}
        ref={(element) => {
          setListbox(element)
          callRef(props.listboxProps?.ref, element)
        }}
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
          fallback={<For each={props.view.rows}>{(row) => renderRow(row, 0)}</For>}
        >
          {(renderer) => (
            <Dynamic
              component={renderer()}
              entries={props.view.rows}
              scrollElement={listbox()}
              render={renderRow}
            />
          )}
        </Show>
      </BaseSelect.Listbox>
      <BaseSelect.Empty>{props.renderEmpty ? props.renderEmpty() : props.empty}</BaseSelect.Empty>
    </>
  )
}

export function DefaultSelectContent<T extends SelectItem>(
  props: DefaultSelectContentProps<T>,
): JSX.Element {
  return (
    <BaseSelect.Content
      onExitComplete={props.onExitComplete}
      gutter={props.gutter}
      overflowPadding={props.overflowPadding}
    >
      <DefaultSelectContentBody {...props} />
    </BaseSelect.Content>
  )
}
