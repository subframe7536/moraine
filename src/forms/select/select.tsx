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
    api: BaseSelectT.OptionSelectContext<Item>,
  ): void {
    if (api.field.readOnly()) {
      return
    }

    const value = option ? (mapNormalizedToRawValue(option) as TItem) : null
    const current = getCurrentValue(api)

    if (Object.is(current, value)) {
      return
    }

    if (local.value === undefined) {
      setSelectedValue(value)
      api.field.setFormValue(value ?? '')
    }

    api.setInputValue(option?.key ?? '')
    local.onChange?.(value)
    if (local.value !== undefined) {
      api.field.setFormValue(local.value ?? '')
    }
    api.field.emit('change')
    api.field.emit('input')
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
          itemLeading: resolved.slot('itemLeading').class,
          itemLabel: resolved.slot('itemLabel').class,
          itemDescription: resolved.slot('itemDescription').class,
          itemTrailing: resolved.slot('itemTrailing').class,
        },
        styles: {
          empty: resolved.slot('empty').style,
          itemLeading: resolved.slot('itemLeading').style,
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
    if (api.field.readOnly()) {
      return
    }

    updateSelection(null, api)
    api.close()
    local.onClear?.()
  }

  return (
    <BaseSelect<Item>
      {...rest}
      ref={local.ref}
      search={resolved.variants.search ?? false}

      resolvedStyles={resolved}

      initialValue={getInitialValue()}
      isValueControlled={local.value !== undefined}
      multiple={false}
      selectedValues={getSelectedValues()}
      onOptionSelect={(option, api) => updateSelection(option, api)}
      onFormReset={(api) => {
        const value = local.value !== undefined ? local.value : initialDefaultValue
        setSelectedValue(initialDefaultValue)
        api.setInputValue('')
        api.field.setFormValue(value ?? '')
      }}
    >
      <BaseSelect.Control<Item>>
        {(api: BaseSelectT.ControlApi<Item>) => {
          const isActionLoading = createMemo(() => Boolean(local.loading))
          const isClearAction = createMemo(() =>
            Boolean(!isActionLoading() && local.allowClear && getCurrentValue(api) !== null),
          )

          return (
            <>
              <Show when={leadingIcon()}>
                {(icon) => <Icon name={icon()} slotName="leading" {...resolved.slot('leading')} />}
              </Show>

              <BaseSelect.Input
                ref={(element: HTMLInputElement) => callRef(local.inputRef, element)}
                placeholder={local.placeholder}
              >
                {displayValue(api)}
              </BaseSelect.Input>

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
                    {...resolved.slot('trigger')}
                  />
                }
              >
                <BaseSelect.Clear
                  onClick={() => {
                    clearSelection(api)
                  }}
                >
                  <Icon name={closeIcon() ?? 'icon-close'} />
                </BaseSelect.Clear>
              </Show>
            </>
          )
        }}
      </BaseSelect.Control>
      <BaseSelect.Content>
        <BaseSelect.Listbox
          itemRender={(renderProps) => (
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
        />
      </BaseSelect.Content>
    </BaseSelect>
  )
}
