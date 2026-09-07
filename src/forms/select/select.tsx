import type { JSX } from 'solid-js'
import { Show, createMemo, mergeProps, splitProps, untrack } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { callRef } from '../../shared/utils.ts'

import { BaseSelect } from './base-select.tsx'
import type { BaseSelectT } from './base-select.tsx'
import type { SelectProps, SelectT } from './select.types.ts'
import {
  createEmptyRenderer,
  findNormalizedOptionByValue,
  mapNormalizedToRawValue,
  renderDefaultSelectOption,
} from './shared/index.ts'
import type { NormalizedOption } from './shared/index.ts'

export * from './select.types.ts'

/** Dropdown select component with search and custom item rendering. */
export function Select<TItem extends SelectT.Value = SelectT.Value>(
  props: SelectProps<TItem>,
): JSX.Element {
  type Item = SelectT.Item<TItem>

  const design = useMoraineDesign()
  const selectDesign = () => design().select

  const [local, rest] = splitProps(props, [
    'ref',
    'inputRef',
    'classes',
    'styles',
    'class',
    'style',
    'variant',
    'placeholder',
    'allowClear',
    'loading',
    'value',
    'defaultValue',
    'onChange',
    'onClear',
    'optionRender',
    'labelRender',
    'emptyRender',
    'leadingIcon',
    'loadingIcon',
    'trailingIcon',
    'closeIcon',
  ])

  const merged = mergeProps(
    {
      variant: 'outline' as const,
    },
    () => selectDesign()?.defaultVariants,
    local,
  )

  const initialDefaultValue = untrack(() => merged.defaultValue ?? null)
  const optionRender = createMemo(() => merged.optionRender)
  const labelRender = createMemo(() => merged.labelRender)
  const emptyRender = createMemo(() => merged.emptyRender)
  const leadingIcon = createMemo(() => merged.leadingIcon)
  const loadingIcon = createMemo(() => merged.loadingIcon)
  const trailingIcon = createMemo(() => merged.trailingIcon)
  const closeIcon = createMemo(() => merged.closeIcon)
  const [selectedValue, setSelectedValue] = useControllableValue<TItem | null>({
    value: () => merged.value,
    defaultValue: () => initialDefaultValue,
  })

  function getInitialValue(): TItem | '' {
    return initialDefaultValue ?? ''
  }

  function getSelectedValues(): TItem[] {
    const value = selectedValue()
    return value === null || value === undefined ? [] : [value]
  }

  function getCurrentValue(
    api: Pick<BaseSelectT.StateApi<Item>, 'allFlatOptions' | 'field'>,
  ): TItem | null {
    if (merged.value !== undefined) {
      return merged.value
    }

    const fieldValue = api.field.value()
    if (fieldValue === null) {
      return null
    }

    if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
      if (fieldValue !== '' || findNormalizedOptionByValue(api.allFlatOptions(), fieldValue)) {
        return fieldValue as TItem
      }
    }

    return selectedValue() ?? null
  }

  function findSelectedOption(
    api: Pick<BaseSelectT.StateApi<Item>, 'allFlatOptions' | 'field'>,
  ): NormalizedOption<Item> | null {
    const value = getCurrentValue(api)
    return findNormalizedOptionByValue(api.allFlatOptions(), value) ?? null
  }

  function updateSelection(
    option: NormalizedOption<Item> | null,
    api: Pick<BaseSelectT.StateApi<Item>, 'field'>,
  ): void {
    const value = option ? (mapNormalizedToRawValue(option) as TItem) : null
    const current = getCurrentValue({ allFlatOptions: () => [], field: api.field })

    if (current === value) {
      return
    }

    if (merged.value === undefined) {
      setSelectedValue(value)
    }

    api.field.setFormValue(value ?? '')
    merged.onChange?.(value)
  }

  function displayValue(
    api: Pick<BaseSelectT.StateApi<Item>, 'allFlatOptions' | 'field'>,
  ): JSX.Element {
    const selected = findSelectedOption(api)
    if (selected) {
      if (labelRender()) {
        return renderComponentOrElement(labelRender(), {
          get option() {
            return selected.raw
          },
        })
      }

      return selected.label ?? selected.key
    }

    const value = getCurrentValue(api)
    return value === null || value === undefined ? merged.placeholder : String(value)
  }

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return selectDesign()?.recipe({
          variant: merged.variant,
          mode: 'single',
        })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const resolvedClasses = () => ({
    content: resolved.slotClass('content'),
    listbox: resolved.slotClass('listbox'),
    item: resolved.slotClass('item'),
    group: resolved.slotClass('group'),
    label: resolved.slotClass('label'),
    empty: resolved.slotClass('empty'),
    itemLabel: resolved.slotClass('itemLabel'),
    itemDescription: resolved.slotClass('itemDescription'),
    itemTrailing: resolved.slotClass('itemTrailing'),
  })

  const resolvedStyles = () => ({
    content: resolved.slotStyle('content'),
    listbox: resolved.slotStyle('listbox'),
    item: resolved.slotStyle('item'),
    group: resolved.slotStyle('group'),
    label: resolved.slotStyle('label'),
    empty: resolved.slotStyle('empty'),
    itemLabel: resolved.slotStyle('itemLabel'),
    itemDescription: resolved.slotStyle('itemDescription'),
    itemTrailing: resolved.slotStyle('itemTrailing'),
  })

  function renderDefaultOption(option: (Item & SelectT.OptionRenderState) | null): JSX.Element {
    return renderDefaultSelectOption({
      option,
      classes: resolvedClasses(),
      styles: resolvedStyles(),
      labelRender: labelRender(),
    })
  }

  function clearSelection(api: BaseSelectT.StateApi<Item>): void {
    updateSelection(null, api)
    api.close()
    merged.onClear?.()
  }

  return (
    <BaseSelect<Item>
      {...rest}
      ref={local.ref}
      _defaultSize={merged.size ?? undefined}
      _designRecipe={(args) =>
        selectDesign()?.recipe({
          variant: merged.variant,
          mode: 'single',
          ...args,
        })
      }
      _styleInputs={{
        get instance() {
          return {
            class: local.class,
            classes: local.classes,
            style: local.style,
            styles: local.styles,
          }
        },
      }}
      initialValue={getInitialValue()}
      _isValueControlled={merged.value !== undefined}
      multiple={false}
      selectedValues={getSelectedValues()}
      onOptionSelect={(option, api) => updateSelection(option, api)}
      _onFormReset={(api) => {
        const value = merged.value !== undefined ? merged.value : initialDefaultValue
        setSelectedValue(initialDefaultValue)
        api.setInputValue('')
        api.field.setFormValue(value ?? '')
      }}
      emptyRender={createEmptyRenderer({
        emptyRender: emptyRender(),
        buildProps: (api: BaseSelectT.StateApi<Item>) => {
          return {
            get inputValue() {
              return api.inputValue()
            },
            get hasMatches() {
              return api.visibleFlatOptions().length > 0
            },
            get selectedValue() {
              const selected = findSelectedOption(api)
              return selected ? (mapNormalizedToRawValue(selected) as TItem) : null
            },
            close: api.close,
          }
        },
      })}
      optionRender={(renderProps) => (
        <Show
          when={optionRender() !== undefined}
          fallback={renderDefaultOption(renderProps.option)}
        >
          {renderComponentOrElement(optionRender(), {
            get option() {
              return renderProps.option
            },
          })}
        </Show>
      )}
    >
      {(api) => {
        const isActionLoading = createMemo(() => Boolean(merged.loading))
        const isClearAction = createMemo(() =>
          Boolean(!isActionLoading() && merged.allowClear && getCurrentValue(api) !== null),
        )

        const controlResolved = api.resolved

        return (
          <div
            data-slot="control"
            data-disabled={api.field.disabled() ? '' : undefined}
            data-invalid={api.field.invalid() ? '' : undefined}
            data-required={api.field.required() ? '' : undefined}
            {...controlResolved.slotClassAndStyle('control')}
            {...api.controlProps()}
          >
            <Show when={leadingIcon()}>
              {(icon) => (
                <Icon
                  name={icon()}
                  slotName="leading"
                  {...controlResolved.slotClassAndStyle('leading')}
                />
              )}
            </Show>

            <Show
              when={api.isSearchable()}
              fallback={
                <span
                  data-slot="input"
                  data-placeholder={getCurrentValue(api) === null ? '' : undefined}
                  {...controlResolved.slotClassAndStyle('input')}
                >
                  {displayValue(api)}
                </span>
              }
            >
              <input
                ref={(element) => {
                  callRef(api.inputProps().ref, element)
                  callRef(local.inputRef, element)
                }}
                data-slot="input"
                {...controlResolved.slotClassAndStyle('input')}
                placeholder={merged.placeholder}
                {...api.inputProps()}
                onInput={(event) => {
                  api.setInputValue(event.currentTarget.value)
                  api.onInput(event)
                }}
              />
            </Show>

            <Show
              when={isClearAction()}
              fallback={
                <Icon
                  name={
                    isActionLoading()
                      ? (loadingIcon() ?? 'icon-loading')
                      : (trailingIcon() ?? 'icon-chevron-down')
                  }
                  slotName="trigger"
                  data-loading={isActionLoading() ? '' : undefined}
                  {...controlResolved.slotClassAndStyle('trigger')}
                />
              }
            >
              <button
                type="button"
                data-slot="clear"
                aria-label="Clear selection"
                tabIndex={-1}
                {...controlResolved.slotClassAndStyle('clear')}
                disabled={api.field.disabled()}
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  api.focusInput()
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  if (api.field.disabled()) {
                    return
                  }
                  clearSelection(api)
                }}
              >
                <Icon name={closeIcon() ?? 'icon-close'} />
              </button>
            </Show>
          </div>
        )
      }}
    </BaseSelect>
  )
}
