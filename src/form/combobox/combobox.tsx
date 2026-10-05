import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { Icon } from '../../element/icon/index'
import { createStyles } from '../../provider/index'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'
import { BaseSelect, BaseSelectRoot, useSelectContext } from '../base-select/base-select'
import { createBaseSelectSearchInput } from '../base-select/base-select-search-input'
import { useFieldContext } from '../field/field-context'
import {
  createSource,
  normalizeSelectEntries,
  labelString,
  serializeSourceValue,
  singleValueToSelection,
} from '../shared/select/collection'
import { DefaultSelectContent } from '../shared/select/default-content'
import {
  COMBOBOX_LOCAL_PROP_KEYS,
  createBaseSelectStyleProps,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
} from '../shared/select/props'
import { useComboboxSearch } from '../shared/select/search'
import { SELECT_LOADING_ICON_CLASS } from '../shared/select/select-field.class'

import { comboboxDataAttributes, comboboxRecipe } from './combobox.recipe'
import type { ComboboxProps, ComboboxT } from './combobox.types'
/** Single collection selection with an editable query input. */
export function Combobox<T extends string | ComboboxT.Item = string | ComboboxT.Item>(
  props: ComboboxProps<T>,
): JSX.Element {
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    COMBOBOX_LOCAL_PROP_KEYS,
    SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const field = useFieldContext()
  const styles = createStyles(comboboxRecipe, props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: field?.size }),
  })
  const baseSelectStyles = createBaseSelectStyleProps(styles.styles)
  const source = createMemo(
    (prev: ReturnType<typeof createSource<ComboboxT.NormalizedItem<T>>> | undefined) =>
      createSource(normalizeSelectEntries<T>(local.items ?? []), undefined, prev),
  )
  const search = useComboboxSearch(
    local,
    () => true,
    () => source(),
    () => baseSelectProps.itemToLabelString,
  )
  const selection = createMemo(() => singleValueToSelection(local.value))
  const defaultSelection = () => singleValueToSelection(local.defaultValue)

  function Control(): JSX.Element {
    const state = useSelectContext<ComboboxT.NormalizedItem<T>>()
    const selectedItem = () => source().byValue.get(state.value()[0]!)
    const selectedLabel = () => {
      const item = selectedItem()
      return item
        ? labelString(item, baseSelectProps.itemToLabelString)
        : state.value().length
          ? String(state.value()[0])
          : ''
    }
    const input = createBaseSelectSearchInput({
      state: state.context,
      searchValue: search.value,
      setSearchValue: search.setValue,
      get maxLength() {
        return local.searchMaxLength
      },
      get autocomplete() {
        return local.autocomplete
      },
      displayValue: () => (state.open() ? search.value() : selectedLabel()),
    })
    const canClear = () => state.value().length > 0 || Boolean(search.value())
    function focusInput(): void {
      state.focusOwner()?.focus()
    }
    function clear(): void {
      if (state.locked()) {
        return
      }
      input.discardComposition()
      state.change([])
      search.setValue('')
      local.onClear?.()
      focusInput()
    }
    function onInputKeyDown(event: KeyboardEvent): void {
      if (input.isComposing() || event.isComposing || state.locked()) {
        return
      }
      if (local.allowClear && canClear()) {
        if (event.key === 'Escape' && !state.open()) {
          event.preventDefault()
          clear()
          return
        }
        if ((event.key === 'Delete' || event.key === 'Backspace') && !search.value()) {
          event.preventDefault()
          clear()
          return
        }
      }
      input.inputProps.onKeyDown(event)
    }

    return (
      <>
        <BaseSelect.Control
          {...rootProps}
          {...styles.styles.control}
          {...comboboxDataAttributes.control({
            closed: undefined,
            disabled: undefined,
            editable: true,
            expanded: undefined,
            invalid: undefined,
            readonly: undefined,
            required: undefined,
          })}
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
            {(icon) => (
              <Icon name={icon()} slotName="combobox-leading" {...styles.styles.leading} />
            )}
          </Show>
          <input
            {...input.inputProps}
            {...state.field.ariaAttrs()}
            data-slot="combobox-input"
            {...styles.styles.input}
            placeholder={local.placeholder}
            ref={(element) => {
              input.inputProps.ref(element)
              callRef(local.inputRef, element)
            }}
            onKeyDown={onInputKeyDown}
          />
          <Show when={local.allowClear && canClear()}>
            <button
              type="button"
              data-slot="combobox-clear"
              aria-label="Clear selection"
              tabIndex={0}
              {...styles.styles.clear}
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
            data-slot="combobox-trigger"
            aria-label={local.loading ? 'Loading' : 'Toggle options'}
            aria-controls={state.listboxId()}
            aria-expanded={state.open() ? 'true' : 'false'}
            aria-busy={local.loading ? 'true' : undefined}
            {...comboboxDataAttributes.trigger({ loading: () => local.loading })}
            disabled={state.field.disabled() || Boolean(local.loading)}
            {...styles.styles.trigger}
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
              {...comboboxDataAttributes.trigger({ loading: () => local.loading })}
              class={SELECT_LOADING_ICON_CLASS}
            />
          </button>
        </BaseSelect.Control>
        <DefaultSelectContent
          {...local}
          view={search.view()}
          onExitComplete={() => search.setValue('')}
          slot={(slot) => styles.styles[slot]}
          emptyRender={() => (
            <Show when={local.emptyRender !== undefined} fallback="No items">
              {renderWithProps(local.emptyRender, {
                get inputValue() {
                  return search.value()
                },
                get hasMatches() {
                  return state.items().length > 0
                },
                get selectedValue() {
                  return state.value()[0] ?? null
                },
                close: () => state.setOpen(false),
              })}
            </Show>
          )}
        />
      </>
    )
  }

  return (
    <BaseSelectRoot<ComboboxT.NormalizedItem<T>>
      slotOwner="combobox"
      {...baseSelectProps}
      items={search.view().items}
      getItemByValue={(value) => source().byValue.get(value)}
      serializeValue={(value) => serializeSourceValue(source(), value)}
      value={selection()}
      defaultValue={defaultSelection()}
      onValueChange={(values) => local.onValueChange?.(values[0] ?? null)}
      onReset={() => {
        search.setValue('')
        local.onReset?.()
      }}
      multiple={false}
      size={styles.variants.size ?? undefined}
      classes={baseSelectStyles.classes()}
      styles={baseSelectStyles.styles()}
    >
      <Control />
    </BaseSelectRoot>
  )
}
