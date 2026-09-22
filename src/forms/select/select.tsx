import type { JSX } from 'solid-js'
import { createMemo, Show, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createStyles } from '../../provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callRef } from '../../shared/utils.ts'
import { BaseSelect, useSelectState } from '../base-select/base-select.tsx'
import { useFieldContext } from '../field/field-context.ts'
import {
  createSource,
  normalizeSelectEntries,
  serializeSourceValue,
  singleValueToSelection,
} from '../shared/select/collection.ts'
import { DefaultSelectContent } from '../shared/select/default-content.tsx'
import {
  createBaseSelectStyleProps,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  SELECT_LOCAL_PROP_KEYS,
} from '../shared/select/props.ts'

import { selectDataAttributes, selectRecipe } from './select.recipe'
import type { SelectProps, SelectT } from './select.types.ts'

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
  const baseSelectStyles = createBaseSelectStyleProps((slot) => styles.styles[slot])
  const source = createMemo(
    (prev: ReturnType<typeof createSource<SelectT.NormalizedItem<T>>> | undefined) =>
      createSource(normalizeSelectEntries<T>(local.items ?? []), undefined, prev),
  )
  const selection = createMemo(() => singleValueToSelection(local.value))
  const defaultSelection = () => singleValueToSelection(local.defaultValue)

  function Control(): JSX.Element {
    const state = useSelectState<SelectT.NormalizedItem<T>>()
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
          <BaseSelect.Trigger<'button', SelectT.NormalizedItem<T>> {...styles.styles.trigger}>
            <Show when={local.leadingIcon}>
              {(icon) => <Icon name={icon()} slotName="leading" {...styles.styles.leading} />}
            </Show>
            <span
              data-slot="value"
              {...selectDataAttributes.value({ placeholder: () => !hasValue() })}
              {...styles.styles.value}
            >
              {selectedItem()?.label ?? (hasValue() ? String(state.value()[0]) : local.placeholder)}
            </span>
            <Show when={!local.loading && local.allowClear && hasValue()}>
              <span
                data-slot="clear"
                aria-hidden="true"
                {...styles.styles.clear}
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
              </span>
            </Show>
            <Icon
              slotName="trailing"
              name={
                local.loading
                  ? (local.loadingIcon ?? 'icon-loading')
                  : (local.trailingIcon ?? 'icon-chevron-down')
              }
              {...selectDataAttributes.trailing({ loading: () => local.loading })}
              {...styles.styles.trailing}
            />
          </BaseSelect.Trigger>
        </BaseSelect.Control>
        <DefaultSelectContent
          {...local}
          view={source()}
          slot={(slot) => styles.styles[slot]}
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
    <BaseSelect<SelectT.NormalizedItem<T>>
      {...baseSelectProps}
      items={source().items}
      serializeValue={(value) => serializeSourceValue(source(), value)}
      value={selection()}
      defaultValue={defaultSelection()}
      onChange={(values) => local.onChange?.(values[0] ?? null)}
      onReset={local.onReset}
      multiple={false}
      size={styles.variants.size ?? undefined}
      classes={baseSelectStyles.classes()}
      styles={baseSelectStyles.styles()}
    >
      <Control />
    </BaseSelect>
  )
}
