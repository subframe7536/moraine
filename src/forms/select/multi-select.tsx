import { Combobox, useComboboxContext } from '@kobalte/core/combobox'
import type { ComboboxRootProps } from '@kobalte/core/combobox'
import type { JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import { Badge } from '../../elements/badge'
import type { BadgeProps } from '../../elements/badge'
import { Icon } from '../../elements/icon'
import type { IconT } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { cn } from '../../shared/utils'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'

import type { SelectControlVariantProps } from './select.class'
import {
  selectClearVariants,
  selectControlVariants,
  selectInputVariants,
  selectLeadingIconVariants,
  selectTriggerIconVariants,
} from './select.class'
import {
  createComboboxInputHandlers,
  emitSelectValueChange,
  createFindOptionByValue,
  createSelectComponents,
  flattenOptions,
  mapNormalizedListToRawValues,
  mapNormalizedToRawValue,
  MULTI_SELECT_SPLIT_KEYS,
  normalizeOptions,
  RenderSelectComboboxFrame,
  RenderSelectClearButton,
  RenderSelectEmptyNode,
  SELECT_COMMON_COMBOBOX_PROPS,
  SELECT_COMMON_DEFAULT_PROPS,
  RenderSelectTriggerButton,
  syncSelectSearchInputValue,
  useSelectField,
  useSelectFilter,
  useSelectMenuControl,
} from './shared'
import type {
  NormalizedGroup as SharedNormalizedGroup,
  NormalizedOption as SharedNormalizedOption,
  SelectControlState as SharedSelectControlState,
} from './shared'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export namespace MultiSelectT {
  export type Value = string | number

  export interface OptionRenderState {
    /** Whether the option is currently selected. */
    isSelected: boolean
    /** Whether the option is currently highlighted/focused. */
    isHighlighted: boolean
    /** Whether the option is disabled. */
    isDisabled: boolean
  }
  export interface EmptyRenderContext {
    /** Current input/search text. */
    inputValue: string
    /** Whether the current filter has any matches. */
    hasMatches: boolean
    /** Currently selected values. */
    selectedValues: Value[]
    /** Whether the maximum selection count has been reached. */
    isAtMaxCount: boolean
    /** Create a new tag (requires `allowCreate`). Returns true if successfully created. */
    create: (value?: string) => boolean
    /** Close the dropdown menu. */
    close: () => void
  }

  export type Slot =
    | 'root'
    | 'control'
    | 'input'
    | 'leading'
    | 'trigger'
    | 'clear'
    | 'content'
    | 'listbox'
    | 'item'
    | 'itemTrailing'
    | 'itemLabel'
    | 'itemDescription'
    | 'group'
    | 'label'
    | 'tagsContainer'
    | 'tag'
    | 'tagRemove'
    | 'tagOverflow'
    | 'empty'

  export type Variant = SelectControlVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = ComboboxRootProps<NormalizedOption, NormalizedGroup>

  export interface Items {
    /** Label to display for the option. */
    label?: string | JSX.Element
    /** Text key used for filtering and matching; set this when `label` is not a string. */
    key?: string
    /** Value of the option. */
    value?: Value
    /** Whether the option is disabled. */
    disabled?: boolean
    /** Description shown below the label. */
    description?: string | JSX.Element
    /** Icon shown next to the label. */
    icon?: IconT.Name
    /** One-layer child options for grouped select. */
    children?: Items[]
  }

  /**
   * Base props for the MultiSelect component.
   */
  export interface Base
    extends
      FormIdentityOptions,
      FormValueOptions<MultiSelectT.Value[]>,
      FormRequiredOption,
      FormDisableOption {
    /** Available options. */
    options?: Items[]

    /** Called when the selection changes. */
    onChange?: (value: MultiSelectT.Value[]) => void

    /** Enable search input. Defaults to `false`. */
    search?: boolean
    /** Controlled search value. */
    searchValue?: string
    /** Default search value. */
    defaultSearchValue?: string
    /** Called when the search input changes. */
    onSearch?: (value: string) => void
    /** Maximum search text length applied on final commit. */
    searchMaxLength?: number
    /**
     * Filter function or boolean. `false` disables filtering.
     * @default true
     */
    filterOption?:
      | boolean
      | 'startsWith'
      | 'endsWith'
      | 'contains'
      | ((inputValue: string, option: MultiSelectT.Items) => boolean)
    /**
     * Controls whether clicking the control opens the menu.
     * @default 'control'
     */
    openOnClick?: 'control' | 'trigger'

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

    /** Custom renderer for each option in the dropdown. */
    optionRender?: (option: MultiSelectT.Items & OptionRenderState) => JSX.Element
    /** Custom renderer for each selected tag (multiple/tags). */
    tagRender?: (option: MultiSelectT.Items & { onClose: () => void }) => JSX.Element
    /** Custom renderer for the option label text. */
    labelRender?: (option: MultiSelectT.Items) => JSX.Element
    /** Custom renderer for the empty state when current filtered result has no matches. */
    emptyRender?: string | ((context: EmptyRenderContext) => JSX.Element)
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
     * Icon for the dropdown trigger.
     * @default 'icon-chevron-down'
     */
    triggerIcon?: IconT.Name
    /** Icon shown on the clear button. */
    closeIcon?: IconT.Name

    /** Called when the user scrolls near the bottom of the listbox. Use for infinite loading. */
    onScrollBottom?: () => void
    /** Distance (px) from the bottom at which onScrollBottom fires. Default: 20. */
    scrollBottomThreshold?: number
  }

  /**
   * Props for the MultiSelect component.
   */
  export interface Props extends BaseProps<
    Base,
    Variant,
    Extend,
    Slot,
    'multiple' | 'defaultFilter' | 'itemComponent' | 'sectionComponent'
  > {}
}

/**
 * Props for the MultiSelect component.
 */
export interface MultiSelectProps extends MultiSelectT.Props {}

// ---------------------------------------------------------------------------
// Normalized option types (internal)
// ---------------------------------------------------------------------------

type NormalizedOption = SharedNormalizedOption<MultiSelectT.Items>
type NormalizedGroup = SharedNormalizedGroup<MultiSelectT.Items>
type SelectControlState = SharedSelectControlState<MultiSelectT.Items>

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Dropdown select component with search, multi-select, and custom item rendering. */
export function MultiSelect(props: MultiSelectProps): JSX.Element {
  const merged = mergeProps(SELECT_COMMON_DEFAULT_PROPS, props)

  const [local, rest] = splitProps(merged, MULTI_SELECT_SPLIT_KEYS)

  const field = useSelectField(() => ({
    id: local.id,
    name: local.name,
    size: local.size,
    disabled: local.disabled,
    initialValue: local.defaultValue ?? [],
  }))
  const menuControl = useSelectMenuControl(() => local.openOnClick)

  // ---- Mode-derived booleans ----
  const isSearchable = () => Boolean(local.search)

  // ---- Dynamically created options (allowCreate) ----
  const [createdTags, setCreatedTags] = createSignal<NormalizedOption[]>([])

  // ---- Normalize options for Kobalte ----
  const normalizedOptions = createMemo(() => {
    const base = normalizeOptions(local.options)

    if (local.allowCreate || Boolean(local.tokenSeparators?.length)) {
      const existingValues = new Set(flattenOptions(base).map((o) => o.value))
      const newTags = createdTags().filter((t) => !existingValues.has(t.value))

      return [...newTags, ...base]
    }

    return base
  })

  const hasGroups = createMemo(() => normalizedOptions().some((item) => item.isGroup === true))

  const allFlatOptions = createMemo(() => flattenOptions(normalizedOptions()))

  // ---- maxCount: track selected values to disable remaining options ----
  const [selectedValueSet, setSelectedValueSet] = createSignal<Set<string>>(new Set())

  // Initialize selection tracking from value (controlled) or defaultValue (uncontrolled)
  createEffect(() => {
    const controlled = multiKobalteValue()
    if (controlled) {
      setSelectedValueSet(new Set(controlled.map((o) => o.value)))
      return
    }

    if (local.value === undefined && local.defaultValue !== undefined) {
      setSelectedValueSet(new Set(local.defaultValue.map((v) => String(v))))
    }
  })

  // Options with maxCount enforcement: disable unselected items when at the limit
  const effectiveOptions = createMemo(() => {
    const base = normalizedOptions()
    if (local.maxCount === undefined) {
      return base
    }

    const selected = selectedValueSet()
    if (selected.size < local.maxCount!) {
      return base
    }

    // At the limit â€?disable every unselected option
    return base.map((item) => {
      if (item.isGroup) {
        return Object.assign({}, item, {
          options: item.options.map((o) =>
            Object.assign({}, o, {
              disabled: selected.has(o.value) ? o.disabled : true,
            }),
          ),
        })
      }
      return Object.assign({}, item, {
        disabled: selected.has((item as NormalizedOption).value)
          ? (item as NormalizedOption).disabled
          : true,
      })
    })
  })

  // ---- Input ref for controlled search ----
  let inputRef: HTMLInputElement | undefined

  // ---- Current input text tracking (for create-tag item) ----
  const [currentInputText, setCurrentInputText] = createSignal('')

  syncSelectSearchInputValue(
    local,
    () => inputRef,
    (searchValue) => setCurrentInputText(searchValue),
  )

  const { kobalteFilter, hasMatches } = useSelectFilter<NormalizedOption, MultiSelectT.Items>({
    isSearchable,
    filterOption: () => local.filterOption,
    allOptions: allFlatOptions,
    inputValue: currentInputText,
  })

  // ---- Value lookup ----
  const findOptionByValue = createFindOptionByValue(() => allFlatOptions())

  // ---- Value conversion memos ----
  const multiKobalteValue = createMemo(() => {
    if (local.value === undefined) {
      return undefined
    }
    const values = local.value

    return values
      .map((v) => findOptionByValue(v))
      .filter((o): o is NormalizedOption => o !== undefined)
  })

  const kobalteDefaultValue = createMemo(() => {
    if (local.defaultValue === undefined) {
      return undefined
    }

    return local.defaultValue
      .map((v) => findOptionByValue(v))
      .filter((o): o is NormalizedOption => o !== undefined)
  })

  // ---- onChange bridges ----
  function handleMultipleChange(options: NormalizedOption[]): void {
    setSelectedValueSet(new Set(options.map((o) => o.value)))

    const nextValue = mapNormalizedListToRawValues(options)
    emitSelectValueChange(field, nextValue, local.onChange)
  }

  const selectedOptions = createMemo(() =>
    allFlatOptions().filter((option) => selectedValueSet().has(option.value)),
  )

  const isAtMaxCount = () => {
    if (local.maxCount === undefined) {
      return false
    }

    return selectedValueSet().size >= local.maxCount
  }

  function appendOptionIfAllowed(
    current: NormalizedOption[],
    option: NormalizedOption,
  ): {
    next: NormalizedOption[]
    appended: boolean
    blockedByMaxCount: boolean
    blockedByDisabled: boolean
  } {
    if (current.some((item) => item.value === option.value)) {
      return { next: current, appended: false, blockedByMaxCount: false, blockedByDisabled: false }
    }

    if (option.disabled) {
      return { next: current, appended: false, blockedByMaxCount: false, blockedByDisabled: true }
    }

    if (local.maxCount !== undefined && current.length >= local.maxCount) {
      return { next: current, appended: false, blockedByMaxCount: true, blockedByDisabled: false }
    }

    return {
      next: [...current, option],
      appended: true,
      blockedByMaxCount: false,
      blockedByDisabled: false,
    }
  }

  function resolveOptionForInput(
    text: string,
    current: NormalizedOption[],
  ): { option?: NormalizedOption; blockedByMaxCount: boolean } {
    const existing = findOptionByText(text)
    if (existing) {
      return { option: existing, blockedByMaxCount: false }
    }

    if (local.maxCount !== undefined && current.length >= local.maxCount) {
      return { blockedByMaxCount: true }
    }

    return { option: addTag(text), blockedByMaxCount: false }
  }

  // ---- Input change handler ----
  function handleInputChange(inputValue: string): void {
    // Token separator check for tags mode
    if (local.tokenSeparators?.length) {
      const sepRegex = new RegExp(`[${escapeRegex(local.tokenSeparators.join(''))}]`)

      if (sepRegex.test(inputValue)) {
        const trailingInput = inputValue.split(sepRegex).at(-1) ?? ''
        const isTrailingTokenCompleted = sepRegex.test(inputValue.at(-1) ?? '')
        const remainder = isTrailingTokenCompleted ? '' : trailingInput
        const tokens = (
          isTrailingTokenCompleted
            ? inputValue.split(sepRegex)
            : inputValue.split(sepRegex).slice(0, -1)
        ).filter((t) => t.trim())

        const current = selectedOptions()
        let nextSelected = [...current]

        for (const token of tokens) {
          const resolved = resolveOptionForInput(token.trim(), nextSelected)
          if (resolved.blockedByMaxCount) {
            break
          }

          const option = resolved.option
          if (!option) {
            continue
          }

          const appendResult = appendOptionIfAllowed(nextSelected, option)
          if (appendResult.blockedByMaxCount) {
            break
          }

          if (appendResult.appended) {
            nextSelected = appendResult.next
          }
        }

        if (nextSelected.length !== current.length) {
          handleMultipleChange(nextSelected)
        }

        queueMicrotask(() => {
          if (inputRef) {
            inputRef.value = remainder
          }
        })

        if (!menuControl.isDismissing()) {
          setCurrentInputText(remainder)
        }

        local.onSearch?.(remainder)
        return
      }
    }

    if (!menuControl.isDismissing()) {
      setCurrentInputText(inputValue)
    }

    local.onSearch?.(inputValue)
  }

  function addTag(text: string): NormalizedOption | undefined {
    if (!text) {
      return undefined
    }

    const normalized = text.trim()
    if (!normalized) {
      return undefined
    }

    const lower = normalized.toLowerCase()
    const exists = allFlatOptions().find(
      (o) => o.value.toLowerCase() === lower || o.key.toLowerCase() === lower,
    )

    if (exists) {
      return exists
    }

    const newOpt: NormalizedOption = {
      value: normalized,
      label: normalized,
      key: normalized,
      disabled: false,
      raw: { label: normalized, value: normalized },
    }

    setCreatedTags((prev) => [...prev, newOpt])
    return newOpt
  }

  function findOptionByText(text: string): NormalizedOption | undefined {
    const lower = text.toLowerCase()
    return allFlatOptions().find(
      (o) => o.key.toLowerCase() === lower || o.value.toLowerCase() === lower,
    )
  }

  function createTag(value?: string): boolean {
    if (!local.allowCreate) {
      return false
    }

    const text = String(value ?? currentInputText()).trim()
    if (!text) {
      return false
    }

    const current = selectedOptions()
    const resolved = resolveOptionForInput(text, current)
    if (resolved.blockedByMaxCount) {
      return false
    }

    const tagOpt = resolved.option
    if (!tagOpt) {
      return false
    }

    const appendResult = appendOptionIfAllowed(current, tagOpt)
    if (appendResult.blockedByMaxCount || appendResult.blockedByDisabled) {
      return false
    }

    if (appendResult.appended) {
      handleMultipleChange(appendResult.next)
    }

    if (inputRef) {
      inputRef.value = ''
    }

    setCurrentInputText('')
    local.onSearch?.('')
    return true
  }

  // ---- Trigger mode ----
  // Use 'manual' so the dropdown only opens on explicit user actions
  // (click, arrow-down, typing in searchable mode) â€?never on bare focus.
  // This prevents Tab from retriggering the menu via FocusScope's delayed
  // unmount-auto-focus.

  // ---- Item component ----
  const { ItemComponent, SectionComponent } = createSelectComponents<
    MultiSelectT.Items,
    MultiSelectT.OptionRenderState
  >({
    styles: () => merged.styles,
    size: field.size,
    classes: () => local.classes,
    optionRender: () => local.optionRender,
    labelRender: () => local.labelRender,
  })

  function SelectTriggerContent(props: SelectControlState): JSX.Element {
    const context = useComboboxContext()

    const inputHandlers = createComboboxInputHandlers({
      isSearchable,
      menuControl,
      field,
      context,
      onTabSelection: (key) => context.listState().selectionManager().toggleSelection(key),
      onExtraKeyDown: (e) => {
        if (e.key !== 'Enter') {
          return
        }

        const input = e.target as HTMLInputElement
        const text = input.value.trim()
        if (!text) {
          return
        }

        const match = findOptionByText(text)

        if (match) {
          // Toggle: remove if already selected, add if not
          const current = props.selectedOptions()
          const isSelected = current.some((o) => o.value === match.value)
          if (isSelected) {
            handleMultipleChange(current.filter((o) => o.value !== match.value))
            input.value = ''
            setCurrentInputText('')
            handleInputChange('')
          } else {
            const appendResult = appendOptionIfAllowed(current, match)
            if (appendResult.appended) {
              handleMultipleChange(appendResult.next)
              input.value = ''
              setCurrentInputText('')
              handleInputChange('')
            }
          }
        } else if (local.allowCreate) {
          createTag(text)
        }

        e.preventDefault()
      },
    })

    const visibleTags = (): NormalizedOption[] => {
      const selected = props.selectedOptions()

      if (local.maxTagCount === undefined) {
        return selected
      }

      return selected.slice(0, local.maxTagCount)
    }

    const overflowCount = (): number => {
      if (local.maxTagCount === undefined) {
        return 0
      }
      const total = props.selectedOptions().length

      return Math.max(0, total - local.maxTagCount!)
    }

    return (
      <>
        {/* Leading icon */}
        <Show when={local.leadingIcon}>
          {(icon) => (
            <Icon
              name={icon()}
              size={field.size()}
              slotName="leading"
              style={merged.styles?.leading}
              class={selectLeadingIconVariants({ size: field.size() }, local.classes?.leading)}
            />
          )}
        </Show>

        <div
          data-slot="tagsContainer"
          style={merged.styles?.tagsContainer}
          class={cn(
            'p-1.5 flex flex-1 flex-wrap gap-1 max-w-full select-none items-center',
            menuControl.opensFromControlClick() ? 'cursor-pointer' : 'cursor-default',
            local.classes?.tagsContainer,
          )}
          onPointerDown={(e) => {
            e.preventDefault()
            inputRef?.focus()
            if (menuControl.opensFromControlClick()) {
              // With triggerMode="manual", focus alone won't open.
              // Open explicitly so clicking the tags area opens the dropdown.
              menuControl.openMenu(context, () => context.close())
            }
          }}
        >
          <For each={visibleTags()}>
            {(option) => {
              const onClose = () => props.remove(option)
              return (
                <Show
                  when={!local.tagRender}
                  fallback={local.tagRender!({ ...option.raw, onClose })}
                >
                  <Badge
                    slotName="tag"
                    size={field.size()}
                    title={option.key}
                    variant={local.tagVariant}
                    styles={{ root: merged.styles?.tag }}
                    classes={{
                      root: ['max-w-50% pe-0', local.classes?.tag],
                      trailing: ['rounded hover:bg-accent scale-85', local.classes?.tagRemove],
                    }}
                    trailing={local.closeIcon ?? 'icon-close'}
                    onTrailingClick={(e) => {
                      e.stopPropagation()
                      onClose()
                    }}
                  >
                    {option.label}
                  </Badge>
                </Show>
              )
            }}
          </For>

          <Show when={overflowCount() > 0}>
            <span
              data-slot="tagOverflow"
              style={merged.styles?.tagOverflow}
              class="text-xs text-muted-foreground px-1 flex items-center"
            >
              +{overflowCount()}
            </span>
          </Show>

          <Combobox.Input
            ref={(el: HTMLInputElement) => {
              inputRef = el
            }}
            data-slot="input"
            style={merged.styles?.input}
            data-readonly={!isSearchable()}
            class={selectInputVariants(
              {
                mode: 'multiSearch',
                size: field.size(),
              },
              menuControl.opensFromControlClick()
                ? 'data-readonly:cursor-pointer'
                : 'data-readonly:cursor-default',
              local.classes?.input,
            )}
            readOnly={!isSearchable()}
            maxLength={local.searchMaxLength}
            onPointerDown={(e: PointerEvent) => {
              e.stopPropagation()
            }}
            {...inputHandlers}
          />
        </div>

        <RenderSelectClearButton
          show={Boolean(local.allowClear && props.selectedOptions().length > 0)}
          size={field.size()}
          style={merged.styles?.clear}
          rootClass={selectClearVariants({ size: field.size() }, local.classes?.clear)}
          onClick={(event) => {
            event.stopPropagation()
            field.handleClear(props.clear, local.onClear)
          }}
        />

        <RenderSelectTriggerButton
          style={merged.styles?.trigger}
          name={local.triggerIcon}
          size={field.size()}
          rootClass={selectTriggerIconVariants({ size: field.size() }, local.classes?.trigger)}
          loading={local.loading}
          loadingIcon={local.loadingIcon}
          onClick={(event) => menuControl.onTriggerClickFallback(event, context)}
        />
      </>
    )
  }

  function SelectEmptyNode(): JSX.Element {
    const context = useComboboxContext()

    return (
      <RenderSelectEmptyNode<MultiSelectT.EmptyRenderContext>
        emptyRender={local.emptyRender}
        style={merged.styles?.empty}
        class={local.classes?.empty}
        context={() => ({
          inputValue: currentInputText(),
          hasMatches: hasMatches(),
          selectedValues: [...selectedValueSet()].map((value) => {
            const option = findOptionByValue(value)
            return option ? mapNormalizedToRawValue(option) : value
          }),
          isAtMaxCount: isAtMaxCount(),
          create: (value?: string): boolean => createTag(value),
          close: () => context.close(),
        })}
      />
    )
  }

  // ---- Render ----
  return (
    <Combobox<NormalizedOption, NormalizedGroup>
      id={field.id()}
      name={field.name()}
      options={effectiveOptions()}
      {...SELECT_COMMON_COMBOBOX_PROPS}
      optionGroupChildren={hasGroups() ? 'options' : undefined}
      placeholder={selectedValueSet().size > 0 ? '' : local.placeholder}
      onInputChange={handleInputChange}
      defaultFilter={kobalteFilter()}
      disabled={field.disabled()}
      required={local.required}
      validationState={field.invalid() ? 'invalid' : 'valid'}
      virtualized={local.virtualized}
      itemComponent={local.virtualized ? undefined : ItemComponent}
      sectionComponent={local.virtualized ? undefined : SectionComponent}
      multiple={true}
      value={multiKobalteValue()}
      defaultValue={kobalteDefaultValue()}
      onChange={handleMultipleChange}
      closeOnSelection={false}
      removeOnBackspace={true}
      style={merged.styles?.root}
      class={cn('inline-flex h-fit w-full relative', local.classes?.root)}
      {...field.ariaAttrs()}
      {...rest}
    >
      <RenderSelectComboboxFrame<MultiSelectT.Items>
        controlStyle={merged.styles?.control}
        controlClass={cn(
          selectControlVariants(
            {
              size: field.size(),
              variant: local.variant,
            },
            local.classes?.control,
          ),
          menuControl.opensFromControlClick() ? 'cursor-pointer' : 'cursor-default',
        )}
        invalid={Boolean(field.invalid())}
        disabled={Boolean(field.disabled())}
        renderTriggerContent={(state) => <SelectTriggerContent {...state} />}
        hasMatches={hasMatches}
        emptyNode={<SelectEmptyNode />}
        virtualized={Boolean(local.virtualized)}
        contentStyle={merged.styles?.content}
        contentClass={local.classes?.content}
        listboxStyle={merged.styles?.listbox}
        listboxClass={local.classes?.listbox}
        onContentInteractOutside={menuControl.onContentInteractOutside}
        onContentCloseAutoFocus={menuControl.onContentCloseAutoFocus}
        onListboxScrollBottom={local.onScrollBottom}
        scrollBottomThreshold={local.scrollBottomThreshold}
        sectionComponent={SectionComponent}
        itemComponent={ItemComponent}
      />
    </Combobox>
  )
}
