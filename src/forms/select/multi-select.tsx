import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, splitProps, untrack } from 'solid-js'

import { Icon } from '../../elements/icon'
import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import { useControllableValue } from '../../shared/use-controllable-value'
import { callRef } from '../../shared/utils'
import { useFormFieldContext } from '../form/form-context'

import { BaseSelect } from './base-select'
import type { BaseSelectT } from './base-select'
import type { MultiSelectProps, MultiSelectT } from './multi-select.types'
import {
  createEmptyRenderer,
  getSelectedValueKey,
  emitSelectValueChange,
  findNormalizedOptionByText,
  mapNormalizedListToRawValues,
  mapNormalizedToRawValue,
  renderDefaultSelectOption,
  resolveSelectedOptions,
} from './shared'
import type { NormalizedOption } from './shared'

function disableUnselectedOptionsWhenAtMax<
  TItem extends {
    value?: string | number
    disabled?: boolean
    children?: TItem[]
  },
>(items: TItem[], selectedValues: Array<string | number>, isAtMaxCount: boolean): TItem[] {
  if (!isAtMaxCount) {
    return items
  }

  const selectedKeys = new Set(selectedValues.map(getSelectedValueKey))
  const disableItems = (currentItems: TItem[]): TItem[] =>
    currentItems.map((item) => {
      if (Array.isArray(item.children) && item.children.length > 0) {
        return {
          ...item,
          children: disableItems(item.children),
        }
      }

      if (item.disabled || selectedKeys.has(getSelectedValueKey(item.value ?? ''))) {
        return item
      }

      return {
        ...item,
        disabled: true,
      }
    })

  return disableItems(items)
}

function normalizeSelectedValues<TValue extends string | number>(
  values: readonly TValue[] | undefined,
): TValue[] {
  const result: TValue[] = []
  const seenKeys = new Set<string>()

  for (const value of values ?? []) {
    const key = getSelectedValueKey(value)
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      result.push(value)
    }
  }

  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Dropdown select component with search, multi-select, and custom item rendering. */
export function MultiSelect<TItem extends MultiSelectT.Value = MultiSelectT.Value>(
  props: MultiSelectProps<TItem>,
): JSX.Element {
  const cn = useCn()
  type Item = MultiSelectT.Item<TItem>

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
    'tagRender',
    'labelRender',
    'emptyRender',
    'leadingIcon',
    'loadingIcon',
    'trailingIcon',
    'closeIcon',
    'maxCount',
    'maxTagCount',
    'tokenSeparators',
    'allowCreate',
    'options',
  ])
  const themeField = useFormFieldContext()
  const resolved = createComponentStyles('multiSelect', props, {
    inheritedVariants: () => ({ size: themeField?.size }),
  })

  const initialDefaultValues = untrack(() => normalizeSelectedValues(local.defaultValue))
  const optionRender = createMemo(() => local.optionRender)
  const tagRender = createMemo(() => local.tagRender)
  const labelRender = createMemo(() => local.labelRender)
  const emptyRender = createMemo(() => local.emptyRender)
  const leadingIcon = createMemo(() => local.leadingIcon)
  const loadingIcon = createMemo(() => local.loadingIcon)
  const trailingIcon = createMemo(() => local.trailingIcon)
  const closeIcon = createMemo(() => local.closeIcon || 'icon-close')
  const rawOptions = createMemo(() => local.options ?? [])
  const [rawSelectedValues, setSelectedValues] = useControllableValue<TItem[]>({
    value: () => local.value,
    defaultValue: () => initialDefaultValues,
  })
  const [createdTags, setCreatedTags] = createSignal<NormalizedOption<Item>[]>([])
  const [isComposing, setIsComposing] = createSignal(false)
  const selectedValues = createMemo(() => normalizeSelectedValues(rawSelectedValues() ?? []))

  const isAtMaxCount = createMemo(() =>
    local.maxCount === undefined ? false : selectedValues().length >= local.maxCount,
  )
  const tokenSeparatorPattern = createMemo(() => {
    const separators = [
      ...new Set(local.tokenSeparators?.filter((separator) => separator.length > 0) ?? []),
    ].sort((left, right) => right.length - left.length)
    if (separators.length === 0) {
      return undefined
    }

    const source = separators.map(escapeRegex).join('|')
    return {
      split: new RegExp(source),
      trailing: new RegExp(`(?:${source})$`),
    }
  })

  const options = createMemo<Item[]>(() => {
    const base = rawOptions()
    const selected = selectedValues()
    const atMax = isAtMaxCount()

    if (!local.allowCreate && !local.tokenSeparators?.length) {
      return disableUnselectedOptionsWhenAtMax(base, selected, atMax)
    }

    const existingValues = new Set(
      base
        .flatMap((item) => {
          if (Array.isArray(item.children)) {
            return item.children.map((child) => child.value ?? '')
          }

          return [item.value ?? '']
        })
        .map(getSelectedValueKey),
    )

    const newTags = createdTags()
      .filter((tag) => !existingValues.has(getSelectedValueKey(tag.value)))
      .map((tag) => tag.raw)

    return disableUnselectedOptionsWhenAtMax(newTags.concat(base), selected, atMax)
  })

  function getSelectedOptions(
    api: BaseSelectT.OptionSelectContext<Item>,
  ): NormalizedOption<Item>[] {
    const fieldValue = api.field.value()
    const values =
      local.value === undefined && Array.isArray(fieldValue)
        ? normalizeSelectedValues(
            fieldValue.filter(
              (value): value is TItem => typeof value === 'string' || typeof value === 'number',
            ),
          )
        : selectedValues()
    const resolution = resolveSelectedOptions(api.allFlatOptions(), values)

    return resolution.entries.map((entry, index) => {
      if (entry.type === 'option') {
        return entry.option
      }

      const label = String(entry.value)
      const item = { label, value: entry.value } as Item
      return {
        id: `selected:${typeof entry.value}:${encodeURIComponent(label)}:${index}`,
        value: entry.value,
        label,
        key: label,
        disabled: false,
        raw: item,
        renderItem: item,
      }
    })
  }

  function handleMultipleChange(
    options: NormalizedOption<Item>[],
    api: BaseSelectT.OptionSelectContext<Item>,
  ): void {
    if (api.field.readOnly()) {
      return
    }

    const nextValue = normalizeSelectedValues(mapNormalizedListToRawValues(options) as TItem[])
    setSelectedValues(nextValue)
    emitSelectValueChange(api.field, nextValue, local.onChange)
  }

  function appendOptionIfAllowed(
    current: NormalizedOption<Item>[],
    option: NormalizedOption<Item>,
  ): {
    next: NormalizedOption<Item>[]
    appended: boolean
    blockedByMaxCount: boolean
  } {
    if (current.some((item) => Object.is(item.value, option.value)) || option.disabled) {
      return { next: current, appended: false, blockedByMaxCount: false }
    }

    if (local.maxCount !== undefined && current.length >= local.maxCount) {
      return { next: current, appended: false, blockedByMaxCount: true }
    }

    return {
      next: [...current, option],
      appended: true,
      blockedByMaxCount: false,
    }
  }

  function addTag(
    text: string,
    api: BaseSelectT.OptionSelectContext<Item>,
  ): NormalizedOption<Item> | undefined {
    if (api.field.readOnly()) {
      return undefined
    }

    const normalized = text.trim()
    if (!normalized) {
      return undefined
    }

    const exists = findNormalizedOptionByText(api.allFlatOptions(), normalized)
    if (exists) {
      return exists
    }

    const option: NormalizedOption<Item> = {
      id: `created:${encodeURIComponent(normalized)}`,
      value: normalized,
      label: normalized,
      key: normalized,
      disabled: false,
      raw: { label: normalized, value: normalized as TItem },
      renderItem: { label: normalized, value: normalized as TItem },
    }

    setCreatedTags((prev) => [...prev, option])
    return option
  }

  function resolveOptionForInput(
    text: string,
    current: NormalizedOption<Item>[],
    api: BaseSelectT.OptionSelectContext<Item>,
  ): { option?: NormalizedOption<Item>; blockedByMaxCount: boolean } {
    const existing = findNormalizedOptionByText(api.allFlatOptions(), text)
    if (existing) {
      return { option: existing, blockedByMaxCount: false }
    }

    if (local.maxCount !== undefined && current.length >= local.maxCount) {
      return { blockedByMaxCount: true }
    }

    return { option: addTag(text, api), blockedByMaxCount: false }
  }

  function clearSelection(api: BaseSelectT.StateApi<Item>): void {
    if (api.field.readOnly()) {
      return
    }

    const nextValue: TItem[] = []
    setSelectedValues(nextValue)
    emitSelectValueChange(api.field, nextValue, local.onChange)
    api.setInputValue('')
    api.close()
    local.onClear?.()
  }

  function createTag(value: string | undefined, api: BaseSelectT.StateApi<Item>): boolean {
    if (!local.allowCreate || api.field.readOnly()) {
      return false
    }

    const text = (value ?? api.inputValue()).trim()
    if (!text) {
      return false
    }

    const current = getSelectedOptions(api)
    const resolved = resolveOptionForInput(text, current, api)
    if (resolved.blockedByMaxCount || !resolved.option) {
      return false
    }

    const appendResult = appendOptionIfAllowed(current, resolved.option)
    if (!appendResult.appended) {
      return false
    }

    handleMultipleChange(appendResult.next, api)
    api.setInputValue('')
    return true
  }

  function toggleOption(
    option: NormalizedOption<Item>,
    api: BaseSelectT.OptionSelectContext<Item>,
  ): void {
    if (option.disabled || api.field.readOnly()) {
      return
    }

    const current = getSelectedOptions(api)
    if (current.some((item) => Object.is(item.value, option.value))) {
      handleMultipleChange(
        current.filter((item) => !Object.is(item.value, option.value)),
        api,
      )
      return
    }

    const appendResult = appendOptionIfAllowed(current, option)
    if (appendResult.appended) {
      handleMultipleChange(appendResult.next, api)
    }
  }

  function handleInputChange(inputValue: string, api: BaseSelectT.StateApi<Item>): void {
    if (api.field.readOnly()) {
      return
    }

    const separatorPattern = tokenSeparatorPattern()
    if (separatorPattern) {
      if (separatorPattern.split.test(inputValue)) {
        const currentSelected = getSelectedOptions(api)
        const splitInput = inputValue.split(separatorPattern.split)
        const trailingInput = splitInput.at(-1) ?? ''
        const isTrailingTokenCompleted = separatorPattern.trailing.test(inputValue)
        const remainder = isTrailingTokenCompleted ? '' : trailingInput
        const tokens = (isTrailingTokenCompleted ? splitInput : splitInput.slice(0, -1)).filter(
          (token) => token.trim(),
        )

        let nextSelected = [...currentSelected]
        for (const token of tokens) {
          const resolved = resolveOptionForInput(token.trim(), nextSelected, api)
          if (resolved.blockedByMaxCount || !resolved.option) {
            break
          }

          const appendResult = appendOptionIfAllowed(nextSelected, resolved.option)
          if (appendResult.blockedByMaxCount) {
            break
          }
          if (appendResult.appended) {
            nextSelected = appendResult.next
          }
        }

        if (nextSelected.length !== currentSelected.length) {
          handleMultipleChange(nextSelected, api)
        }

        api.setInputValue(remainder)
        return
      }
    }

    api.setInputValue(inputValue)
  }

  function handleEnterKey(event: KeyboardEvent, api: BaseSelectT.StateApi<Item>): void {
    if (event.key !== 'Enter' || event.isComposing || isComposing() || api.field.readOnly()) {
      return
    }

    const text = api.inputValue().trim()
    if (text) {
      const match = findNormalizedOptionByText(api.allFlatOptions(), text)
      if (match) {
        const current = getSelectedOptions(api)
        const isSelected = current.some((option) => Object.is(option.value, match.value))

        if (isSelected) {
          handleMultipleChange(
            current.filter((option) => !Object.is(option.value, match.value)),
            api,
          )
          api.setInputValue('')
          event.preventDefault()
          return
        }

        const appendResult = appendOptionIfAllowed(current, match)
        if (appendResult.appended) {
          handleMultipleChange(appendResult.next, api)
          api.setInputValue('')
        }
        event.preventDefault()
        return
      }

      if (local.allowCreate) {
        createTag(text, api)
        event.preventDefault()
      }
    }
  }

  function handleSpaceKey(event: KeyboardEvent, api: BaseSelectT.StateApi<Item>): void {
    if (event.key !== ' ' && event.key !== 'Spacebar') {
      return
    }

    if (!api.isOpen() || api.field.readOnly()) {
      return
    }

    const key =
      api.highlightedKey() ?? api.visibleFlatOptions().find((option) => !option.disabled)?.id
    if (!key) {
      return
    }

    const option = api.visibleFlatOptions().find((item) => item.id === key)
    if (!option || option.disabled) {
      return
    }

    event.preventDefault()
    toggleOption(option, api)
  }

  function handleTagRemovalKey(
    event: KeyboardEvent & { currentTarget: HTMLInputElement },
    api: BaseSelectT.ControlApi<Item>,
  ): void {
    if (
      event.key !== 'Backspace' ||
      !api.isSearchable() ||
      api.field.disabled() ||
      api.field.readOnly() ||
      event.currentTarget.value !== '' ||
      event.currentTarget.selectionStart !== 0 ||
      event.currentTarget.selectionEnd !== 0
    ) {
      return
    }

    const current = getSelectedOptions(api)
    if (current.length === 0) {
      return
    }

    event.preventDefault()
    handleMultipleChange(current.slice(0, -1), api)
  }

  function renderDefaultOption(
    option: (Item & MultiSelectT.OptionRenderState) | null,
  ): JSX.Element {
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

  return (
    <BaseSelect<Item>
      {...rest}
      ref={local.ref}
      search={resolved.variants.search ?? false}

      _styles={resolved}

      options={options()}
      initialValue={initialDefaultValues}
      _isValueControlled={local.value !== undefined}
      multiple
      selectedValues={selectedValues()}
      closeOnSelect={false}
      onOptionSelect={(option, api) => {
        if (option) {
          toggleOption(option, api)
        }
      }}
      _onFormReset={(api) => {
        const value =
          local.value === undefined
            ? [...initialDefaultValues]
            : normalizeSelectedValues(local.value)
        setSelectedValues(value)
        setCreatedTags([])
        api.setInputValue('')
        api.field.setFormValue(value)
      }}
      onInputKeyDown={handleEnterKey}
      emptyRender={createEmptyRenderer({
        emptyRender: emptyRender(),
        buildProps: (ctx: BaseSelectT.StateApi<Item>) => ({
          get inputValue() {
            return ctx.inputValue()
          },
          get hasMatches() {
            return ctx.visibleFlatOptions().length > 0
          },
          get selectedValues() {
            return getSelectedOptions(ctx).map((option) => mapNormalizedToRawValue(option) as TItem)
          },
          get isAtMaxCount() {
            return isAtMaxCount()
          },
          create: (value?: string) => createTag(value, ctx),
          close: ctx.close,
        }),
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
        const selectedOptions = createMemo(() => getSelectedOptions(api))
        const visibleTagOptions = createMemo(() => {
          const currentSelectedOptions = selectedOptions()
          if (local.maxTagCount === undefined) {
            return currentSelectedOptions
          }
          return currentSelectedOptions.slice(0, local.maxTagCount)
        })
        const hiddenTagCount = createMemo(() =>
          local.maxTagCount === undefined
            ? 0
            : Math.max(0, selectedOptions().length - local.maxTagCount),
        )
        const isActionLoading = createMemo(() => Boolean(local.loading))
        const isClearAction = createMemo(() =>
          Boolean(!isActionLoading() && local.allowClear && selectedOptions().length > 0),
        )

        const controlResolved = resolved

        return (
          <div
            data-slot="control"
            data-disabled={api.field.disabled() ? '' : undefined}
            data-invalid={api.field.invalid() ? '' : undefined}
            data-required={api.field.required() ? '' : undefined}
            data-readonly={api.field.readOnly() ? '' : undefined}
            {...controlResolved.slot('control')}
            {...api.controlProps()}
          >
            <Show when={leadingIcon()}>
              {(icon) => (
                <Icon name={icon()} slotName="leading" {...controlResolved.slot('leading')} />
              )}
            </Show>

            <div data-slot="tagsContainer" {...controlResolved.slot('tagsContainer')}>
              <For each={visibleTagOptions()}>
                {(option) => {
                  const onClose = () => toggleOption(option, api)
                  return (
                    <Show
                      when={tagRender() === undefined}
                      fallback={renderComponentOrElement(tagRender(), {
                        option: option.raw,
                        onClose,
                      })}
                    >
                      <span
                        data-slot="tag"
                        title={option.key}
                        {...controlResolved.slot('tag')}
                        onPointerDown={(event: PointerEvent) => {
                          event.preventDefault()
                          api.focusInput()
                        }}
                      >
                        <span data-slot="label">{option.label}</span>

                        <button
                          type="button"
                          data-slot="tagRemove"
                          aria-label={`Remove ${option.key}`}
                          style={controlResolved.slot('tagRemove').style}
                          disabled={api.field.disabled() || api.field.readOnly()}
                          tabIndex={-1}
                          class={controlResolved.slot('tagRemove').class}
                          onPointerDown={(event) => {
                            if (api.field.disabled() || api.field.readOnly()) {
                              return
                            }
                            event.preventDefault()
                            event.stopPropagation()
                            api.focusInput()
                          }}
                          onClick={(event) => {
                            if (api.field.disabled() || api.field.readOnly()) {
                              return
                            }
                            event.stopPropagation()
                            onClose()
                          }}
                        >
                          <Icon name={closeIcon()} />
                        </button>
                      </span>
                    </Show>
                  )
                }}
              </For>

              <Show when={hiddenTagCount() > 0}>
                <span data-slot="tagOverflow" {...controlResolved.slot('tagOverflow')}>
                  +{hiddenTagCount()}
                </span>
              </Show>

              <input
                ref={(element) => {
                  callRef(api.inputProps().ref, element)
                  callRef(local.inputRef, element)
                }}
                data-slot="input"
                data-searchable={api.isSearchable() ? '' : undefined}
                {...controlResolved.slot('input')}
                {...api.inputProps()}
                placeholder={selectedOptions().length > 0 ? '' : local.placeholder}
                readonly={!api.isSearchable() || api.field.readOnly() ? true : undefined}
                tabIndex={api.isSearchable() ? undefined : -1}
                onInput={(event) => {
                  if (api.field.readOnly()) {
                    event.currentTarget.value = api.inputValue()
                  } else if (event.isComposing || isComposing()) {
                    api.setInputValue(event.currentTarget.value)
                  } else {
                    handleInputChange(event.currentTarget.value, api)
                  }
                  event.currentTarget.value = api.inputValue()
                  api.onInput(event)
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={(event) => {
                  setIsComposing(false)
                  if (!api.field.readOnly()) {
                    handleInputChange(event.currentTarget.value, api)
                  }
                  event.currentTarget.value = api.inputValue()
                }}
                onKeyDown={(event) => {
                  handleTagRemovalKey(event, api)
                  if (event.key === ' ' || event.key === 'Spacebar') {
                    event.stopPropagation()
                  }
                  handleSpaceKey(event, api)
                  if (!event.defaultPrevented) {
                    api.onKeyDown(event)
                  }
                }}
              />
            </div>

            <button
              type="button"
              data-slot={isClearAction() ? 'clear' : 'trigger'}
              aria-label={
                isActionLoading()
                  ? 'Loading'
                  : isClearAction()
                    ? 'Clear selection'
                    : 'Open dropdown menu'
              }
              aria-busy={isActionLoading() || undefined}
              data-loading={isActionLoading() ? '' : undefined}
              tabIndex={-1}
              class={controlResolved.slot(isClearAction() ? 'clear' : 'trigger').class}
              style={
                isClearAction()
                  ? controlResolved.slot('clear').style
                  : controlResolved.slot('trigger').style
              }
              disabled={api.field.disabled() || api.field.readOnly() || isActionLoading()}
              onPointerDown={(event) => {
                if (api.field.disabled() || api.field.readOnly() || isActionLoading()) {
                  return
                }
                event.preventDefault()
                event.stopPropagation()
                api.focusInput()
              }}
              onClick={(event) => {
                event.stopPropagation()

                if (api.field.disabled() || api.field.readOnly() || isActionLoading()) {
                  return
                }

                if (isClearAction()) {
                  clearSelection(api)
                  return
                }

                api.toggle()
              }}
            >
              <Icon
                name={
                  isActionLoading()
                    ? (loadingIcon() ?? 'icon-loading')
                    : isClearAction()
                      ? (closeIcon() ?? 'icon-close')
                      : (trailingIcon() ?? 'icon-chevron-down')
                }
                data-loading={isActionLoading() ? '' : undefined}
              />
            </button>
          </div>
        )
      }}
    </BaseSelect>
  )
}
