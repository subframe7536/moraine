import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { Icon } from '../../element/icon/index'
import { createStyles } from '../../provider/index'
import { callRef } from '../../shared/utils'
import { BaseSelect, BaseSelectRoot, useSelectContext } from '../base-select/base-select'
import { useFieldContext } from '../field/field-context'
import {
  createSource,
  normalizeSelectEntries,
  serializeSourceValue,
  singleValueToSelection,
} from '../shared/select/collection'
import { DefaultSelectContent } from '../shared/select/default-content'
import {
  createBaseSelectStyleProps,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  SELECT_LOCAL_PROP_KEYS,
} from '../shared/select/props'

import { selectDataAttributes, selectRecipe } from './select.recipe'
import type { SelectProps, SelectT } from './select.types'

/** Single, non-editable collection selection. */
export function Select<T extends string | SelectT.Item = string | SelectT.Item>(
  props: SelectProps<T>,
): JSX.Element {
  const [local, baseSelectProps, rootProps] = splitProps(
    props,
    SELECT_LOCAL_PROP_KEYS,
    SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const field = useFieldContext()
  const styles = createStyles(selectRecipe, props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: field?.size }),
  })
  const baseSelectStyles = createBaseSelectStyleProps(styles.styles)
  const source = createMemo(
    (prev: ReturnType<typeof createSource<SelectT.NormalizedItem<T>>> | undefined) =>
      createSource(normalizeSelectEntries<T>(local.items ?? []), undefined, prev),
  )
  const selection = createMemo(() => singleValueToSelection(local.value))
  const defaultSelection = () => singleValueToSelection(local.defaultValue)

  function Control(): JSX.Element {
    const state = useSelectContext<SelectT.NormalizedItem<T>>()
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
          {...styles.styles.control}
          ref={(element) => callRef(local.ref, element)}
        >
          <BaseSelect.Trigger<'button', SelectT.NormalizedItem<T>>
            {...styles.styles.trigger}
            onKeyDown={(event) => {
              if (
                local.allowClear &&
                hasValue() &&
                (event.key === 'Delete' || event.key === 'Backspace')
              ) {
                event.preventDefault()
                clear()
              }
            }}
          >
            <Show when={local.leadingIcon}>
              {(icon) => (
                <Icon name={icon()} slotName="select-leading" {...styles.styles.leading} />
              )}
            </Show>
            <span
              data-slot="select-value"
              {...selectDataAttributes.value({ placeholder: () => !hasValue() })}
              {...styles.styles.value}
            >
              {selectedItem()?.label ?? (hasValue() ? String(state.value()[0]) : local.placeholder)}
            </span>
            <Icon
              slotName="select-trailing"
              name={
                local.loading
                  ? (local.loadingIcon ?? 'icon-loading')
                  : (local.trailingIcon ?? 'icon-chevron-down')
              }
              {...selectDataAttributes.trailing({ loading: () => local.loading })}
              {...styles.styles.trailing}
            />
          </BaseSelect.Trigger>
          <Show when={!local.loading && local.allowClear && hasValue()}>
            <button
              type="button"
              data-slot="select-clear"
              aria-label="Clear selection"
              tabIndex={0}
              {...styles.styles.clear}
              disabled={state.locked()}
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                state.focusOwner()?.focus()
              }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                clear()
              }}
            >
              <Icon name={local.closeIcon ?? 'icon-close'} />
            </button>
          </Show>
        </BaseSelect.Control>
        <DefaultSelectContent {...local} view={source()} slot={(slot) => styles.styles[slot]} />
      </>
    )
  }

  return (
    <BaseSelectRoot<SelectT.NormalizedItem<T>>
      slotOwner="select"
      {...baseSelectProps}
      items={source().items}
      serializeValue={(value) => serializeSourceValue(source(), value)}
      value={selection()}
      defaultValue={defaultSelection()}
      onValueChange={(values) => local.onValueChange?.(values[0] ?? null)}
      onReset={local.onReset}
      multiple={false}
      size={styles.variants.size ?? undefined}
      classes={baseSelectStyles.classes()}
      styles={baseSelectStyles.styles()}
    >
      <Control />
    </BaseSelectRoot>
  )
}
