import type { Component, JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  mergeProps,
  Show,
  Switch,
  on,
} from 'solid-js'

import { useCn } from '../../../../provider/cn-context'
import { renderWithProps } from '../../../../shared/render-with-props'
import { callHandler, callRef } from '../../../../shared/utils'
import type { DataAttributeBag } from '../../../../theme/style-contract'
import type { SlotBinding } from '../../../../theme/use-recipe'
import { VirtualContent } from '../../../../virtualizer/virtual-content'
import type { VirtualRowProps } from '../../../../virtualizer/virtualizer.types'
import { BaseSelect } from '../../../base-select/base-select'
import { useSelectContext } from '../../../base-select/base-select-context'
import type { BaseSelectT } from '../../../base-select/base-select.types'
import { Icon } from '../../../icon/index'

import { sameValue } from './collection'
import { selectItemDataAttributes } from './select-field.recipe'
import type { ContentProps, SelectItem, SelectRow, SelectView } from './types'

export interface SelectEmptyRenderProps<T extends SelectItem = SelectItem> {
  /** Currently selected value. */
  selectedValue: T['value'] | undefined
  /** Close the select popup. */
  close: () => void
}

export interface DefaultSelectContentProps<T extends SelectItem> extends ContentProps<T> {
  view: SelectView<T>
  onExitComplete?: () => void
  emptyRender?: JSX.Element | Component<SelectEmptyRenderProps<T>>
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
      [state.highlightedValue, state.open, listbox, () => props.view.rows, () => props.virtualizer],
      ([key, open, listbox, rows, virtualizer]) => {
        // Rows outside the virtual window have no element to scroll into view.
        if (key === undefined || !open || !listbox || !virtualizer) {
          return
        }
        const index = rows.findIndex((row) => row.type === 'item' && sameValue(row.item.value, key))
        if (index >= 0) {
          virtualizer.scrollToIndex(index)
        }
      },
    ),
  )
  let atBottom = false
  // The item bindings come from the owning select; per-item `data-*` state is added here.
  function slotWithData(name: 'itemDescription', options: { data: DataAttributeBag }): SlotBinding {
    const binding = mergeProps(
      {
        get class() {
          return props.slot(name).class
        },
        get style() {
          return props.slot(name).style
        },
      },
      options.data,
    )
    return binding
  }
  function SelectItem(itemProps: { item: T; rowProps?: VirtualRowProps }) {
    const item = () => props.view.byValue?.get(itemProps.item.value) ?? itemProps.item
    const presentation: BaseSelectT.ItemRenderProps<T> = {
      get item() {
        return item()
      },
      get selected() {
        return state.isSelected(item().value)
      },
      get highlighted() {
        return state.isHighlighted(item().value)
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
        aria-posinset={props.virtualizer ? positions().get(item().value) : undefined}
        aria-setsize={props.virtualizer ? props.view.items.length : undefined}
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
                      data-slot={state.slotName('itemLeading')}
                      {...props.slot('itemLeading')}
                    />
                  )}
                </Show>
                <span data-slot={state.slotName('itemWrapper')} {...props.slot('itemWrapper')}>
                  <span data-slot={state.slotName('itemLabel')} {...props.slot('itemLabel')}>
                    {item().label}
                  </span>
                  <Show when={item().description}>
                    {(description) => {
                      const itemDescriptionSlot = slotWithData('itemDescription', {
                        data: selectItemDataAttributes.itemDescription({
                          highlighted: () => itemState.highlighted,
                        }),
                      })
                      return (
                        <span
                          data-slot={state.slotName('itemDescription')}
                          {...itemDescriptionSlot}
                        >
                          {description()}
                        </span>
                      )
                    }}
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
            {(render) => renderWithProps(render, presentation)}
          </Show>
        )}
      </BaseSelect.Item>
    )
  }
  function Row(rowProps: { entry: SelectRow<T>; props?: VirtualRowProps }): JSX.Element {
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
        <VirtualContent<SelectRow<T>>
          virtualizer={props.virtualizer}
          entries={props.view.rows}
          scrollElement={listbox()}
          render={(entry, _index, rowProps) => <Row entry={entry} props={rowProps} />}
          fallback={<For each={props.view.rows}>{(row) => <Row entry={row} />}</For>}
        />
      </BaseSelect.Listbox>
      <Show when={props.emptyRender} keyed>
        {(empty) => (
          <BaseSelect.Empty>
            {renderWithProps(empty, {
              get selectedValue() {
                const current = state.value()
                return current[0]
              },
              close: () => state.setOpen(false),
            })}
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
    <BaseSelect.Content>
      <DefaultSelectContentBody {...props} />
    </BaseSelect.Content>
  )
}
