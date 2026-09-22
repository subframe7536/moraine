import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createStyles } from '../../provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef } from '../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../base-select/base-select.tsx'
import { useBaseSelectSearchInput } from '../base-select/utils.ts'
import { useFieldContext } from '../field/field-context.ts'
import {
  createSource,
  normalizeSelectEntries,
  labelString,
  serializeSourceValue,
  singleValueToSelection,
} from '../shared/select/collection.ts'
import { DefaultSelectContent } from '../shared/select/default-content.tsx'
import {
  COMBOBOX_LOCAL_PROP_KEYS,
  createBaseSelectStyleProps,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
} from '../shared/select/props.ts'
import { useComboboxSearch } from '../shared/select/search.ts'
import { SELECT_LOADING_ICON_CLASS } from '../shared/select/select-field.class.ts'

import { comboboxDataAttributes, comboboxRecipe } from './combobox.recipe'
import type { ComboboxProps, ComboboxT } from './combobox.types.ts'
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
  const baseSelectStyles = createBaseSelectStyleProps((slot) => styles.styles[slot])
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
    const state = useSelectState<ComboboxT.NormalizedItem<T>>()
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
            {(icon) => <Icon name={icon()} slotName="leading" {...styles.styles.leading} />}
          </Show>
          <input
            {...input.binding}
            {...state.field.ariaAttrs()}
            data-slot="input"
            {...styles.styles.input}
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
            data-slot="trigger"
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
          onExitComplete={() => search.setQuery('')}
          slot={(slot) => styles.styles[slot]}
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
    <BaseSelect<ComboboxT.NormalizedItem<T>>
      {...baseSelectProps}
      items={search.view().items}
      getItemByValue={(value) => source().byValue.get(value)}
      serializeValue={(value) => serializeSourceValue(source(), value)}
      value={selection()}
      defaultValue={defaultSelection()}
      onChange={(values) => local.onChange?.(values[0] ?? null)}
      onReset={() => {
        search.setQuery('')
        local.onReset?.()
      }}
      multiple={false}
      size={styles.variants.size ?? undefined}
      classes={baseSelectStyles.classes()}
      styles={baseSelectStyles.styles()}
    >
      <Control />
    </BaseSelect>
  )
}
