import { Combobox, useComboboxContext } from '@kobalte/core/combobox'
import type {
  ComboboxRootProps,
  ComboboxRootItemComponentProps,
  ComboboxRootSectionComponentProps,
} from '@kobalte/core/combobox'
import type { Component, JSX } from 'solid-js'
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  splitProps,
} from 'solid-js'

import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS } from '../form-field/form-options'
import { Icon, IconButton } from '../icon'
import type { IconName } from '../icon'
import { overlayMenuContentVariants } from '../shared/overlay-menu/menu.class'
import type { SlotClasses } from '../shared/slot-class'
import { cn, useId } from '../shared/utils'

import type { SelectControlVariantProps } from './select.class'
import {
  selectTagVariants,
  selectClearVariants,
  selectControlVariants,
  selectInputVariants,
  selectItemVariants,
  selectLeadingIconVariants,
  selectTriggerIconVariants,
} from './select.class'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SelectValue = string | number

export interface SelectOption {
  label?: string | JSX.Element
  value?: SelectValue
  disabled?: boolean
  description?: string | JSX.Element
  icon?: IconName
  /** Group children. When present, this option acts as a group header. */
  options?: SelectOption[]
  [key: string]: unknown
}

export interface SelectFieldNames {
  label?: string
  value?: string
  /** Key for group children array. */
  options?: string
  /** Key for group header label. */
  groupLabel?: string
}

export interface SelectOptionRenderState {
  isSelected: boolean
  isHighlighted: boolean
  isDisabled: boolean
}

export type SelectOptionRender = (
  option: SelectOption,
  state: SelectOptionRenderState,
) => JSX.Element

export type SelectTagRender = (option: SelectOption, onClose: () => void) => JSX.Element

export type SelectLabelRender = (option: SelectOption) => JSX.Element

export type SelectEmptyRender = string | ((context: SelectEmptyRenderContext) => JSX.Element)

export interface SelectEmptyRenderContext {
  /** Current input/search text. */
  inputValue: string
  /** Whether the select allows multiple selections. */
  multiple: boolean
  /** Whether the current filter has any matches. */
  hasMatches: boolean
  /** Currently selected values. */
  selectedValues: SelectValue[]
  /** Whether the maximum selection count has been reached. */
  isAtMaxCount: boolean
  /** Create a new tag (requires `multiple` and `allowCreate`). Returns true if successfully created. */
  create: (value?: string) => boolean
  /** Close the dropdown menu. */
  close: () => void
}

type SelectSlots =
  | 'root'
  | 'control'
  | 'input'
  | 'leadingIcon'
  | 'triggerIcon'
  | 'clear'
  | 'content'
  | 'listbox'
  | 'item'
  | 'itemIndicator'
  | 'itemLabel'
  | 'itemDescription'
  | 'section'
  | 'sectionLabel'
  | 'tagsContainer'
  | 'tag'
  | 'tagRemove'
  | 'empty'

export type SelectClasses = SlotClasses<SelectSlots>

type SelectSize = NonNullable<SelectControlVariantProps['size']>
type SelectVariant = NonNullable<SelectControlVariantProps['variant']>

export interface SelectBaseProps
  extends
    FormIdentityOptions,
    FormValueOptions<SelectValue | null | SelectValue[]>,
    FormRequiredOption,
    FormDisableOption {
  /** Whether to allow multiple selections. When true, value is `SelectValue[]`. */
  multiple?: boolean

  /** Available options. */
  options?: SelectOption[]
  /** Custom field name mapping for option objects. */
  fieldNames?: SelectFieldNames

  /** Called when the selection changes. */
  onChange?: (value: SelectValue | null | SelectValue[]) => void

  /** Controlled open state of the dropdown. */
  open?: boolean
  /** Default open state. */
  defaultOpen?: boolean
  /** Called when the dropdown opens/closes. */
  onOpenChange?: (isOpen: boolean) => void

  /** Enable search input. Defaults to `false`. */
  showSearch?: boolean
  /** Controlled search value. */
  searchValue?: string
  /** Default search value. */
  defaultSearchValue?: string
  /** Called when the search input changes. */
  onSearch?: (value: string) => void
  /** Filter function or boolean. `false` disables filtering. */
  filterOption?: boolean | ((inputValue: string, option: SelectOption) => boolean)
  /** Property on option to filter by (default: label). */
  optionFilterProp?: string

  /** Show a clear button when a value is selected. */
  allowClear?: boolean
  /** Called when clear is triggered. */
  onClear?: () => void

  /** Characters that split input into tokens and immediately select them (requires `multiple`). */
  tokenSeparators?: string[]
  /** Allow creating new tags on Enter when no match is found (requires `multiple`). */
  allowCreate?: boolean

  /** Maximum number of selected values (multiple/tags). */
  maxCount?: number
  /** Maximum visible tags before showing +N (visual only). */
  maxTagCount?: number

  /** Custom renderer for each option in the dropdown. */
  optionRender?: SelectOptionRender
  /** Custom renderer for each selected tag (multiple/tags). */
  tagRender?: SelectTagRender
  /** Custom renderer for the option label text. */
  labelRender?: SelectLabelRender
  /** Custom renderer for the empty state when current filtered result has no matches. */
  emptyRender?: SelectEmptyRender

  size?: SelectSize
  variant?: SelectVariant
  highlight?: boolean
  disabled?: boolean
  placeholder?: string
  loading?: boolean
  loadingIcon?: IconName
  /** Icon shown before the input/value area. */
  leadingIcon?: IconName
  /** Icon for the dropdown trigger. Default: 'icon-chevron-down'. */
  triggerIcon?: IconName
  closeIcon?: IconName

  // ---- Kobalte passthrough props ----

  /** Enable virtual scrolling for large option lists. */
  virtualized?: boolean
  /** Dropdown placement relative to trigger. */
  placement?: 'top' | 'bottom' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  /** Distance (px) between dropdown and trigger. */
  gutter?: number
  /** Whether dropdown should match trigger width. */
  sameWidth?: boolean
  /** Allow dropdown to overlap the trigger when overflowing. */
  overlap?: boolean
  /** Make combobox modal for screen readers. */
  modal?: boolean
  /** Prevent body scroll when dropdown is open. */
  preventScroll?: boolean
  /** Auto-flip dropdown when it overflows viewport. */
  flip?: boolean | string
  /** Slide dropdown along trigger when overflowing. */
  slide?: boolean
  /** Force mount the dropdown portal (useful for animations). */
  forceMount?: boolean

  /** Called when the user scrolls near the bottom of the listbox. Use for infinite loading. */
  onScrollEnd?: () => void
  /** Distance (px) from the bottom at which onScrollEnd fires. Default: 20. */
  scrollEndThreshold?: number

  classes?: SelectClasses
}

export type SelectProps = SelectBaseProps &
  Omit<
    ComboboxRootProps<NormalizedOption, NormalizedGroup>,
    keyof SelectBaseProps | 'id' | 'children' | 'class'
  >

// ---------------------------------------------------------------------------
// Normalized option types (internal)
// ---------------------------------------------------------------------------

interface NormalizedOption {
  value: string
  label: string
  disabled: boolean
  raw: SelectOption
  isGroup?: false
}

interface NormalizedGroup {
  label: string
  options: NormalizedOption[]
  isGroup: true
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAtPath(data: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], data)
}

function normalizeLeafOption(
  option: SelectOption,
  labelKey: string,
  valueKey: string,
): NormalizedOption {
  const value = getAtPath(option as Record<string, unknown>, valueKey)
  const label = getAtPath(option as Record<string, unknown>, labelKey)

  return {
    value: String(value ?? ''),
    label: String(label ?? value ?? ''),
    disabled: Boolean(option.disabled),
    raw: option,
  }
}

function normalizeOptions(
  options: SelectOption[] | undefined,
  fieldNames: SelectFieldNames | undefined,
): Array<NormalizedOption | NormalizedGroup> {
  const labelKey = fieldNames?.label ?? 'label'
  const valueKey = fieldNames?.value ?? 'value'
  const optionsKey = fieldNames?.options ?? 'options'
  const groupLabelKey = fieldNames?.groupLabel ?? 'label'

  return (options ?? []).map((option) => {
    const children = getAtPath(option as Record<string, unknown>, optionsKey) as
      | SelectOption[]
      | undefined

    if (children && Array.isArray(children)) {
      return {
        label: String(getAtPath(option as Record<string, unknown>, groupLabelKey) ?? ''),
        options: children.map((child) => normalizeLeafOption(child, labelKey, valueKey)),
        isGroup: true as const,
      }
    }

    return normalizeLeafOption(option, labelKey, valueKey)
  })
}

function flattenOptions(items: Array<NormalizedOption | NormalizedGroup>): NormalizedOption[] {
  const result: NormalizedOption[] = []

  for (const item of items) {
    if (item.isGroup) {
      result.push(...item.options)
    } else {
      result.push(item)
    }
  }

  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Select(props: SelectProps): JSX.Element {
  const merged = mergeProps(
    {
      variant: 'outline' as const,
      placeholder: '',
      allowClear: false,
    },
    props,
  )

  const [formProps, searchInteractionProps, renderDisplayProps, styleProps, rootProps] = splitProps(
    merged as SelectProps,
    [...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS, 'onChange'],
    [
      'multiple',
      'showSearch',
      'searchValue',
      'defaultSearchValue',
      'onSearch',
      'filterOption',
      'optionFilterProp',
      'allowClear',
      'onClear',
      'tokenSeparators',
      'allowCreate',
      'maxCount',
      'maxTagCount',
      'virtualized',
      'onScrollEnd',
      'scrollEndThreshold',
    ],
    [
      'options',
      'fieldNames',
      'optionRender',
      'tagRender',
      'labelRender',
      'emptyRender',
      'placeholder',
      'loading',
      'loadingIcon',
      'leadingIcon',
      'triggerIcon',
      'closeIcon',
    ],
    ['size', 'variant', 'highlight', 'classes'],
  )

  const generatedId = useId(() => formProps.id, 'select')
  // ---- Form field integration ----
  const field = useFormField(
    () => ({
      id: formProps.id,
      name: formProps.name,
      size: styleProps.size,
      highlight: styleProps.highlight,
      disabled: formProps.disabled,
    }),
    {
      bind: false,
      defaultId: generatedId,
      defaultSize: 'md',
    },
  )

  // ---- Mode-derived booleans ----
  const isMultiple = createMemo(() => Boolean(searchInteractionProps.multiple))
  const isSearchable = createMemo(() => Boolean(searchInteractionProps.showSearch))

  // ---- Dynamically created options (allowCreate) ----
  const [createdTags, setCreatedTags] = createSignal<NormalizedOption[]>([])

  // ---- Normalize options for Kobalte ----
  const normalizedOptions = createMemo(() => {
    const base = normalizeOptions(renderDisplayProps.options, renderDisplayProps.fieldNames)

    if (
      isMultiple() &&
      (searchInteractionProps.allowCreate ||
        Boolean(searchInteractionProps.tokenSeparators?.length))
    ) {
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
    if (!isMultiple()) {
      return
    }

    const controlled = multiKobalteValue()
    if (controlled) {
      setSelectedValueSet(new Set(controlled.map((o) => o.value)))
      return
    }

    if (formProps.value === undefined && formProps.defaultValue !== undefined) {
      const vals = (
        Array.isArray(formProps.defaultValue) ? formProps.defaultValue : [formProps.defaultValue]
      ) as SelectValue[]
      setSelectedValueSet(new Set(vals.map((v) => String(v))))
    }
  })

  // Options with maxCount enforcement: disable unselected items when at the limit
  const effectiveOptions = createMemo(() => {
    const base = normalizedOptions()
    if (!isMultiple() || searchInteractionProps.maxCount === undefined) {
      return base
    }

    const selected = selectedValueSet()
    if (selected.size < searchInteractionProps.maxCount!) {
      return base
    }

    // At the limit — disable every unselected option
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

  // ---- Filter function for Kobalte ----
  const kobalteFilter = createMemo<
    | 'startsWith'
    | 'endsWith'
    | 'contains'
    | ((option: NormalizedOption, inputValue: string) => boolean)
  >(() => {
    // Bypass filtering when search is disabled or explicitly disabled via filterOption={false}
    if (!isSearchable() || searchInteractionProps.filterOption === false) {
      return (): boolean => true
    }

    if (typeof searchInteractionProps.filterOption === 'function') {
      const userFilter = searchInteractionProps.filterOption

      return (option: NormalizedOption, inputValue: string): boolean =>
        userFilter(inputValue, option.raw)
    }

    if (searchInteractionProps.optionFilterProp) {
      const prop = searchInteractionProps.optionFilterProp

      return (option: NormalizedOption, inputValue: string): boolean => {
        const fieldValue = String(getAtPath(option.raw as Record<string, unknown>, prop) ?? '')

        return fieldValue.toLowerCase().includes(inputValue.toLowerCase())
      }
    }

    return 'contains'
  })

  // ---- Kobalte context bridge ----
  // Captured inside the <Combobox> tree via a local component.
  let kobalteCtx: ReturnType<typeof useComboboxContext> | undefined

  function ContextBridge(): null {
    kobalteCtx = useComboboxContext()
    return null
  }

  // ---- Input ref for controlled search ----
  let inputRef: HTMLInputElement | undefined

  createEffect(
    on(
      () => searchInteractionProps.searchValue,
      (searchValue) => {
        if (searchValue !== undefined && inputRef) {
          inputRef.value = searchValue
        }
      },
    ),
  )

  // ---- Current input text tracking (for create-tag item) ----
  const [currentInputText, setCurrentInputText] = createSignal('')

  // ---- Value lookup ----
  function findOptionByValue(val: SelectValue): NormalizedOption | undefined {
    return allFlatOptions().find((o) => o.value === String(val))
  }

  // ---- Value conversion memos ----
  const multiKobalteValue = createMemo(() => {
    if (!isMultiple() || formProps.value === undefined) {
      return undefined
    }
    const values = (
      Array.isArray(formProps.value) ? formProps.value : [formProps.value]
    ) as SelectValue[]

    return values
      .map((v) => findOptionByValue(v))
      .filter((o): o is NormalizedOption => o !== undefined)
  })

  // Unified value memo: returns single option or array depending on mode.
  // Typed as `any` because Kobalte's discriminated union (single vs multiple)
  // can't be narrowed through a runtime check on `isMultiple()`.
  const kobalteValue = createMemo((): any => {
    if (isMultiple()) {
      return multiKobalteValue()
    }
    if (formProps.value === undefined) {
      return undefined
    }
    if (formProps.value === null) {
      return null
    }
    return findOptionByValue(formProps.value as SelectValue) ?? null
  })

  const kobalteDefaultValue = createMemo((): any => {
    if (isMultiple()) {
      if (formProps.defaultValue === undefined) {
        return undefined
      }
      const values = (
        Array.isArray(formProps.defaultValue) ? formProps.defaultValue : [formProps.defaultValue]
      ) as SelectValue[]
      return values
        .map((v) => findOptionByValue(v))
        .filter((o): o is NormalizedOption => o !== undefined)
    }
    if (formProps.defaultValue === undefined || formProps.defaultValue === null) {
      return undefined
    }
    return findOptionByValue(formProps.defaultValue as SelectValue)
  })

  // ---- onChange bridges ----
  function handleSingleChange(option: NormalizedOption | null): void {
    const nextValue = option ? (option.raw.value ?? option.value) : null

    formProps.onChange?.(nextValue as SelectValue | null)
    field.emitFormChange()
    field.emitFormInput()
  }

  function handleMultipleChange(options: NormalizedOption[]): void {
    setSelectedValueSet(new Set(options.map((o) => o.value)))

    const nextValue = options.map((o) => (o.raw.value ?? o.value) as SelectValue)

    formProps.onChange?.(nextValue)
    field.emitFormChange()
    field.emitFormInput()
  }

  // ---- Dismiss flag: prevents hasMatches flash during ESC/Tab close ----
  // When ESC or Tab triggers Kobalte's resetInputValue, the onInputChange
  // callback fires synchronously. Without this flag, setCurrentInputText
  // would update hasMatches (empty string matches everything), causing the
  // <Show when={hasMatches()}> gate to swap in the full listbox during the
  // close animation — a visible flash of unfiltered options.
  let isDismissing = false

  // ---- Input change handler ----
  function handleInputChange(inputValue: string): void {
    // Token separator check for tags mode
    if (isMultiple() && searchInteractionProps.tokenSeparators?.length) {
      const sepRegex = new RegExp(
        `[${escapeRegex(searchInteractionProps.tokenSeparators.join(''))}]`,
      )

      if (sepRegex.test(inputValue)) {
        const trailingInput = inputValue.split(sepRegex).at(-1) ?? ''
        const isTrailingTokenCompleted = sepRegex.test(inputValue.at(-1) ?? '')
        const remainder = isTrailingTokenCompleted ? '' : trailingInput
        const tokens = (
          isTrailingTokenCompleted
            ? inputValue.split(sepRegex)
            : inputValue.split(sepRegex).slice(0, -1)
        ).filter((t) => t.trim())

        const current = allFlatOptions().filter((option) => selectedValueSet().has(option.value))
        const nextSelected = [...current]
        const maxCount = searchInteractionProps.maxCount

        for (const token of tokens) {
          const option = addTag(token.trim())
          if (!option) {
            continue
          }

          const isAlreadySelected = nextSelected.some((selected) => selected.value === option.value)
          if (isAlreadySelected) {
            continue
          }

          if (maxCount !== undefined && nextSelected.length >= maxCount) {
            break
          }

          nextSelected.push(option)
        }

        if (nextSelected.length !== current.length) {
          handleMultipleChange(nextSelected)
        }

        queueMicrotask(() => {
          if (inputRef) {
            inputRef.value = remainder
          }
        })

        if (!isDismissing) {
          setCurrentInputText(remainder)
        }

        searchInteractionProps.onSearch?.(remainder)
        return
      }
    }

    if (!isDismissing) {
      setCurrentInputText(inputValue)
    }

    searchInteractionProps.onSearch?.(inputValue)
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
      (o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower,
    )

    if (exists) {
      return exists
    }

    const newOpt: NormalizedOption = {
      value: normalized,
      label: normalized,
      disabled: false,
      raw: { label: normalized, value: normalized },
    }

    setCreatedTags((prev) => [...prev, newOpt])
    return newOpt
  }

  function findOptionByText(text: string): NormalizedOption | undefined {
    const lower = text.toLowerCase()
    return allFlatOptions().find(
      (o) => o.label.toLowerCase() === lower || o.value.toLowerCase() === lower,
    )
  }

  function matchesByCurrentFilter(option: NormalizedOption, inputValue: string): boolean {
    const filter = kobalteFilter()

    if (typeof filter === 'function') {
      return filter(option, inputValue)
    }

    const input = inputValue.toLowerCase()
    const text = option.label.toLowerCase()

    if (filter === 'startsWith') {
      return text.startsWith(input)
    }
    if (filter === 'endsWith') {
      return text.endsWith(input)
    }
    return text.includes(input)
  }

  const hasMatches = createMemo(() => {
    const inputValue = currentInputText()

    return allFlatOptions().some((option) => matchesByCurrentFilter(option, inputValue))
  })

  function createTag(value?: string): boolean {
    if (!isMultiple() || !searchInteractionProps.allowCreate) {
      return false
    }

    const text = String(value ?? currentInputText()).trim()
    if (!text) {
      return false
    }

    const tagOpt = addTag(text)
    if (!tagOpt) {
      return false
    }

    const current = allFlatOptions().filter((option) => selectedValueSet().has(option.value))
    const isAlreadySelected = current.some((option) => option.value === tagOpt.value)

    if (!isAlreadySelected) {
      handleMultipleChange([...current, tagOpt])
    }

    if (inputRef) {
      inputRef.value = ''
    }

    setCurrentInputText('')
    searchInteractionProps.onSearch?.('')
    return true
  }

  // ---- Clear handler ----
  function handleClear(clearFn: () => void): void {
    clearFn()
    searchInteractionProps.onClear?.()
    field.emitFormChange()
    field.emitFormInput()
  }

  // ---- Scroll end handler (infinite scroll) ----

  function handleListboxScroll(e: Event): void {
    if (!searchInteractionProps.onScrollEnd) {
      return
    }

    const el = e.target as HTMLElement
    const threshold = searchInteractionProps.scrollEndThreshold ?? 20

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      searchInteractionProps.onScrollEnd()
    }
  }

  // ---- Close-auto-focus flags ----
  // When the dropdown closes via interact-outside or Tab, we prevent the
  // FocusScope's onUnmountAutoFocus from pulling focus back to the input.
  let closedByInteractOutside = false
  let closedByTab = false

  // ---- Trigger mode ----
  // Use 'manual' so the dropdown only opens on explicit user actions
  // (click, arrow-down, typing in searchable mode) — never on bare focus.
  // This prevents Tab from retriggering the menu via FocusScope's delayed
  // unmount-auto-focus.

  function renderItemLabel(option: SelectOption, fallbackLabel: JSX.Element): JSX.Element {
    return (
      <Combobox.ItemLabel
        data-slot="item-label"
        class={cn('col-start-1 truncate', styleProps.classes?.itemLabel)}
      >
        <Show when={renderDisplayProps.labelRender} fallback={fallbackLabel}>
          {renderDisplayProps.labelRender!(option)}
        </Show>
      </Combobox.ItemLabel>
    )
  }

  function renderItemDescription(option: SelectOption): JSX.Element {
    return (
      <Combobox.ItemDescription
        data-slot="item-description"
        class={cn('col-start-1 text-xs text-muted-foreground', styleProps.classes?.itemDescription)}
      >
        {option.description}
      </Combobox.ItemDescription>
    )
  }

  function renderItemIndicator(indicatorIcon: IconName): JSX.Element {
    return (
      <Combobox.ItemIndicator
        data-slot="item-indicator"
        class={cn(
          'col-start-2 inline-flex items-center justify-center text-sm',
          styleProps.classes?.itemIndicator,
        )}
      >
        <Icon name={indicatorIcon} />
      </Combobox.ItemIndicator>
    )
  }

  function renderItemContent(params: {
    option: SelectOption
    state: SelectOptionRenderState
    indicatorIcon: IconName
    fallbackLabel: JSX.Element
  }): JSX.Element {
    return (
      <Show
        when={renderDisplayProps.optionRender}
        fallback={
          <>
            <Show
              when={params.option.icon}
              fallback={renderItemLabel(params.option, params.fallbackLabel)}
            >
              {(icon) => (
                <span class="flex gap-2 col-start-1 items-center">
                  <Icon name={icon()} />
                  {renderItemLabel(params.option, params.fallbackLabel)}
                </span>
              )}
            </Show>

            <Show when={params.option.description}>{renderItemDescription(params.option)}</Show>

            {renderItemIndicator(params.indicatorIcon)}
          </>
        }
      >
        {renderDisplayProps.optionRender!(params.option, params.state)}
      </Show>
    )
  }

  // ---- Item component ----
  const SelectItemComponent: Component<ComboboxRootItemComponentProps<NormalizedOption>> = (
    itemProps,
  ) => {
    const context = useComboboxContext()
    const raw = (): SelectOption => itemProps.item.rawValue.raw
    const renderState = createMemo<SelectOptionRenderState>(() => {
      const selectionManager = context.listState().selectionManager()

      return {
        isSelected: selectionManager.isSelected(itemProps.item.key),
        isHighlighted: selectionManager.focusedKey() === itemProps.item.key,
        isDisabled: itemProps.item.rawValue.disabled,
      }
    })

    return (
      <Combobox.Item
        item={itemProps.item}
        data-slot="item"
        onPointerDown={(e) => e.preventDefault()}
        class={selectItemVariants({ size: field.size() }, styleProps.classes?.item)}
      >
        {renderItemContent({
          option: raw(),
          state: renderState(),
          indicatorIcon: 'icon-check',
          fallbackLabel: itemProps.item.rawValue.label,
        })}
      </Combobox.Item>
    )
  }

  const SelectSectionComponent: Component<ComboboxRootSectionComponentProps<NormalizedGroup>> = (
    sectionProps,
  ) => (
    <Combobox.Section
      data-slot="section"
      class={cn('[&:not(:first-child)]:mt-1.5', styleProps.classes?.section)}
    >
      <span
        data-slot="section-label"
        class={cn(
          'block px-2 py-1.5 font-medium text-muted-foreground text-xs',
          styleProps.classes?.sectionLabel,
        )}
      >
        {sectionProps.section.rawValue.label}
      </span>
    </Combobox.Section>
  )

  // ---- Shared inner render ----
  function renderTrigger(state: {
    selectedOptions: () => NormalizedOption[]
    remove: (option: NormalizedOption) => void
    clear: () => void
  }): JSX.Element {
    const visibleTags = createMemo(() => {
      const selected = state.selectedOptions()

      if (searchInteractionProps.maxTagCount === undefined) {
        return selected
      }

      return selected.slice(0, searchInteractionProps.maxTagCount)
    })

    const overflowCount = createMemo(() => {
      if (searchInteractionProps.maxTagCount === undefined) {
        return 0
      }
      const total = state.selectedOptions().length

      return Math.max(0, total - searchInteractionProps.maxTagCount!)
    })

    const renderInput = (): JSX.Element => (
      <Combobox.Input
        ref={(el: HTMLInputElement) => {
          inputRef = el
        }}
        data-slot="input"
        class={selectInputVariants(
          {
            mode: isMultiple() ? (isSearchable() ? 'multiSearch' : 'multiHidden') : 'single',
            readOnly: !isSearchable() && !isMultiple(),
            size: field.size(),
          },
          styleProps.classes?.input,
        )}
        readOnly={!isSearchable()}
        onClick={() => {
          // With triggerMode="manual", clicks don't auto-open.
          // Open explicitly so click-to-open works.
          if (kobalteCtx && !kobalteCtx.isOpen()) {
            kobalteCtx.open(false, 'manual')
          }
        }}
        onKeyDown={(e: KeyboardEvent) => {
          // Flag dismiss keys so handleInputChange skips setCurrentInputText
          // during Kobalte's synchronous resetInputValue call that follows.
          if (e.key === 'Escape' || e.key === 'Tab') {
            isDismissing = true
            queueMicrotask(() => {
              isDismissing = false
            })
          }

          // Track Tab so onCloseAutoFocus can let focus move naturally
          // to the next focusable element instead of pulling it back.
          if (e.key === 'Tab') {
            closedByTab = true
          }

          // Prevent page scroll when navigating with arrow keys.
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
          }

          if (!isMultiple() || e.key !== 'Enter') {
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
            const current = state.selectedOptions()
            const isSelected = current.some((o) => o.value === match.value)
            if (isSelected) {
              handleMultipleChange(current.filter((o) => o.value !== match.value))
            } else {
              handleMultipleChange([...current, match])
            }
            input.value = ''
            setCurrentInputText('')
            handleInputChange('')
          } else if (searchInteractionProps.allowCreate) {
            createTag(text)
          }

          e.preventDefault()
        }}
        onFocus={() => field.emitFormFocus()}
        onBlur={() => field.emitFormBlur()}
      />
    )

    return (
      <>
        {/* Leading icon */}
        <Show when={renderDisplayProps.leadingIcon}>
          {(icon) => (
            <Icon
              name={icon()}
              data-slot="leading-icon"
              class={selectLeadingIconVariants(
                { size: field.size() },
                styleProps.classes?.leadingIcon,
              )}
            />
          )}
        </Show>

        {/* Multiple mode: tags + input in one flex-wrap container */}
        <Show when={isMultiple()} fallback={renderInput()}>
          <div
            data-slot="tags-container"
            class={cn(
              'flex flex-1 cursor-pointer select-none flex-wrap items-center gap-1 p-1.5',
              styleProps.classes?.tagsContainer,
            )}
            onPointerDown={(e) => {
              e.preventDefault()
              inputRef?.focus()
              // With triggerMode="manual", focus alone won't open.
              // Open explicitly so clicking the tags area opens the dropdown.
              if (kobalteCtx && !kobalteCtx.isOpen()) {
                kobalteCtx.open(false, 'manual')
              }
            }}
          >
            <Show when={!isSearchable() && state.selectedOptions().length === 0}>
              <span class="text-sm text-muted-foreground px-1">
                {renderDisplayProps.placeholder}
              </span>
            </Show>
            <For each={visibleTags()}>
              {(option) => (
                <Show
                  when={renderDisplayProps.tagRender}
                  fallback={
                    <span
                      data-slot="tag"
                      class={selectTagVariants({ size: field.size() }, styleProps.classes?.tag)}
                    >
                      {option.label}
                      <IconButton
                        name={renderDisplayProps.closeIcon ?? 'icon-close'}
                        data-slot="tag-remove"
                        class={cn('size-4', styleProps.classes?.tagRemove)}
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation()
                          state.remove(option)
                        }}
                      />
                    </span>
                  }
                >
                  {renderDisplayProps.tagRender!(option.raw, () => state.remove(option))}
                </Show>
              )}
            </For>

            <Show when={overflowCount() > 0}>
              <span
                data-slot="tag-overflow"
                class="text-xs text-muted-foreground px-1 flex items-center"
              >
                +{overflowCount()}
              </span>
            </Show>

            {renderInput()}
          </div>
        </Show>

        {/* Clear button */}
        <Show when={searchInteractionProps.allowClear && state.selectedOptions().length > 0}>
          <IconButton
            name="icon-close"
            data-slot="clear"
            class={selectClearVariants({ size: field.size() }, styleProps.classes?.clear)}
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation()
              handleClear(state.clear)
            }}
          />
        </Show>

        {/* Trigger icon */}
        <Combobox.Trigger
          as={(props: Record<string, any>) => (
            <IconButton
              data-slot="trigger"
              name={renderDisplayProps.triggerIcon ?? 'icon-chevron-down'}
              class={selectTriggerIconVariants(
                { size: field.size() },
                'outline-none',
                styleProps.classes?.triggerIcon,
              )}
              loading={renderDisplayProps.loading}
              loadingIcon={renderDisplayProps.loadingIcon}
              {...props}
            />
          )}
        />
      </>
    )
  }

  // ---- Dropdown content ----
  function renderContent(): JSX.Element {
    return (
      <Combobox.Portal>
        <Combobox.Content
          data-slot="content"
          class={overlayMenuContentVariants({}, styleProps.classes?.content)}
          onInteractOutside={() => {
            closedByInteractOutside = true
            // Prevent hasMatches flash: Kobalte will resetInputValue on close,
            // triggering onInputChange('').  Without this guard the empty string
            // would match everything, swapping in the full option list during the
            // close animation.
            isDismissing = true
            queueMicrotask(() => {
              isDismissing = false
            })
          }}
          onCloseAutoFocus={(e: Event) => {
            if (closedByInteractOutside || closedByTab) {
              e.preventDefault()
              closedByInteractOutside = false
              closedByTab = false
            }
          }}
        >
          <Show
            when={hasMatches()}
            fallback={
              /* Empty state */
              <Show
                when={typeof renderDisplayProps.emptyRender === 'function'}
                fallback={
                  <div
                    data-slot="empty"
                    class={cn(
                      'p-2 text-center text-muted-foreground text-sm',
                      styleProps.classes?.empty,
                    )}
                  >
                    {typeof renderDisplayProps.emptyRender === 'string'
                      ? renderDisplayProps.emptyRender
                      : 'No options'}
                  </div>
                }
              >
                {(renderDisplayProps.emptyRender as (ctx: SelectEmptyRenderContext) => JSX.Element)(
                  {
                    inputValue: currentInputText(),
                    multiple: isMultiple(),
                    hasMatches: hasMatches(),
                    selectedValues: [...selectedValueSet()].map((v) => {
                      const opt = findOptionByValue(v)
                      return opt ? (opt.raw.value ?? opt.value) : v
                    }) as SelectValue[],
                    isAtMaxCount:
                      isMultiple() && searchInteractionProps.maxCount !== undefined
                        ? selectedValueSet().size >= searchInteractionProps.maxCount
                        : false,
                    create: (value?: string): boolean => createTag(value),
                    close: () => kobalteCtx?.close(),
                  },
                )}
              </Show>
            }
          >
            <Show
              when={searchInteractionProps.virtualized}
              fallback={
                <Combobox.Listbox
                  // ref={bindListboxScroll}
                  data-slot="listbox"
                  class={cn(
                    'max-h-$kb-popper-content-available-height overflow-y-auto outline-none',
                    styleProps.classes?.listbox,
                  )}
                  onScrollEnd={handleListboxScroll}
                />
              }
            >
              <Combobox.Listbox
                data-slot="listbox"
                class={cn(
                  'max-h-$kb-popper-content-available-height overflow-y-auto p-1 outline-none',
                  styleProps.classes?.listbox,
                )}
                onScrollEnd={handleListboxScroll}
              >
                {(collection) => (
                  <For each={[...collection()]}>
                    {(node) => (
                      <Switch>
                        <Match when={node.type === 'section'}>
                          <SelectSectionComponent section={node} />
                        </Match>
                        <Match when={node.type === 'item'}>
                          <SelectItemComponent item={node} />
                        </Match>
                      </Switch>
                    )}
                  </For>
                )}
              </Combobox.Listbox>
            </Show>
          </Show>
        </Combobox.Content>
      </Combobox.Portal>
    )
  }

  // ---- Render ----
  return (
    <Combobox<NormalizedOption, NormalizedGroup>
      id={field.id()}
      name={field.name()}
      options={effectiveOptions()}
      optionValue="value"
      optionLabel="label"
      optionDisabled="disabled"
      optionTextValue="label"
      optionGroupChildren={hasGroups() ? 'options' : undefined}
      placeholder={
        isMultiple() && selectedValueSet().size > 0 ? '' : renderDisplayProps.placeholder
      }
      onInputChange={handleInputChange}
      defaultFilter={kobalteFilter()}
      triggerMode="manual"
      disabled={field.disabled()}
      required={formProps.required}
      validationState={field.invalid() ? 'invalid' : 'valid'}
      allowsEmptyCollection={true}
      shouldFocusWrap={true}
      virtualized={searchInteractionProps.virtualized}
      itemComponent={searchInteractionProps.virtualized ? undefined : SelectItemComponent}
      sectionComponent={searchInteractionProps.virtualized ? undefined : SelectSectionComponent}
      multiple={isMultiple() as any}
      value={kobalteValue()}
      defaultValue={kobalteDefaultValue()}
      onChange={(isMultiple() ? handleMultipleChange : handleSingleChange) as any}
      closeOnSelection={!isMultiple()}
      removeOnBackspace={isMultiple()}
      data-slot="root"
      class={cn('relative inline-flex w-full h-fit', styleProps.classes?.root)}
      {...field.ariaAttrs()}
      {...rootProps}
      overflowPadding={-2}
    >
      <ContextBridge />
      <Combobox.Control<NormalizedOption>
        data-slot="control"
        class={selectControlVariants(
          {
            size: field.size(),
            variant: styleProps.variant,
            highlight: field.highlight(),
            disabled: field.disabled(),
            invalid: field.invalid(),
          },
          styleProps.classes?.control,
        )}
      >
        {(state) => renderTrigger(state)}
      </Combobox.Control>

      {renderContent()}
      <Combobox.HiddenSelect />
    </Combobox>
  )
}
