import type { JSX } from 'solid-js'
import { splitProps, createMemo, Show } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callRef } from '../../shared/utils.ts'
import { useFormFieldContext } from '../form/form-context.ts'

import { BaseSelect, useSelectState } from './base-select.tsx'
import type { SelectProps, SelectT } from './select.types.ts'
import { DefaultSelectContent } from './shared/default-content.tsx'
import {
  BASE_SELECT_FORWARD_PROP_KEYS,
  BASE_SELECT_SHARED_SLOTS,
  isFormFieldInvalid,
} from './shared/props.ts'
import { useSelectSearch } from './shared/search.ts'

const SELECT_LOCAL_PROP_KEYS = [
  'classes',
  'styles',
  'class',
  'style',
  'size',
  'variant',
  'search',
  'searchValue',
  'defaultSearchValue',
  'onSearch',
  'searchMaxLength',
  'filterItem',
  'itemRender',
  'itemProps',
  'listboxProps',
  'virtualRender',
  'scrollToItem',
  'onScrollBottom',
  'scrollBottomThreshold',
  'gutter',
  'overflowPadding',
  'emptyRender',
  'placeholder',
  'allowClear',
  'onClear',
  'loading',
  'leadingIcon',
  'loadingIcon',
  'trailingIcon',
  'closeIcon',
  'ref',
  'inputRef',
] as const

/** Single selection with optional search and standard item presentation. */
export function Select<V extends SelectT.Value = SelectT.Value>(
  incoming: SelectProps<V>,
): JSX.Element {
  return <SelectContent incoming={incoming} />
}

function SelectContent<V extends SelectT.Value = SelectT.Value>(props: {
  incoming: SelectProps<V>
}): JSX.Element {
  // oxlint-disable-next-line subf/solid-reactivity -- The incoming props object has stable identity and preserves its getters.
  const incoming = props.incoming
  const [local, baseSelectProps, rootProps] = splitProps(
    incoming,
    SELECT_LOCAL_PROP_KEYS,
    BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const itemRender = createMemo(() => local.itemRender)
  const emptyRender = createMemo(() => local.emptyRender)
  const leadingIcon = createMemo(() => local.leadingIcon)
  const loadingIcon = createMemo(() => local.loadingIcon)
  const trailingIcon = createMemo(() => local.trailingIcon)
  const closeIcon = createMemo(() => local.closeIcon)
  const field = useFormFieldContext()
  const styles = createComponentStyles('select', incoming, {
    inheritedVariants: () => ({ size: field?.size }),
  })
  const sharedClasses = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).class])),
  )
  const sharedStyles = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).style])),
  )
  function Control(): JSX.Element {
    const state = useSelectState<SelectT.Item<V>>()
    const searchable = () => Boolean(styles.variants.search)
    const search = useSelectSearch(local, searchable)
    const hasValue = () => state.value() !== null
    const label = () =>
      state.selectedItems()[0]?.label ?? (hasValue() ? String(state.value()) : local.placeholder)
    const clear = () => {
      if (state.locked()) {
        return
      }
      state.change(null)
      search.setQuery('')
      local.onClear?.()
    }
    const actionLoading = createMemo(() => Boolean(local.loading))
    const contents = () => (
      <>
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
              {label()}
            </span>
          }
        >
          <input
            {...search.binding}
            {...state.field.ariaAttrs()}
            data-slot="input"
            {...styles.slot('input')}
            placeholder={local.placeholder}
            ref={(element) => {
              search.binding.ref(element)
              callRef(local.inputRef, element)
            }}
          />
        </Show>
        <Show
          when={!actionLoading() && local.allowClear && hasValue()}
          fallback={
            <Icon
              name={
                actionLoading()
                  ? (loadingIcon() ?? 'icon-loading')
                  : (trailingIcon() ?? 'icon-chevron-down')
              }
              slotName="trigger"
              data-loading={actionLoading() ? '' : undefined}
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
            <Icon name={closeIcon() ?? 'icon-close'} />
          </button>
        </Show>
      </>
    )
    return (
      <>
        <Show
          when={searchable()}
          fallback={
            <BaseSelect.Trigger
              as="div"
              data-slot="control"
              {...styles.slot('control')}
              data-disabled={state.field.disabled() ? '' : undefined}
              data-readonly={state.field.readOnly() ? '' : undefined}
              data-required={state.field.required() ? '' : undefined}
              data-invalid={state.field.invalid() ? '' : undefined}
            >
              {contents()}
            </BaseSelect.Trigger>
          }
        >
          <div
            data-slot="control"
            {...styles.slot('control')}
            data-disabled={state.field.disabled() ? '' : undefined}
            data-readonly={state.field.readOnly() ? '' : undefined}
            data-required={state.field.required() ? '' : undefined}
            data-invalid={state.field.invalid() ? '' : undefined}
            ref={state.setAnchor}
            onPointerDown={(event: PointerEvent) => {
              if (
                !(event.target instanceof HTMLInputElement) &&
                event.pointerType !== 'touch' &&
                event.pointerType !== 'pen'
              ) {
                event.preventDefault()
                state.control()?.focus()
              }
            }}
            onClick={(event: MouseEvent) => {
              if (event.target instanceof HTMLInputElement) {
                state.setOpen(true)
                return
              }
              state.setOpen(!state.open())
            }}
          >
            {contents()}
          </div>
        </Show>
        <DefaultSelectContent
          itemRender={itemRender()}
          itemProps={local.itemProps}
          listboxProps={local.listboxProps}
          virtualRender={local.virtualRender}
          scrollToItem={local.scrollToItem}
          onScrollBottom={local.onScrollBottom}
          scrollBottomThreshold={local.scrollBottomThreshold}
          gutter={local.gutter}
          overflowPadding={local.overflowPadding}
          slot={styles.slot}
          empty={
            emptyRender() !== undefined
              ? renderComponentOrElement(emptyRender(), {
                  get inputValue() {
                    return search.query()
                  },
                  get hasMatches() {
                    return state.visibleItems().length > 0
                  },
                  get selectedValue() {
                    return state.value() as V | null
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
    <div
      {...rootProps}
      ref={local.ref}
      data-slot="root"
      data-disabled={(baseSelectProps.disabled ?? field?.disabled) ? '' : undefined}
      data-readonly={(baseSelectProps.readOnly ?? field?.readOnly) ? '' : undefined}
      data-required={(baseSelectProps.required ?? field?.required) ? '' : undefined}
      data-invalid={isFormFieldInvalid(field) ? '' : undefined}
      {...styles.root}
    >
      <BaseSelect<SelectT.Item<V>>
        {...baseSelectProps}
        multiple={false}
        size={styles.variants.size ?? undefined}
        classes={sharedClasses()}
        styles={sharedStyles()}
      >
        <Control />
      </BaseSelect>
    </div>
  )
}
