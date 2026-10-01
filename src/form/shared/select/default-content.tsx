import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Match, Show, Switch, on } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../../element/icon/index'
import type { ListT } from '../../../element/list/index'
import { useCn } from '../../../provider/cn-context'
import type { SlotBinding } from '../../../provider/create-styles'
import { callHandler, callRef } from '../../../shared/utils'
import { BaseSelect, useSelectContext } from '../../base-select/base-select'
import type { BaseSelectT } from '../../base-select/base-select.types'

import { sameValue } from './collection'
import type { ContentProps, SelectItem, SelectRow, SelectView } from './types'

export interface DefaultSelectContentProps<T extends SelectItem> extends ContentProps<T> {
  view: SelectView<T>
  onExitComplete?: () => void
  emptyRender?: () => JSX.Element
  slot: (
    name: 'itemLeading' | 'itemWrapper' | 'itemLabel' | 'itemDescription' | 'itemIndicator',
  ) => SlotBinding
}

function DefaultSelectContentBody<T extends SelectItem>(
  props: DefaultSelectContentProps<T>,
): JSX.Element {
  const state = useSelectContext<T>()
  const cn = useCn()
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
  function SelectItem(itemProps: { item: T; rowProps?: ListT.RowProps<HTMLDivElement> }) {
    const item = () => props.view.byValue?.get(itemProps.item.value) ?? itemProps.item
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
        {...itemProps.rowProps}
        ref={(element) => {
          callRef(attributes()?.ref, element)
          itemProps.rowProps?.ref?.(element)
        }}
        class={cn(attributes()?.class, itemProps.rowProps?.class)}
        style={{
          ...attributes()?.style,
          ...itemProps.rowProps?.style,
        }}
        onClick={(event) => {
          callHandler(event, attributes()?.onClick)
          callHandler(event, itemProps.rowProps?.onClick)
        }}
        onPointerMove={(event) => {
          callHandler(event, attributes()?.onPointerMove)
          callHandler(event, itemProps.rowProps?.onPointerMove)
        }}
        onPointerDown={(event) => {
          callHandler(event, attributes()?.onPointerDown)
          callHandler(event, itemProps.rowProps?.onPointerDown)
        }}
        aria-posinset={props.virtualRender ? positions().get(item().value) : undefined}
        aria-setsize={props.virtualRender ? props.view.items.length : undefined}
      >
        {(itemState) => (
          <Show
            when={props.itemRender}
            keyed
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
            {(ItemRender) => <ItemRender {...presentation} />}
          </Show>
        )}
      </BaseSelect.Item>
    )
  }
  function Row(rowProps: {
    entry: SelectRow<T>
    props?: ListT.RowProps<HTMLDivElement>
  }): JSX.Element {
    return (
      <Switch>
        <Match when={rowProps.entry.type === 'item' && rowProps.entry.item}>
          {(item) => <SelectItem item={item()} rowProps={rowProps.props} />}
        </Match>
        <Match when={rowProps.entry.type === 'label' && rowProps.entry}>
          {(entry) => (
            <BaseSelect.Group
              {...rowProps.props}
              aria-owns={entry().values.map(state.itemId).join(' ')}
            >
              <BaseSelect.GroupLabel>{entry().label}</BaseSelect.GroupLabel>
            </BaseSelect.Group>
          )}
        </Match>
        <Match when={rowProps.entry.type === 'separator'}>
          <BaseSelect.Separator {...rowProps.props} />
        </Match>
      </Switch>
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
          fallback={<For each={props.view.rows}>{(row) => <Row entry={row} />}</For>}
        >
          {(renderer) => (
            <Dynamic
              component={renderer()}
              entries={props.view.rows}
              scrollElement={listbox()}
              render={(
                entry: SelectRow<T>,
                _index: number,
                rowProps?: ListT.RowProps<HTMLDivElement>,
              ) => <Row entry={entry} props={rowProps} />}
            />
          )}
        </Show>
      </BaseSelect.Listbox>
      <Show when={props.emptyRender} keyed>
        {(EmptyRender) => (
          <BaseSelect.Empty>
            <EmptyRender />
          </BaseSelect.Empty>
        )}
      </Show>
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
