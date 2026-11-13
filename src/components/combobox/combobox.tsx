import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { useRecipe } from '../../provider/index'
import { useMessages } from '../../provider/locale/locale-context'
import { createKeyDownHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef } from '../../shared/utils'
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
import { ClearButton, ToggleTrigger, useControlPress } from '../shared/form/select/control-action'
import { DefaultSelectContent } from '../shared/form/select/default-content'
import {
  COMBOBOX_LOCAL_PROP_KEYS,
  createBaseSelectStyleProps,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
} from '../shared/form/select/props'
import { useComboboxSearch } from '../shared/form/select/search'

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
  const {
    slots,
    slots: {
      control: controlSlot,
      leading: leadingSlot,
      input: inputSlot,
      clear: clearSlot,
      trigger: triggerSlot,
    },
    variants,
  } = useRecipe(comboboxRecipe, props, {
    slot: 'control',
    data: {
      control: comboboxDataAttributes.control({
        closed: undefined,
        disabled: undefined,
        editable: true,
        expanded: undefined,
        invalid: undefined,
        readonly: undefined,
        required: undefined,
      }),
      trigger: comboboxDataAttributes.trigger({ loading: () => local.loading }),
    },
    context: () => ({ variants: { size: field?.size } }),
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
    const dispatchInputKeyDown = createKeyDownHandler<HTMLInputElement>({
      keys: {
        Escape: {
          when: () => Boolean(local.allowClear) && canClear() && !state.open(),
          handle: clear,
        },
        Delete: {
          when: () => Boolean(local.allowClear) && canClear() && !search.value(),
          handle: clear,
        },
        Backspace: {
          when: () => Boolean(local.allowClear) && canClear() && !search.value(),
          handle: clear,
        },
      },
      onUnhandled: (event) => input.inputProps.onKeyDown(event),
    })

    function onInputKeyDown(event: KeyboardEvent): void {
      if (input.isComposing() || event.isComposing) {
        return
      }
      if (state.locked()) {
        input.inputProps.onKeyDown(event)
        return
      }
      dispatchInputKeyDown(event)
    }

    const controlPress = useControlPress({
      focusOwner: state.focusOwner,
      focus: focusInput,
      openOnControlClick: () => local.openOnControlClick ?? false,
      setOpen: state.setOpen,
      onPointerDown: rootProps.onPointerDown,
      onClick: rootProps.onClick,
    })

    return (
      <>
        <BaseSelect.Control
          {...controlSlot}
          {...rootProps}
          {...controlPress}
          ref={(element) => callRef(local.ref, element)}
        >
          <Show when={local.leadingIcon}>
            {(icon) => <Icon name={icon()} data-slot="combobox-leading" {...leadingSlot} />}
          </Show>
          <input
            {...input.inputProps}
            {...state.field.ariaAttrs()}
            data-slot="combobox-input"
            {...inputSlot}
            placeholder={(local.placeholder ?? messages().placeholder) || undefined}
            ref={(element) => {
              input.inputProps.ref(element)
              callRef(local.inputRef, element)
            }}
            onKeyDown={onInputKeyDown}
          />
          <Show when={local.allowClear && canClear()}>
            <ClearButton
              dataSlot="combobox-clear"
              ariaLabel={messages().clear}
              slot={clearSlot}
              disabled={state.locked()}
              closeIcon={local.closeIcon}
              onFocusOwner={focusInput}
              onClear={clear}
            />
          </Show>
          <ToggleTrigger
            dataSlot="combobox-trigger"
            ariaLabel={local.loading ? messages().loading : messages().toggle}
            ariaControls={state.listboxId()}
            expanded={state.open()}
            loading={local.loading}
            loadingIcon={local.loadingIcon}
            slot={triggerSlot}
            trailingIcon={local.trailingIcon}
            disabled={state.field.disabled()}
            onFocusOwner={focusInput}
            onClick={() => state.setOpen(!state.open())}
          />
        </BaseSelect.Control>
        <DefaultSelectContent
          {...local}
          view={search.view()}
          slot={(slot) => slots[slot]}
          emptyRender={(emptyProps) => (
            <Show when={local.emptyRender !== undefined} fallback={messages().empty}>
              {renderWithProps(local.emptyRender, {
                get inputValue() {
                  return search.value()
                },
                get hasMatches() {
                  return state.items().length > 0
                },
                get selectedValue() {
                  return emptyProps.selectedValue
                },
                close: emptyProps.close,
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
