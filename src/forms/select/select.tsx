import type { JSX } from 'solid-js'
import { splitProps, createMemo, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef } from '../../shared/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'

import { BaseSelect, useSelectState } from './base-select.tsx'
import type { SelectProps, SelectT } from './select.types.ts'
import { createSource, labelString } from './shared/collection.ts'
import { DefaultSelectContent } from './shared/default-content.tsx'
import {
  BASE_SELECT_FORWARD_PROP_KEYS,
  BASE_SELECT_SHARED_SLOTS,
  SELECT_LOCAL_PROP_KEYS,
} from './shared/props.ts'
import { useSelectSearch } from './shared/search.ts'
import { useBaseSelectSearchInput } from './utils.ts'

/** Single selection with optional search and standard item presentation. */
export function Select<T extends SelectT.Item = SelectT.Item>(props: SelectProps<T>): JSX.Element {
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    SELECT_LOCAL_PROP_KEYS,
    BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const leadingIcon = () => local.leadingIcon
  const loadingIcon = () => local.loadingIcon ?? 'icon-loading'
  const trailingIcon = () => local.trailingIcon ?? 'icon-chevron-down'
  const closeIcon = () => local.closeIcon ?? 'icon-close'
  const field = useFormFieldContext()
  const styles = createComponentStyles('select', props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: field?.size }),
  })
  const sharedClasses = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).class])),
  )
  const sharedStyles = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).style])),
  )
  const searchable = () => Boolean(styles.variants.search)

  const source = createMemo(() => createSource(local.items ?? []))
  const search = useSelectSearch(
    local,
    searchable,
    () => source(),
    () => baseSelectProps.itemToLabelString,
  )
  const selection = createMemo(() =>
    local.value === undefined ? undefined : local.value === null ? [] : [local.value],
  )
  const defaultSelection = () =>
    local.defaultValue === undefined || local.defaultValue === null ? [] : [local.defaultValue]
  function Control(): JSX.Element {
    const state = useSelectState<T>()
    const selectedItem = () => source().byValue.get(state.value()[0]!)
    const selectedLabel = () => {
      const item = selectedItem()
      return item
        ? labelString(item, baseSelectProps.itemToLabelString)
        : state.value().length
          ? String(state.value()[0])
          : ''
    }
    const input = useBaseSelectSearchInput(state, local, searchable, search, () =>
      state.open() ? search.query() : selectedLabel(),
    )
    const hasValue = () => state.value().length > 0

    const clear = () => {
      if (state.locked()) {
        return
      }
      input.discardComposition()
      state.change([])
      search.setQuery('')
      local.onClear?.()
    }
    return (
      <>
        <Dynamic
          component={searchable() ? 'div' : BaseSelect.Trigger}
          as={searchable() ? undefined : 'div'}
          {...rootProps}
          data-slot="trigger"
          {...styles.slot('control')}
          data-disabled={state.field.disabled() ? '' : undefined}
          data-readonly={state.field.readOnly() ? '' : undefined}
          data-required={state.field.required() ? '' : undefined}
          data-invalid={state.field.invalid() ? '' : undefined}
          ref={(element: HTMLDivElement) => {
            state.setAnchor(element)
            callRef(local.ref, element)
          }}
          onPointerDown={(event: PointerEvent) => {
            callHandler(event, rootProps.onPointerDown)
            if (
              !event.defaultPrevented &&
              !(event.target instanceof HTMLInputElement) &&
              event.pointerType !== 'touch' &&
              event.pointerType !== 'pen'
            ) {
              event.preventDefault()
              state.control()?.focus()
            }
          }}
          onClick={(event: MouseEvent) => {
            callHandler(event, rootProps.onClick)
            if (!event.defaultPrevented && searchable()) {
              state.control()?.focus()
              state.setOpen(event.target instanceof HTMLInputElement ? true : !state.open())
            }
          }}
        >
          <Show when={leadingIcon()}>
            {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
          </Show>
          <Show
            when={searchable()}
            fallback={
              <span
                data-slot="input"
                data-placeholder={!hasValue() ? '' : undefined}
                {...styles.slot('input')}
              >
                {selectedItem()?.label ??
                  (hasValue() ? String(state.value()[0]) : local.placeholder)}
              </span>
            }
          >
            <input
              {...input.binding}
              {...state.field.ariaAttrs()}
              data-slot="input"
              {...styles.slot('input')}
              placeholder={local.placeholder}
              ref={(element) => {
                input.binding.ref(element)
                callRef(local.inputRef, element)
              }}
            />
          </Show>
          <Show
            when={!local.loading && local.allowClear && hasValue()}
            fallback={
              <Icon
                name={local.loading ? loadingIcon() : trailingIcon()}
                slotName="indicator"
                data-loading={local.loading ? '' : undefined}
                {...styles.slot('trigger')}
              />
            }
          >
            <button
              type="button"
              data-slot="clear"
              aria-label="Clear selection"
              tabIndex={-1}
              {...styles.slot('clear')}
              disabled={state.locked()}
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                state.control()?.focus()
              }}
              onClick={(event) => {
                event.stopPropagation()
                clear()
              }}
            >
              <Icon name={closeIcon()} />
            </button>
          </Show>
        </Dynamic>
        <DefaultSelectContent
          view={search.view()}
          onExitComplete={() => search.setQuery('')}
          itemRender={local.itemRender}
          itemProps={local.itemProps}
          listboxProps={local.listboxProps}
          virtualRender={local.virtualRender}
          scrollToItem={local.scrollToItem}
          onScrollBottom={local.onScrollBottom}
          scrollBottomThreshold={local.scrollBottomThreshold}
          gutter={local.gutter}
          overflowPadding={local.overflowPadding}
          slot={styles.slot}
          renderEmpty={() =>
            local.emptyRender !== undefined
              ? renderComponentOrElement(local.emptyRender, {
                  get inputValue() {
                    return search.query()
                  },
                  get hasMatches() {
                    return state.items().length > 0
                  },
                  get selectedValue() {
                    return state.value()[0] ?? null
                  },
                  close: () => state.setOpen(false),
                })
              : 'No items'
          }
        />
      </>
    )
  }
  return (
    <BaseSelect<T>
      {...baseSelectProps}
      items={search.view().items}
      serializeValue={(value) =>
        source().byValue.get(value)?.disabled ? undefined : String(value)
      }
      value={selection()}
      defaultValue={defaultSelection()}
      onChange={(values) => local.onChange?.(values[0] ?? null)}
      onReset={() => {
        search.setQuery('')
        local.onReset?.()
      }}
      multiple={false}
      size={styles.variants.size ?? undefined}
      classes={sharedClasses()}
      styles={sharedStyles()}
    >
      <Control />
    </BaseSelect>
  )
}
