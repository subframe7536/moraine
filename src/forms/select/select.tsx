import type { JSX } from 'solid-js'
import { splitProps, createMemo, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

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
  SELECT_LOCAL_PROP_KEYS,
} from './shared/props.ts'
import { useSelectSearch } from './shared/search.ts'

/** Single selection with optional search and standard item presentation. */
export function Select<V extends SelectT.Value = SelectT.Value>(
  props: SelectProps<V>,
): JSX.Element {
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    SELECT_LOCAL_PROP_KEYS,
    BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const itemRender = createMemo(() => local.itemRender)
  const emptyRender = createMemo(() => local.emptyRender)
  const leadingIcon = createMemo(() => local.leadingIcon)
  const loadingIcon = createMemo(() => local.loadingIcon ?? 'icon-loading')
  const trailingIcon = createMemo(() => local.trailingIcon ?? 'icon-chevron-down')
  const closeIcon = createMemo(() => local.closeIcon ?? 'icon-close')
  const field = useFormFieldContext()
  const styles = createComponentStyles('select', props, {
    inheritedVariants: () => ({ size: field?.size }),
  })
  const sharedClasses = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).class])),
  )
  const sharedStyles = createMemo(() =>
    Object.fromEntries(BASE_SELECT_SHARED_SLOTS.map((slot) => [slot, styles.slot(slot).style])),
  )
  const searchable = () => Boolean(styles.variants.search)

  function Control(): JSX.Element {
    const state = useSelectState<SelectT.Item<V>>()
    const search = useSelectSearch(local, searchable)
    const hasValue = () => state.value() !== null

    const clear = () => {
      if (state.locked()) {
        return
      }
      state.change(null)
      search.setQuery('')
      local.onClear?.()
    }
    return (
      <>
        <Dynamic
          component={searchable() ? 'div' : BaseSelect.Trigger}
          as={searchable() ? undefined : 'div'}
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
            state.control()?.focus()
            if (searchable()) {
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
                {state.selectedItems()[0]?.label ??
                  (hasValue() ? String(state.value()) : local.placeholder)}
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
            when={!local.loading && local.allowClear && hasValue()}
            fallback={
              <Icon
                name={local.loading ? loadingIcon() : trailingIcon()}
                slotName="trigger"
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
