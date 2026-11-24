import type { JSX } from '@solidjs/web'
import { createMemo, Show, omit } from 'solid-js'

import { useRecipe } from '../../provider/index'
import { useMessages } from '../../provider/locale/locale-context'
import { callRef, pick } from '../../shared/utils'
import { BaseSelect, BaseSelectRoot } from '../base-select/base-select'
import { useSelectContext } from '../base-select/base-select-context'
import { useFieldContext } from '../field/field-context'
import { Icon } from '../icon/index'
import {
  createSource,
  normalizeSelectEntries,
  serializeSourceValue,
  singleValueToSelection,
} from '../shared/form/select/collection'
import { ClearButton, createSelectClearKeyDownHandler } from '../shared/form/select/control-action'
import { DefaultSelectContent } from '../shared/form/select/default-content'
import {
  createBaseSelectStyleProps,
  SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  SINGLE_SELECT_LOCAL_PROP_KEYS,
} from '../shared/form/select/props'

import { defaultSelectMessages } from './select.messages'
import { selectDataAttributes, selectRecipe } from './select.recipe'
import type { SelectProps, SelectT } from './select.types'
/**
 * Single, non-editable collection selection from a popup list. Items may be strings or
 * `{ value, label }` objects, optionally grouped. Use `Combobox` when users need to type a query
 * or virtualize a large collection, `MultiSelect` for several values, and `BaseSelect` to
 * compose the listbox yourself. Wrap it in `Field` for a label, description, and validation
 * message.
 *
 * @example
 * ```tsx
 * import { createSignal, omit } from 'solid-js'
 * import { Field, Select } from 'moraine'
 *
 * const [size, setSize] = createSignal<string | null>('md')
 *
 * <Field label="Size">
 *   <Select
 *     items={[
 *       { label: 'Small', value: 'sm' },
 *       { label: 'Medium', value: 'md' },
 *       { label: 'Large', value: 'lg' },
 *     ]}
 *     value={size()}
 *     onValueChange={setSize}
 *     placeholder="Choose a size"
 *   />
 * </Field>
 * ```
 */
export function Select<T extends string | SelectT.Item = string | SelectT.Item>(
  props: SelectProps<T>,
): JSX.Element {
  const local = pick(props, ...SINGLE_SELECT_LOCAL_PROP_KEYS)
  const baseSelectProps = pick(props, ...SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS)
  const rootProps = omit(
    props,
    ...SINGLE_SELECT_LOCAL_PROP_KEYS,
    ...SINGLE_SELECT_BASE_SELECT_FORWARD_PROP_KEYS,
  )
  const field = useFieldContext()
  const messages = useMessages('select', defaultSelectMessages, () => local.translations)
  const {
    slots,
    slots: {
      control: controlSlot,
      trigger: triggerSlot,
      leading: leadingSlot,
      trailing: trailingSlot,
      clear: clearSlot,
    },
    slotWith,
    variants,
  } = useRecipe(selectRecipe, props, {
    slot: 'control',
    data: { trailing: selectDataAttributes.trailing({ loading: () => local.loading }) },
    context: () => ({ variants: { size: field?.size } }),
  })
  const baseSelectStyles = createBaseSelectStyleProps(slots)
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
    const valueSlot = slotWith('value', {
      data: selectDataAttributes.value({ placeholder: () => !hasValue() }),
    })
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
          {...controlSlot}
          {...rootProps}
          ref={(element) => callRef(() => local.ref, element)}
        >
          <BaseSelect.Trigger<'button', SelectT.NormalizedItem<T>>
            aria-busy={local.loading ? 'true' : undefined}
            {...triggerSlot}
            ref={(element) => callRef(() => local.triggerRef, element)}
            onKeyDown={createSelectClearKeyDownHandler({
              clearable: () => local.clearable,
              canClear: hasValue,
              clear,
            })}
          >
            <Show when={local.leading}>
              {(icon) => <Icon name={icon()} data-slot="select-leading" {...leadingSlot} />}
            </Show>
            <span data-slot="select-value" {...valueSlot}>
              {selectedItem()?.label ??
                (hasValue()
                  ? String(state.value()[0])
                  : (local.placeholder ?? messages().placeholder))}
            </span>
            <Icon
              data-slot="select-trailing"
              name={
                local.loading
                  ? (local.loadingIcon ?? 'icon-loading')
                  : (local.trailing ?? 'icon-chevron-down')
              }
              {...trailingSlot}
            />
          </BaseSelect.Trigger>
          <Show when={!local.loading && local.clearable && hasValue()}>
            <ClearButton
              dataSlot="select-clear"
              ariaLabel={messages().clear}
              slot={clearSlot}
              disabled={state.locked()}
              clearIcon={local.clearIcon}
              onFocusOwner={() => state.focusOwner()?.focus()}
              onClear={clear}
            />
          </Show>
        </BaseSelect.Control>
        <DefaultSelectContent {...local} view={source()} slot={(slot) => slots[slot]} />
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
      size={variants.size ?? undefined}
      classes={baseSelectStyles.classes()}
      styles={baseSelectStyles.styles()}
    >
      <Control />
    </BaseSelectRoot>
  )
}
