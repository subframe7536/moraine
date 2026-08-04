import type { Component, JSX } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'

import { Badge } from '../../elements/badge/index.ts'
import type { BadgeProps } from '../../elements/badge/index.ts'
import { IconButtonInner } from '../../elements/icon/icon-button-inner.tsx'
import { Icon } from '../../elements/icon/index.ts'
import type { IconT } from '../../elements/icon/index.ts'
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
} from '../form-field/form-options.ts'

import { BaseSelect } from './base-select.tsx'
import type { BaseSelectT } from './base-select.tsx'
import type { SelectControlVariantProps } from './select.class.ts'
import {
  selectControlVariants,
  selectInputVariants,
  selectLeadingIconVariants,
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
    /** Badge representing one selected value. */
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
    /** Variant for the selected tags. */
    tagVariant?: BadgeProps['variant']
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

  export type Props<TItem extends Value = Value> = BaseProps<'div', Base<TItem>, Variant, Slot>
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
>(items: TItem[], selectedValueSet: Set<string>, isAtMaxCount: boolean): TItem[] {
  if (!isAtMaxCount) {
    return items
  }

  return items.map((item) => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      return {
        ...item,
        children: disableUnselectedOptionsWhenAtMax(item.children, selectedValueSet, true),
      }
    }

    if (item.disabled || selectedValueSet.has(String(item.value ?? ''))) {
      return item
    }

    return {
      ...item,
      disabled: true,
    }
  })
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Dropdown select component with search, multi-select, and custom item rendering. */
export function MultiSelect<TItem extends MultiSelectT.Value = MultiSelectT.Value>(
  props: MultiSelectProps<TItem>,
): JSX.Element {
  type Item = MultiSelectT.Item<TItem>

  const [selectedValues, setSelectedValues] = useControllableValue<TItem[]>({
    value: () => props.value,
    defaultValue: () => props.defaultValue ?? [],
  })
  const [createdTags, setCreatedTags] = createSignal<NormalizedOption<Item>[]>([])

  const selectedValueSet = createMemo(
    () => new Set((selectedValues() ?? []).map((value) => String(value))),
  )

  const isAtMaxCount = createMemo(() =>
    props.maxCount === undefined ? false : selectedValueSet().size >= props.maxCount,
  )
  const tokenSeparatorRegex = createMemo(() => {
    const separators = props.tokenSeparators?.filter((separator) => separator.length > 0) ?? []
    if (separators.length === 0) {
      return undefined
    }

    return new RegExp(`[${escapeRegex(separators.join(''))}]`)
  })

  const options = createMemo<Item[]>(() => {
    const base = props.options ?? []
    const selected = selectedValueSet()
    const atMax = isAtMaxCount()

    if (!props.allowCreate && !props.tokenSeparators?.length) {
      return disableUnselectedOptionsWhenAtMax(base, selected, atMax)
    }

    const existingValues = new Set(
      base.flatMap((item) => {
        if (Array.isArray(item.children)) {
          return item.children.map((child) => String(child.value ?? ''))
        }

        return [String(item.value ?? '')]
      }),
    )

    const newTags = createdTags()
      .filter((tag) => !existingValues.has(tag.value))
      .map((tag) => tag.raw)

    return disableUnselectedOptionsWhenAtMax([...newTags, ...base], selected, atMax)
  })

  function getSelectedOptions(
    api: BaseSelectT.OptionSelectContext<Item>,
  ): NormalizedOption<Item>[] {
    return api.allFlatOptions().filter((option) => selectedValueSet().has(option.value))
  }

  function handleMultipleChange(
    options: NormalizedOption<Item>[],
    api: BaseSelectT.OptionSelectContext<Item>,
  ): void {
    const nextValue = mapNormalizedListToRawValues(options) as TItem[]
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
    if (current.some((item) => item.value === option.value) || option.disabled) {
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
      value: normalized,
      label: normalized,
      key: normalized,
      disabled: false,
      raw: { label: normalized, value: normalized as TItem } as Item,
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
    const resetValue = (props.defaultValue ?? []) as TItem[]
    setSelectedValues(resetValue)
    emitSelectValueChange(api.field, resetValue, props.onChange)
    api.setInputValue('')
    api.close()
    props.onClear?.()
  }

  function createTag(value: string | undefined, api: BaseSelectT.StateApi<Item>): boolean {
    if (!props.allowCreate) {
      return false
    }

    const text = String(value ?? api.inputValue()).trim()
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
    if (current.some((item) => item.value === option.value)) {
      handleMultipleChange(
        current.filter((item) => item.value !== option.value),
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
    const separatorRegex = tokenSeparatorRegex()
    if (separatorRegex) {
      if (separatorRegex.test(inputValue)) {
        const currentSelected = getSelectedOptions(api)
        const trailingInput = inputValue.split(separatorRegex).at(-1) ?? ''
        const isTrailingTokenCompleted = separatorRegex.test(inputValue.at(-1) ?? '')
        const remainder = isTrailingTokenCompleted ? '' : trailingInput
        const tokens = (
          isTrailingTokenCompleted
            ? inputValue.split(separatorRegex)
            : inputValue.split(separatorRegex).slice(0, -1)
        ).filter((token) => token.trim())

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
    if (event.key !== 'Enter') {
      return
    }

    const text = api.inputValue().trim()
    if (text) {
      const match = findNormalizedOptionByText(api.allFlatOptions(), text)
      if (match) {
        const current = getSelectedOptions(api)
        const isSelected = current.some((option) => option.value === match.value)

        if (isSelected) {
          handleMultipleChange(
            current.filter((option) => option.value !== match.value),
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
      api.highlightedKey() ?? api.visibleFlatOptions().find((option) => !option.disabled)?.key
    if (!key) {
      return
    }

    const option = api.visibleFlatOptions().find((item) => item.key === key)
    if (!option || option.disabled) {
      return
    }

    event.preventDefault()
    toggleOption(option, api)
  }

  function renderDefaultOption(
    option: (Item & MultiSelectT.OptionRenderState) | null,
  ): JSX.Element {
    return renderDefaultSelectOption({
      option,
      classes: props.classes,
      styles: props.styles,
      labelRender: props.labelRender,
    })
  }

  return (
    <BaseSelect<Item>
      {...props}
      options={options()}
      initialValue={props.defaultValue ?? []}
      multiple
      selectedValues={selectedValues()}
      closeOnSelect={false}
      onOptionSelect={toggleOption}
      onInputKeyDown={handleEnterKey}
      emptyRender={createEmptyRenderer({
        emptyRender: props.emptyRender,
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
          when={props.optionRender !== undefined}
          fallback={renderDefaultOption(renderProps.option)}
        >
          {renderComponentOrElement(props.optionRender, {
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
        const isClearAction = createMemo(() =>
          Boolean(props.allowClear && selectedOptions().length > 0),
        )
        const isActionLoading = createMemo(() => Boolean(props.loading && !isClearAction()))

        return (
          <div
            data-slot="control"
            data-disabled={api.field.disabled() ? '' : undefined}
            data-invalid={api.field.invalid() ? '' : undefined}
            data-required={props.required ? '' : undefined}
            style={props.styles?.control}
            class={selectControlVariants(
              { variant: props.variant, search: api.isSearchable() },
              props.classes?.control,
            )}
            {...api.controlProps()}
          >
            <Show when={props.leadingIcon}>
              {(icon) => (
                <Icon
                  name={icon()}
                  size={api.field.size()}
                  slotName="leading"
                  style={props.styles?.leading}
                  class={selectLeadingIconVariants(
                    { size: api.field.size() },
                    props.classes?.leading,
                  )}
                />
              )}
            </Show>

            <div
              data-slot="tagsContainer"
              style={props.styles?.tagsContainer}
              class={cn(
                'p-1.5 flex flex-1 flex-wrap gap-1 max-w-full min-w-0 select-none items-center',
                props.classes?.tagsContainer,
              )}
            >
              <For each={visibleTagOptions()}>
                {(option) => {
                  const onClose = () => toggleOption(option, api)
                  return (
                    <Show
                      when={props.tagRender === undefined}
                      fallback={renderComponentOrElement(props.tagRender, {
                        option: option.raw,
                        onClose,
                      })}
                    >
                      <Badge
                        data-slot="tag"
                        size={api.field.size()}
                        title={option.key}
                        variant={props.tagVariant}
                        style={props.styles?.tag}
                        class={cn('pe-0 max-w-50%', props.classes?.tag)}
                        classes={{
                          trailing: [
                            'rounded hover:bg-accent-hover active:bg-accent-active scale-85',
                            props.classes?.tagRemove,
                          ],
                        }}
                        trailing={props.closeIcon ?? 'icon-close'}
                        onTrailingClick={(event) => {
                          event.stopPropagation()
                          onClose()
                        }}
                      >
                        {option.label}
                      </Badge>
                    </Show>
                  )
                }}
              </For>

              <Show when={hiddenTagCount() > 0}>
                <span
                  data-slot="tagOverflow"
                  style={props.styles?.tagOverflow}
                  class={cn(
                    'text-xs text-muted-foreground px-1 flex items-center',
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
                  handleInputChange(event.currentTarget.value, api)
                  event.currentTarget.value = api.inputValue()
                  api.onInput(event)
                }}
                onKeyDown={(event) => {
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

            <IconButtonInner
              name={
                isActionLoading()
                  ? (props.loadingIcon ?? 'icon-loading')
                  : isClearAction()
                    ? (props.closeIcon ?? 'icon-close')
                    : (props.trailingIcon ?? 'icon-chevron-down')
              }
              data-slot={isClearAction() ? 'clear' : 'trigger'}
              aria-label={isClearAction() ? 'Clear selection' : 'Open dropdown menu'}
              aria-busy={isActionLoading() || undefined}
              data-loading={isActionLoading() ? '' : undefined}
              tabIndex={-1}
              classes={{
                root: [
                  'me-2 transition-colors hover:bg-muted-hover active:bg-muted-active',
                  isActionLoading() ? 'cursor-wait' : 'cursor-pointer',
                  props.classes?.trigger,
                  isClearAction() ? props.classes?.clear : undefined,
                ],
                icon: 'text-muted-foreground opacity-80',
              }}
              styles={{
                root: isClearAction() ? props.styles?.clear : props.styles?.trigger,
              }}
              disabled={api.field.disabled()}
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                api.focusInput()
              }}
              onClick={(event) => {
                event.stopPropagation()

                if (props.loading && !isClearAction()) {
                  return
                }

                if (isClearAction()) {
                  clearSelection(api)
                  return
                }

                api.toggle()
              }}
            />
          </div>
        )
      }}
    </BaseSelect>
  )
}
