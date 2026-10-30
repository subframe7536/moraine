import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider/index'
import { useMessages } from '../../provider/locale/locale-context'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'
import { BaseSelect, BaseSelectRoot } from '../base-select/base-select'
import { useSelectContext } from '../base-select/base-select-context'
import { createBaseSelectSearchInput } from '../base-select/base-select-search-input'
import { useFieldContext } from '../field/field-context'
import { Icon } from '../icon/index'
import {
  createSource,
  normalizeSelectEntries,
  labelString,
  serializeSourceValue,
  singleValueToSelection,
} from '../shared/form/select/collection'
import { DefaultSelectContent } from '../shared/form/select/default-content'
import {
  COMBOBOX_LOCAL_PROP_KEYS,
  createBaseSelectStyleProps,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
} from '../shared/form/select/props'
import { useComboboxSearch } from '../shared/form/select/search'
import { SELECT_LOADING_ICON_CLASS } from '../shared/form/select/select-field.recipe'

import { defaultComboboxMessages } from './combobox.messages'
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
  const messages = useMessages('combobox', defaultComboboxMessages, () => local.translations)
  const { slots, variants } = useRecipe(comboboxRecipe, props, {
    slot: 'control',
    contextVariants: () => ({ size: field?.size }),
  })
  const baseSelectStyles = createBaseSelectStyleProps(slots)
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
  const selection = createMemo(() =>
    'value' in props ? (local.value === undefined ? [] : [local.value]) : undefined,
  )
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
      if (input.isComposing() || event.isComposing) {
        return
      }
      if (state.locked()) {
        input.inputProps.onKeyDown(event)
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
          {...slots.control}
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
            {(icon) => <Icon name={icon()} data-slot="combobox-leading" {...slots.leading} />}
          </Show>
          <input
            {...input.inputProps}
            {...state.field.ariaAttrs()}
            data-slot="combobox-input"
            {...slots.input}
            placeholder={(local.placeholder ?? messages().placeholder) || undefined}
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
              aria-label={messages().clear}
              tabIndex={0}
              {...slots.clear}
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
            aria-label={local.loading ? messages().loading : messages().toggle}
            aria-controls={state.listboxId()}
            aria-expanded={state.open() ? 'true' : 'false'}
            aria-busy={local.loading ? 'true' : undefined}
            {...comboboxDataAttributes.trigger({ loading: () => local.loading })}
            disabled={state.field.disabled() || Boolean(local.loading)}
            {...slots.trigger}
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
          slot={(slot) => slots[slot]}
          emptyRender={() => (
            <Show when={local.emptyRender !== undefined} fallback={messages().empty}>
              {renderWithProps(local.emptyRender, {
                get inputValue() {
                  return search.value()
                },
                get hasMatches() {
                  return state.items().length > 0
                },
                get selectedValue() {
                  return state.value()[0]
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
      onExitComplete={() => search.setValue('')}
      items={search.view().items}
      getItemByValue={(value) => source().byValue.get(value)}
      serializeValue={(value) => serializeSourceValue(source(), value)}
      value={selection()}
      defaultValue={defaultSelection()}
      onValueChange={(values) => local.onValueChange?.(values[0])}
      onReset={() => {
        search.setValue('')
        local.onReset?.()
      }}
      multiple={false}
      size={variants.size ?? undefined}
      classes={baseSelectStyles.classes()}
      styles={baseSelectStyles.styles()}
    >
      <Control />
    </BaseSelectRoot>
  )
}
