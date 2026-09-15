import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef } from '../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../base-select/base-select.tsx'
import { useBaseSelectSearchInput } from '../base-select/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'
import { createSource, labelString } from '../shared/select/collection.ts'
import { DefaultSelectContent } from '../shared/select/default-content.tsx'
import {
  BASE_SELECT_FORWARD_PROP_KEYS,
  BASE_SELECT_SHARED_SLOTS,
  COMBOBOX_LOCAL_PROP_KEYS,
} from '../shared/select/props.ts'
import { useComboboxSearch } from '../shared/select/search.ts'

import type { ComboboxProps, ComboboxT } from './combobox.types.ts'

/** Single collection selection with an editable query input. */
export function Combobox<T extends ComboboxT.Item = ComboboxT.Item>(
  props: ComboboxProps<T>,
): JSX.Element {
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    COMBOBOX_LOCAL_PROP_KEYS,
    BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const field = useFormFieldContext()
  const styles = createComponentStyles('combobox', props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: field?.size }),
  })
  const sharedClasses = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).class])),
  )
  const sharedStyles = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).style])),
  )
  const source = createMemo(() => createSource(local.items ?? []))
  const search = useComboboxSearch(
    local,
    () => true,
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
    const input = useBaseSelectSearchInput(
      state,
      local,
      () => true,
      search,
      () => (state.open() ? search.query() : selectedLabel()),
    )
    const canClear = () => state.value().length > 0 || Boolean(search.query())
    function focusInput(): void {
      state.focusOwner()?.focus()
    }
    function clear(): void {
      if (state.locked()) {
        return
      }
      input.discardComposition()
      state.change([])
      search.setQuery('')
      local.onClear?.()
      focusInput()
    }
    return (
      <>
        <BaseSelect.Control
          {...rootProps}
          {...styles.slot('control')}
          data-editable=""
          data-disabled={state.field.disabled() ? '' : undefined}
          data-readonly={state.field.readOnly() ? '' : undefined}
          data-required={state.field.required() ? '' : undefined}
          data-invalid={state.field.invalid() ? '' : undefined}
          ref={(element) => callRef(local.ref, element)}
          onPointerDown={(event) => {
            callHandler(event, rootProps.onPointerDown)
            if (
              !event.defaultPrevented &&
              event.target !== state.focusOwner() &&
              event.pointerType !== 'touch' &&
              event.pointerType !== 'pen'
            ) {
              event.preventDefault()
              focusInput()
            }
          }}
          onClick={(event) => {
            callHandler(event, rootProps.onClick)
            if (!event.defaultPrevented && (local.openOnControlClick ?? false)) {
              focusInput()
              state.setOpen(true)
            }
          }}
        >
          <Show when={local.leadingIcon}>
            {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
          </Show>
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
          <Show when={local.allowClear && canClear()}>
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
                focusInput()
              }}
              onClick={(event) => {
                event.stopPropagation()
                clear()
              }}
            >
              <Icon name={local.closeIcon ?? 'icon-close'} />
            </button>
          </Show>
          <button
            type="button"
            tabIndex={-1}
            data-slot="trigger"
            aria-label={local.loading ? 'Loading' : 'Toggle options'}
            aria-controls={state.listboxId()}
            aria-expanded={state.open() ? 'true' : 'false'}
            aria-busy={local.loading ? 'true' : undefined}
            data-loading={local.loading ? '' : undefined}
            disabled={state.field.disabled() || Boolean(local.loading)}
            {...styles.slot('trigger')}
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              focusInput()
            }}
            onClick={(event) => {
              event.stopPropagation()
              state.setOpen(!state.open())
            }}
          >
            <Icon
              name={
                local.loading
                  ? (local.loadingIcon ?? 'icon-loading')
                  : (local.trailingIcon ?? 'icon-chevron-down')
              }
              data-loading={local.loading ? '' : undefined}
              class="data-loading:animate-spin"
            />
          </button>
        </BaseSelect.Control>
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
