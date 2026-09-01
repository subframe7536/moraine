import type { Component, JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, splitProps, untrack } from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
import { EFFECT_LOADING_CLASS, LABEL_TRUNCATE_CLASS } from '../../shared/cva-common.class.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { cn } from '../../shared/utils.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.ts'

import { BaseSelect } from './base-select.tsx'
import type { BaseSelectT } from './base-select.tsx'
import type { SelectControlVariantProps } from './select.class.ts'
import {
  MULTI_SELECT_CLEAR_BUTTON_CLASS,
  MULTI_SELECT_TAG_DELETE_CLASS,
  MULTI_SELECT_TAGS_WRAPPER_CLASS,
  SELECT_ACTION_ICON_CLASS,
  SELECT_CLEAR_ACTION_CLASS,
  SELECT_CONTROL_POINTER_CLASS,
  SELECT_CONTROL_SEARCH_CLASS,
  SELECT_LEADING_ICON_CLASS,
  multiSelectTagOverflowVariants,
  multiSelectTagVariants,
  selectControlVariants,
  selectInputVariants,
} from './select.class.ts'
import {
  createEmptyRenderer,
  emitSelectValueChange,
  findNormalizedOptionByText,
  mapNormalizedListToRawValues,
  mapNormalizedToRawValue,
  renderDefaultSelectOption,
} from './shared/index.ts'
import type { NormalizedOption } from './shared/index.ts'

export namespace MultiSelectT {
  export type Value = string | number

  export type OptionRenderState = BaseSelectT.OptionRenderState
  export type VirtualEntry<TItem extends Value = Value> = BaseSelectT.VirtualEntry<Item<TItem>>
  export type VirtualRenderProps<TItem extends Value = Value> = BaseSelectT.VirtualRenderProps<
    Item<TItem>
  >
  export interface ControlSlot<T = unknown> {
    /** Multi-select control that displays selected tags and opens the popup. */
    control?: T
    /** Search input used to filter or add selections. */
    input?: T
    /** Icon shown before the selected tags and search input. */
    leading?: T
    /** Button region that toggles the multi-select popup. */
    trigger?: T
    /** Button used to clear all selected values. */
    clear?: T
    /** Wrapper that lays out selected value tags inside the control. */
    tagsContainer?: T
    /** Selected value tag. */
    tag?: T
    /** Button used to remove one selected value. */
    tagRemove?: T
    /** Counter shown when selected tags exceed the visible limit. */
    tagOverflow?: T
  }
  export interface OptionSlot<T = unknown> {
    /** Message shown when filtering leaves no selectable options. */
    empty?: T
    /** Primary label text inside an option row. */
    itemLabel?: T
    /** Supporting description text inside an option row. */
    itemDescription?: T
    /** Trailing region inside an option row, usually for selection state or custom content. */
    itemTrailing?: T
  }

  export interface OptionRenderProps<TItem extends Value = Value> {
    /** Option and interaction state, or null when no option matches. */
    option: (Item<TItem> & OptionRenderState) | null
  }

  export interface LabelRenderProps<TItem extends Value = Value> {
    /** Option whose label is being rendered. */
    option: Item<TItem>
  }

  export interface TagRenderProps<TItem extends Value = Value> {
    /** Selected option represented by the tag. */
    option: Item<TItem>
    /** Removes this option from the selection. */
    onClose: () => void
  }

  export interface EmptyRenderProps<TItem extends Value = Value> {
    /** Current input/search text. */
    inputValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected values. */
    selectedValues: TItem[]
    /** Whether the maximum selection count has been reached. */
    isAtMaxCount: boolean
    /** Create a new tag (requires `allowCreate`). Returns true if successfully created. */
    create: (value?: string) => boolean
    /** Close the dropdown menu. */
    close: () => void
  }

  export interface Slot<T = unknown> extends BaseSelectT.Slot<T>, ControlSlot<T>, OptionSlot<T> {}

  export type Variant = SelectControlVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item<Val extends Value = Value> extends BaseSelectT.Item<Val> {}

  export interface Base<TItem extends Value = Value>
    extends
      Omit<
        BaseSelectT.Base<Item<TItem>>,
        | 'children'
        | 'closeOnSelect'
        | 'emptyRender'
        | 'initialValue'
        | 'onInputKeyDown'
        | '_onFormReset'
        | '_isValueControlled'
        | 'onOptionSelect'
        | 'optionRender'
        | 'selectedValues'
        | 'multiple'
        | 'tabSelectionBehavior'
        | 'virtualRender'
        | 'scrollToItem'
      >,
      FormIdentityOptions,
      FormValueOptions<TItem[]>,
      FormRequiredOption,
      FormDisableOption {
    /** Called when the selection changes. */
    onChange?: (value: NoInfer<TItem[]>) => void
    /** Renders flattened group labels and options through a virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted option into view using its flattened entry index. */
    scrollToItem?: (item: Item<TItem>, entryIndex: number) => void
    /**
     * Show a clear button when a value is selected.
     * @default false
     */
    allowClear?: boolean
    /** Called when clear is triggered. */
    onClear?: () => void
    /** Characters that split input into tokens and immediately select them. */
    tokenSeparators?: string[]
    /** Allow creating new tags on Enter when no match is found. */
    allowCreate?: boolean
    /** Maximum number of selected values (multiple/tags). */
    maxCount?: number
    /** Maximum visible tags before showing +N (visual only). */
    maxTagCount?: number
    /** Custom renderer for each option in the dropdown. Passes `null` for empty state. */
    optionRender?: ComponentOrElement<OptionRenderProps<TItem>>
    /** Custom renderer for each selected tag (multiple/tags). */
    tagRender?: ComponentOrElement<TagRenderProps<TItem>>
    /** Custom renderer for the option label text. */
    labelRender?: ComponentOrElement<LabelRenderProps<TItem>>
    /** Custom renderer for the empty state when current filtered result has no matches. */
    emptyRender?: ComponentOrElement<EmptyRenderProps<TItem>>
    /**
     * Placeholder text shown when no value is selected.
     * @default ''
     */
    placeholder?: string
    /** Whether the select is in a loading state. */
    loading?: boolean
    /**
     * Icon shown during loading state.
     * @default 'icon-loading'
     */
    loadingIcon?: IconT.Name
    /** Icon shown before the input/value area. */
    leadingIcon?: IconT.Name
    /**
     * Icon used when the action button opens the dropdown.
     * @default 'icon-chevron-down'
     */
    trailingIcon?: IconT.Name
    /**
     * Icon used when the action button clears the selection.
     * Tag remove buttons keep using this icon as well.
     */
    closeIcon?: IconT.Name
  }

  export type Props<TItem extends Value = Value> = BaseProps<
    'div',
    Base<TItem>,
    Variant,
    Classes,
    Styles
  >
}

export interface MultiSelectProps<
  TItem extends MultiSelectT.Value = MultiSelectT.Value,
> extends MultiSelectT.Props<TItem> {}

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

  return items.map((item) => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      return {
        ...item,
        children: disableUnselectedOptionsWhenAtMax(item.children, selectedValues, true),
      }
    }

    if (
      item.disabled ||
      selectedValues.some((selectedValue) => Object.is(selectedValue, item.value ?? ''))
    ) {
      return item
    }

    return {
      ...item,
      disabled: true,
    }
  })
}

function normalizeSelectedValues<TValue extends string | number>(
  values: readonly TValue[] | undefined,
): TValue[] {
  const result: TValue[] = []

  for (const value of values ?? []) {
    if (!result.some((current) => Object.is(current, value))) {
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
  type Item = MultiSelectT.Item<TItem>
  const [jsxProps, baseProps] = splitProps(props, [
    'optionRender',
    'tagRender',
    'labelRender',
    'emptyRender',
    'leadingIcon',
    'loadingIcon',
    'trailingIcon',
    'closeIcon',
  ])
  const initialDefaultValues = untrack(() => normalizeSelectedValues(props.defaultValue))
  const optionRender = createMemo(() => jsxProps.optionRender)
  const tagRender = createMemo(() => jsxProps.tagRender)
  const labelRender = createMemo(() => jsxProps.labelRender)
  const emptyRender = createMemo(() => jsxProps.emptyRender)
  const leadingIcon = createMemo(() => jsxProps.leadingIcon)
  const loadingIcon = createMemo(() => jsxProps.loadingIcon)
  const trailingIcon = createMemo(() => jsxProps.trailingIcon)
  const closeIcon = createMemo(() => jsxProps.closeIcon || 'icon-close')
  const rawOptions = createMemo(() => props.options ?? [])
  const [rawSelectedValues, setSelectedValues] = useControllableValue<TItem[]>({
    value: () => props.value,
    defaultValue: () => initialDefaultValues,
  })
  const [createdTags, setCreatedTags] = createSignal<NormalizedOption<Item>[]>([])
  const [isComposing, setIsComposing] = createSignal(false)
  const selectedValues = createMemo(() => normalizeSelectedValues(rawSelectedValues() ?? []))

  const isAtMaxCount = createMemo(() =>
    props.maxCount === undefined ? false : selectedValues().length >= props.maxCount,
  )
  const tokenSeparatorPattern = createMemo(() => {
    const separators = [
      ...new Set(props.tokenSeparators?.filter((separator) => separator.length > 0) ?? []),
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

    if (!props.allowCreate && !props.tokenSeparators?.length) {
      return disableUnselectedOptionsWhenAtMax(base, selected, atMax)
    }

    const existingValues = base.flatMap((item) => {
      if (Array.isArray(item.children)) {
        return item.children.map((child) => child.value ?? '')
      }

      return [item.value ?? '']
    })

    const newTags = createdTags()
      .filter((tag) => !existingValues.some((existingValue) => Object.is(existingValue, tag.value)))
      .map((tag) => tag.raw)

    return disableUnselectedOptionsWhenAtMax([...newTags, ...base], selected, atMax)
  })

  function getSelectedOptions(
    api: BaseSelectT.OptionSelectContext<Item>,
  ): NormalizedOption<Item>[] {
    const fieldValue = api.field.value()
    const values =
      props.value === undefined && Array.isArray(fieldValue)
        ? normalizeSelectedValues(
            fieldValue.filter(
              (value): value is TItem => typeof value === 'string' || typeof value === 'number',
            ),
          )
        : selectedValues()
    const usedOptionIds = new Set<string>()

    return values.map((value, index) => {
      const option = api
        .allFlatOptions()
        .find((candidate) => !usedOptionIds.has(candidate.id) && Object.is(candidate.value, value))
      if (option) {
        usedOptionIds.add(option.id)
        return option
      }

      const label = String(value)
      const item = { label, value } as Item
      return {
        id: `selected:${typeof value}:${encodeURIComponent(label)}:${index}`,
        value,
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
    const nextValue = normalizeSelectedValues(mapNormalizedListToRawValues(options) as TItem[])
    setSelectedValues(nextValue)
    emitSelectValueChange(api.field, nextValue, props.onChange)
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

    if (props.maxCount !== undefined && current.length >= props.maxCount) {
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

    if (props.maxCount !== undefined && current.length >= props.maxCount) {
      return { blockedByMaxCount: true }
    }

    return { option: addTag(text, api), blockedByMaxCount: false }
  }

  function clearSelection(api: BaseSelectT.StateApi<Item>): void {
    const nextValue: TItem[] = []
    setSelectedValues(nextValue)
    emitSelectValueChange(api.field, nextValue, props.onChange)
    api.setInputValue('')
    api.close()
    props.onClear?.()
  }

  function createTag(value: string | undefined, api: BaseSelectT.StateApi<Item>): boolean {
    if (!props.allowCreate) {
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
    if (option.disabled) {
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
    if (event.key !== 'Enter' || event.isComposing || isComposing()) {
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

      if (props.allowCreate) {
        createTag(text, api)
        event.preventDefault()
      }
    }
  }

  function handleSpaceKey(event: KeyboardEvent, api: BaseSelectT.StateApi<Item>): void {
    if (event.key !== ' ' && event.key !== 'Spacebar') {
      return
    }

    if (!api.isOpen()) {
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
    return renderDefaultSelectOption({
      option,
      classes: props.classes,
      styles: props.styles,
      labelRender: labelRender(),
    })
  }

  return (
    <BaseSelect<Item>
      {...baseProps}
      options={options()}
      initialValue={initialDefaultValues}
      _isValueControlled={props.value !== undefined}
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
          props.value === undefined
            ? [...initialDefaultValues]
            : normalizeSelectedValues(props.value)
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
          if (props.maxTagCount === undefined) {
            return currentSelectedOptions
          }
          return currentSelectedOptions.slice(0, props.maxTagCount)
        })
        const hiddenTagCount = createMemo(() =>
          props.maxTagCount === undefined
            ? 0
            : Math.max(0, selectedOptions().length - props.maxTagCount),
        )
        const isActionLoading = createMemo(() => Boolean(props.loading))
        const isClearAction = createMemo(() =>
          Boolean(!isActionLoading() && props.allowClear && selectedOptions().length > 0),
        )

        return (
          <div
            data-slot="control"
            data-disabled={api.field.disabled() ? '' : undefined}
            data-invalid={api.field.invalid() ? '' : undefined}
            data-required={api.field.required() ? '' : undefined}
            style={props.styles?.control}
            class={selectControlVariants(
              {
                variant: props.variant,
                size: api.field.size(),
                mode: 'multi',
              },
              api.isSearchable() ? SELECT_CONTROL_SEARCH_CLASS : SELECT_CONTROL_POINTER_CLASS,
              props.classes?.control,
            )}
            {...api.controlProps()}
          >
            <Show when={leadingIcon()}>
              {(icon) => (
                <Icon
                  name={icon()}
                  slotName="leading"
                  style={props.styles?.leading}
                  class={cn(SELECT_LEADING_ICON_CLASS, props.classes?.leading)}
                />
              )}
            </Show>

            <div
              data-slot="tagsContainer"
              style={props.styles?.tagsContainer}
              class={cn(MULTI_SELECT_TAGS_WRAPPER_CLASS, props.classes?.tagsContainer)}
            >
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
                        style={props.styles?.tag}
                        class={multiSelectTagVariants(
                          { size: api.field.size() },
                          props.classes?.tag,
                        )}
                        onPointerDown={(event: PointerEvent) => {
                          event.preventDefault()
                          api.focusInput()
                        }}
                      >
                        <span data-slot="label" class={LABEL_TRUNCATE_CLASS}>
                          {option.label}
                        </span>

                        <button
                          type="button"
                          data-slot="tagRemove"
                          aria-label={`Remove ${option.key}`}
                          style={props.styles?.tagRemove}
                          disabled={api.field.disabled()}
                          tabIndex={-1}
                          class={cn(
                            MULTI_SELECT_TAG_DELETE_CLASS,
                            api.field.disabled() ? 'pointer-events-none' : 'cursor-pointer',
                            props.classes?.tagRemove,
                          )}
                          onPointerDown={(event) => {
                            if (api.field.disabled()) {
                              return
                            }
                            event.preventDefault()
                            event.stopPropagation()
                            api.focusInput()
                          }}
                          onClick={(event) => {
                            if (api.field.disabled()) {
                              return
                            }
                            event.stopPropagation()
                            onClose()
                          }}
                        >
                          <Icon
                            name={closeIcon()}
                            class={cn('opacity-50', !api.field.disabled() && 'hover:opacity-100')}
                          />
                        </button>
                      </span>
                    </Show>
                  )
                }}
              </For>

              <Show when={hiddenTagCount() > 0}>
                <span
                  data-slot="tagOverflow"
                  style={props.styles?.tagOverflow}
                  class={multiSelectTagOverflowVariants(
                    { size: api.field.size() },
                    props.classes?.tagOverflow,
                  )}
                >
                  +{hiddenTagCount()}
                </span>
              </Show>

              <input
                data-slot="input"
                style={props.styles?.input}
                class={selectInputVariants(
                  {
                    mode: 'multi',
                    size: api.field.size(),
                  },
                  !api.isSearchable() && 'cursor-pointer',
                  props.classes?.input,
                )}
                {...api.inputProps()}
                placeholder={selectedOptions().length > 0 ? '' : props.placeholder}
                readOnly={!api.isSearchable() ? true : undefined}
                tabIndex={api.isSearchable() ? undefined : -1}
                onInput={(event) => {
                  if (event.isComposing || isComposing()) {
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
                  handleInputChange(event.currentTarget.value, api)
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
              class={cn(
                MULTI_SELECT_CLEAR_BUTTON_CLASS,
                isClearAction() ? SELECT_CLEAR_ACTION_CLASS : undefined,
                isActionLoading()
                  ? 'cursor-wait pointer-events-none'
                  : api.field.disabled()
                    ? 'pointer-events-none'
                    : 'cursor-pointer',
                props.classes?.trigger,
                isClearAction() ? props.classes?.clear : undefined,
              )}
              style={isClearAction() ? props.styles?.clear : props.styles?.trigger}
              disabled={api.field.disabled() || isActionLoading()}
              onPointerDown={(event) => {
                if (api.field.disabled() || isActionLoading()) {
                  return
                }
                event.preventDefault()
                event.stopPropagation()
                api.focusInput()
              }}
              onClick={(event) => {
                event.stopPropagation()

                if (api.field.disabled() || isActionLoading()) {
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
                class={cn(SELECT_ACTION_ICON_CLASS, isActionLoading() && EFFECT_LOADING_CLASS)}
                data-loading={isActionLoading() ? '' : undefined}
              />
            </button>
          </div>
        )
      }}
    </BaseSelect>
  )
}
