import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps, untrack } from 'solid-js'

import { Icon } from '../../elements/icon'
import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import { useControllableValue } from '../../shared/use-controllable-value'
import { callRef } from '../../shared/utils'
import { useFormFieldContext } from '../form/form-context'

import { BaseSelect } from './base-select'
import type { BaseSelectT } from './base-select'
import type { SelectProps, SelectT } from './select.types'
import {
  createEmptyRenderer,
  findNormalizedOptionByValue,
  mapNormalizedToRawValue,
  renderDefaultSelectOption,
} from './shared'
import type { NormalizedOption } from './shared'

/** Dropdown select component with search and custom item rendering. */
export function Select<TItem extends SelectT.Value = SelectT.Value>(
  props: SelectProps<TItem>,
): JSX.Element {
  const cn = useCn()
  type Item = SelectT.Item<TItem>

  const [local, rest] = splitProps(props, [
    'ref',
    'inputRef',
    'classes',
    'styles',
    'class',
    'style',
    'variant',
    'search',
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
  const themeField = useFormFieldContext()
  const resolved = createComponentStyles('select', props, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })

  const initialDefaultValue = untrack(() => local.defaultValue ?? null)
  const optionRender = createMemo(() => local.optionRender)
  const labelRender = createMemo(() => local.labelRender)
  const emptyRender = createMemo(() => local.emptyRender)
  const leadingIcon = createMemo(() => local.leadingIcon)
  const loadingIcon = createMemo(() => local.loadingIcon)
  const trailingIcon = createMemo(() => local.trailingIcon)
  const closeIcon = createMemo(() => local.closeIcon)
  const [selectedValue, setSelectedValue] = useControllableValue<TItem | null>({
    value: () => local.value,
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
    if (local.value !== undefined) {
      return local.value
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

    if (local.value === undefined) {
      setSelectedValue(value)
    }

    api.field.setFormValue(value ?? '')
    local.onChange?.(value)
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
    return value === null || value === undefined ? local.placeholder : String(value)
  }

  function renderDefaultOption(option: (Item & SelectT.OptionRenderState) | null): JSX.Element {
    return renderDefaultSelectOption(
      {
        option,
        classes: {
          empty: resolved.slot('empty').class,
          itemLabel: resolved.slot('itemLabel').class,
          itemDescription: resolved.slot('itemDescription').class,
          itemTrailing: resolved.slot('itemTrailing').class,
        },
        styles: {
          empty: resolved.slot('empty').style,
          itemLabel: resolved.slot('itemLabel').style,
          itemDescription: resolved.slot('itemDescription').style,
          itemTrailing: resolved.slot('itemTrailing').style,
        },
        labelRender: labelRender(),
      },
      cn,
    )
  }

  function clearSelection(api: BaseSelectT.StateApi<Item>): void {
    updateSelection(null, api)
    api.close()
    local.onClear?.()
  }

  return (
    <BaseSelect<Item>
      {...rest}
      ref={local.ref}
      search={resolved.variants.search ?? false}

      _styles={resolved}

      initialValue={getInitialValue()}
      _isValueControlled={local.value !== undefined}
      multiple={false}
      selectedValues={getSelectedValues()}
      onOptionSelect={(option, api) => updateSelection(option, api)}
      _onFormReset={(api) => {
        const value = local.value !== undefined ? local.value : initialDefaultValue
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
        const isActionLoading = createMemo(() => Boolean(local.loading))
        const isClearAction = createMemo(() =>
          Boolean(!isActionLoading() && local.allowClear && getCurrentValue(api) !== null),
        )

        const controlResolved = api.resolved

        return (
          <div
            data-slot="control"
            data-disabled={api.field.disabled() ? '' : undefined}
            data-invalid={api.field.invalid() ? '' : undefined}
            data-required={api.field.required() ? '' : undefined}
            {...controlResolved.slot('control')}
            {...api.controlProps()}
          >
            <Show when={leadingIcon()}>
              {(icon) => (
                <Icon name={icon()} slotName="leading" {...controlResolved.slot('leading')} />
              )}
            </Show>

            <Show
              when={api.isSearchable()}
              fallback={
                <span
                  data-slot="input"
                  data-placeholder={getCurrentValue(api) === null ? '' : undefined}
                  {...controlResolved.slot('input')}
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
                {...controlResolved.slot('input')}
                placeholder={local.placeholder}
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
                  {...controlResolved.slot('trigger')}
                />
              }
            >
              <button
                type="button"
                data-slot="clear"
                aria-label="Clear selection"
                tabIndex={-1}
                {...controlResolved.slot('clear')}
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
