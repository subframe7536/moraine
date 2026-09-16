import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createComponentStyles } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callRef } from '../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../base-select/base-select.tsx'
import { useFormFieldContext } from '../form/form-context.ts'
import { createSource } from '../shared/select/collection.ts'
import { DefaultSelectContent } from '../shared/select/default-content.tsx'
import {
  BASE_SELECT_SHARED_SLOTS,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  SELECT_LOCAL_PROP_KEYS,
} from '../shared/select/props.ts'

import type { SelectProps, SelectT } from './select.types.ts'

/** Single, non-editable collection selection. */
export function Select<T extends SelectT.Item = SelectT.Item>(props: SelectProps<T>): JSX.Element {
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    SELECT_LOCAL_PROP_KEYS,
    SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  )
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
  const source = createMemo(() => createSource(local.items ?? []))
  const selection = createMemo(() =>
    local.value === undefined ? undefined : local.value === null ? [] : [local.value],
  )
  const defaultSelection = () =>
    local.defaultValue === undefined || local.defaultValue === null ? [] : [local.defaultValue]

  function Control(): JSX.Element {
    const state = useSelectState<T>()
    const selectedItem = () => source().byValue.get(state.value()[0]!)
    const hasValue = () => state.value().length > 0
    function clear(): void {
      if (state.locked()) {
        return
      }
      state.change([])
      local.onClear?.()
      state.focusOwner()?.focus()
    }
    return (
      <>
        <BaseSelect.Control
          {...rootProps}
          {...styles.slot('control')}
          data-disabled={state.field.disabled() ? '' : undefined}
          data-readonly={state.field.readOnly() ? '' : undefined}
          data-required={state.field.required() ? '' : undefined}
          data-invalid={state.field.invalid() ? '' : undefined}
          ref={(element) => callRef(local.ref, element)}
        >
          <BaseSelect.Trigger<'button', T> {...styles.slot('trigger')}>
            <Show when={local.leadingIcon}>
              {(icon) => <Icon name={icon()} slotName="leading" {...styles.slot('leading')} />}
            </Show>
            <span
              data-slot="value"
              data-placeholder={!hasValue() ? '' : undefined}
              {...styles.slot('value')}
            >
              {selectedItem()?.label ?? (hasValue() ? String(state.value()[0]) : local.placeholder)}
            </span>
            <Icon
              name={
                local.loading
                  ? (local.loadingIcon ?? 'icon-loading')
                  : (local.trailingIcon ?? 'icon-chevron-down')
              }
              data-loading={local.loading ? '' : undefined}
              class="data-loading:animate-spin"
            />
          </BaseSelect.Trigger>
          <Show when={!local.loading && local.allowClear && hasValue()}>
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
                state.focusOwner()?.focus()
              }}
              onClick={(event) => {
                event.stopPropagation()
                clear()
              }}
            >
              <Icon name={local.closeIcon ?? 'icon-close'} />
            </button>
          </Show>
        </BaseSelect.Control>
        <DefaultSelectContent
          view={source()}
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
      items={source().items}
      serializeValue={(value) =>
        source().byValue.get(value)?.disabled ? undefined : String(value)
      }
      value={selection()}
      defaultValue={defaultSelection()}
      onChange={(values) => local.onChange?.(values[0] ?? null)}
      onReset={local.onReset}
      multiple={false}
      size={styles.variants.size ?? undefined}
      classes={sharedClasses()}
      styles={sharedStyles()}
    >
      <Control />
    </BaseSelect>
  )
}
