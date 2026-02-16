import { Combobox, useComboboxContext } from '@kobalte/core/combobox'
import type {
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
import { Icon } from '../icon'
import type { IconName } from '../icon'
import { cn, useId } from '../shared/utils'

import type { SelectControlVariantProps } from './select.class'
import {
  selectTagRemoveClasses,
  selectTagVariants,
  selectTagsContainerClasses,
  selectClearVariants,
  selectContentClasses,
  selectControlVariants,
  selectEmptyClasses,
  selectInputVariants,
  selectItemDescriptionClasses,
  selectItemIndicatorClasses,
  selectItemLabelClasses,
  selectItemVariants,
  selectLeadingIconVariants,
  selectListboxClasses,
  selectRootClasses,
  selectSectionClasses,
  selectSectionLabelClasses,
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

export interface SelectClasses {
  root?: string
  control?: string
  input?: string
  leadingIcon?: string
  triggerIcon?: string
  clear?: string
  content?: string
  listbox?: string
  item?: string
  itemIndicator?: string
  itemLabel?: string
  itemDescription?: string
  section?: string
  sectionLabel?: string
  tagsContainer?: string
  tag?: string
  tagRemove?: string
  empty?: string
}

type SelectSize = NonNullable<SelectControlVariantProps['size']>
type SelectColor = NonNullable<SelectControlVariantProps['color']>
type SelectVariant = NonNullable<SelectControlVariantProps['variant']>

export interface SelectBaseProps {
  /** Whether to allow multiple selections. When true, value is `SelectValue[]`. */
  multiple?: boolean

  /** Available options. */
  options?: SelectOption[]
  /** Custom field name mapping for option objects. */
  fieldNames?: SelectFieldNames

  /** Controlled value. */
  value?: SelectValue | null | SelectValue[]
  /** Initial uncontrolled value. */
  defaultValue?: SelectValue | null | SelectValue[]
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

  /** Characters that split input into tags (requires `multiple`). */
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
  color?: SelectColor
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

  id?: string
  name?: string
  required?: boolean

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

  class?: string
  classes?: SelectClasses
}

export type SelectProps = SelectBaseProps &
  Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof SelectBaseProps | 'id' | 'children'>

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
      size: 'md' as const,
      color: 'primary' as const,
      variant: 'outline' as const,
      placeholder: '',
      allowClear: false,
      loading: false,
    },
    props,
  )

  const [local, rest] = splitProps(merged as SelectProps, [
    'ref',
    'multiple',
    'options',
    'fieldNames',
    'value',
    'defaultValue',
    'onChange',
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
    'optionRender',
    'tagRender',
    'labelRender',
    'emptyRender',
    'size',
    'color',
    'variant',
    'highlight',
    'disabled',
    'placeholder',
    'loading',
    'loadingIcon',
    'leadingIcon',
    'triggerIcon',
    'id',
    'name',
    'required',
    'virtualized',
    'onScrollEnd',
    'scrollEndThreshold',
    'class',
    'classes',
  ])

  // ---- Form field integration ----
  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      color: local.color,
      highlight: local.highlight,
      disabled: local.disabled,
    }),
    { bind: false },
  )

  const componentId = useId(() => local.id, 'select')

  // ---- Resolved visual props ----
  const resolvedSize = createMemo<SelectSize>(() => (field.size() ?? local.size) as SelectSize)
  const resolvedColor = createMemo<SelectColor>(() => (field.color() ?? local.color) as SelectColor)

  const isInvalid = createMemo(() => field.ariaAttrs()?.['aria-invalid'] === true)

  // ---- Mode-derived booleans ----
  const isMultiple = createMemo(() => Boolean(local.multiple))
  const isSearchable = createMemo(() => Boolean(local.showSearch))

  // ---- Dynamically created options (allowCreate) ----
  const [createdTags, setCreatedTags] = createSignal<NormalizedOption[]>([])

  // ---- Normalize options for Kobalte ----
  const normalizedOptions = createMemo(() => {
    const base = normalizeOptions(local.options, local.fieldNames)

    if (isMultiple() && local.allowCreate) {
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

    if (local.value === undefined && local.defaultValue !== undefined) {
      const vals = (
        Array.isArray(local.defaultValue) ? local.defaultValue : [local.defaultValue]
      ) as SelectValue[]
      setSelectedValueSet(new Set(vals.map((v) => String(v))))
    }
  })

  // Options with maxCount enforcement: disable unselected items when at the limit
  const effectiveOptions = createMemo(() => {
    const base = normalizedOptions()
    if (!isMultiple() || local.maxCount === undefined) {
      return base
    }

    const selected = selectedValueSet()
    if (selected.size < local.maxCount!) {
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
    if (!isSearchable() || local.filterOption === false) {
      return (): boolean => true
    }

    if (typeof local.filterOption === 'function') {
      const userFilter = local.filterOption

      return (option: NormalizedOption, inputValue: string): boolean =>
        userFilter(inputValue, option.raw)
    }

    if (local.optionFilterProp) {
      const prop = local.optionFilterProp

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
      () => local.searchValue,
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
    if (!isMultiple() || local.value === undefined) {
      return undefined
    }
    const values = (Array.isArray(local.value) ? local.value : [local.value]) as SelectValue[]

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
    if (local.value === undefined) {
      return undefined
    }
    if (local.value === null) {
      return null
    }
    return findOptionByValue(local.value as SelectValue) ?? null
  })

  const kobalteDefaultValue = createMemo((): any => {
    if (isMultiple()) {
      if (local.defaultValue === undefined) {
        return undefined
      }
      const values = (
        Array.isArray(local.defaultValue) ? local.defaultValue : [local.defaultValue]
      ) as SelectValue[]
      return values
        .map((v) => findOptionByValue(v))
        .filter((o): o is NormalizedOption => o !== undefined)
    }
    if (local.defaultValue === undefined || local.defaultValue === null) {
      return undefined
    }
    return findOptionByValue(local.defaultValue as SelectValue)
  })

  // ---- onChange bridges ----
  function handleSingleChange(option: NormalizedOption | null): void {
    const nextValue = option ? (option.raw.value ?? option.value) : null

    local.onChange?.(nextValue as SelectValue | null)
    field.emitFormChange()
    field.emitFormInput()
  }

  function handleMultipleChange(options: NormalizedOption[]): void {
    setSelectedValueSet(new Set(options.map((o) => o.value)))

    const nextValue = options.map((o) => (o.raw.value ?? o.value) as SelectValue)

    local.onChange?.(nextValue)
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
    if (!isDismissing) {
      setCurrentInputText(inputValue)
    }

    // Token separator check for tags mode
    if (isMultiple() && local.tokenSeparators?.length) {
      const sepRegex = new RegExp(`[${escapeRegex(local.tokenSeparators.join(''))}]`)

      if (sepRegex.test(inputValue)) {
        const tokens = inputValue.split(sepRegex).filter((t) => t.trim())

        for (const token of tokens) {
          addTag(token.trim())
        }

        return
      }
    }

    local.onSearch?.(inputValue)
  }

  function addTag(text: string): NormalizedOption | undefined {
    if (!text) {
      return undefined
    }

    const exists = allFlatOptions().find((o) => o.value === text || o.label === text)

    if (exists) {
      return exists
    }

    const newOpt: NormalizedOption = {
      value: text,
      label: text,
      disabled: false,
      raw: { label: text, value: text },
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
    if (!isMultiple() || !local.allowCreate) {
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
    local.onSearch?.('')
    return true
  }

  // ---- Clear handler ----
  function handleClear(clearFn: () => void): void {
    clearFn()
    local.onClear?.()
    field.emitFormChange()
    field.emitFormInput()
  }

  // ---- Scroll end handler (infinite scroll) ----

  function handleListboxScroll(e: Event): void {
    if (!local.onScrollEnd) {
      return
    }

    const el = e.target as HTMLElement
    const threshold = local.scrollEndThreshold ?? 20

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      local.onScrollEnd()
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
        class={cn(selectItemLabelClasses, local.classes?.itemLabel)}
      >
        <Show when={local.labelRender} fallback={fallbackLabel}>
          {local.labelRender!(option)}
        </Show>
      </Combobox.ItemLabel>
    )
  }

  function renderItemDescription(option: SelectOption): JSX.Element {
    return (
      <Combobox.ItemDescription
        data-slot="item-description"
        class={cn(selectItemDescriptionClasses, local.classes?.itemDescription)}
      >
        {option.description}
      </Combobox.ItemDescription>
    )
  }

  function renderItemIndicator(indicatorIcon: IconName): JSX.Element {
    return (
      <Combobox.ItemIndicator
        data-slot="item-indicator"
        class={cn(selectItemIndicatorClasses, local.classes?.itemIndicator)}
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
        when={local.optionRender}
        fallback={
          <>
            <Show
              when={params.option.icon}
              fallback={renderItemLabel(params.option, params.fallbackLabel)}
            >
              {(icon) => (
                <span class="flex gap-2 col-start-1 items-center">
                  <Icon name={icon()} class="text-base shrink-0" />
                  {renderItemLabel(params.option, params.fallbackLabel)}
                </span>
              )}
            </Show>

            <Show when={params.option.description}>{renderItemDescription(params.option)}</Show>

            {renderItemIndicator(params.indicatorIcon)}
          </>
        }
      >
        {local.optionRender!(params.option, params.state)}
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
        class={selectItemVariants({ size: resolvedSize() }, local.classes?.item)}
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
    <Combobox.Section data-slot="section" class={cn(selectSectionClasses, local.classes?.section)}>
      <span
        data-slot="section-label"
        class={cn(selectSectionLabelClasses, local.classes?.sectionLabel)}
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

      if (local.maxTagCount === undefined) {
        return selected
      }

      return selected.slice(0, local.maxTagCount)
    })

    const overflowCount = createMemo(() => {
      if (local.maxTagCount === undefined) {
        return 0
      }
      const total = state.selectedOptions().length

      return Math.max(0, total - local.maxTagCount!)
    })

    const renderInput = (): JSX.Element => (
      <Combobox.Input
        ref={(el: HTMLInputElement) => {
          inputRef = el
        }}
        data-slot="input"
        class={selectInputVariants(
          {
            size: resolvedSize(),
            mode: isMultiple() ? (isSearchable() ? 'multiSearch' : 'multiHidden') : 'single',
            readOnly: !isSearchable() && !isMultiple(),
          },
          local.classes?.input,
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
          } else if (local.allowCreate) {
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
        <Show when={local.leadingIcon}>
          {(icon) => (
            <Icon
              name={icon()}
              data-slot="leading-icon"
              class={selectLeadingIconVariants(
                { size: resolvedSize() },
                local.classes?.leadingIcon,
              )}
            />
          )}
        </Show>

        {/* Multiple mode: tags + input in one flex-wrap container */}
        <Show when={isMultiple()} fallback={renderInput()}>
          <div
            data-slot="tags-container"
            class={cn(selectTagsContainerClasses, local.classes?.tagsContainer)}
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
              <span class="text-sm text-muted-foreground px-1">{local.placeholder}</span>
            </Show>
            <For each={visibleTags()}>
              {(option) => (
                <Show
                  when={local.tagRender}
                  fallback={
                    <span
                      data-slot="tag"
                      class={selectTagVariants({ size: resolvedSize() }, local.classes?.tag)}
                    >
                      {option.label}
                      <button
                        type="button"
                        data-slot="tag-remove"
                        class={cn(selectTagRemoveClasses, local.classes?.tagRemove)}
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation()
                          state.remove(option)
                        }}
                      >
                        <Icon name="icon-close" size="0.75em" />
                      </button>
                    </span>
                  }
                >
                  {local.tagRender!(option.raw, () => state.remove(option))}
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
        <Show when={local.allowClear && state.selectedOptions().length > 0}>
          <button
            type="button"
            data-slot="clear"
            class={selectClearVariants({ size: resolvedSize() }, local.classes?.clear)}
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation()
              handleClear(state.clear)
            }}
          >
            <Icon name="icon-close" />
          </button>
        </Show>

        {/* Trigger icon */}
        <Combobox.Trigger data-slot="trigger" class="outline-none">
          <Combobox.Icon
            data-slot="trigger-icon"
            class={selectTriggerIconVariants({ size: resolvedSize() }, local.classes?.triggerIcon)}
          >
            <Show
              when={!local.loading}
              fallback={<Icon name={local.loadingIcon ?? 'icon-loading'} class="animate-spin" />}
            >
              <Icon name={local.triggerIcon ?? 'icon-chevron-down'} />
            </Show>
          </Combobox.Icon>
        </Combobox.Trigger>
      </>
    )
  }

  // ---- Dropdown content ----
  function renderContent(): JSX.Element {
    return (
      <Combobox.Portal>
        <Combobox.Content
          data-slot="content"
          class={cn(selectContentClasses, local.classes?.content)}
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
                when={typeof local.emptyRender === 'function'}
                fallback={
                  <div data-slot="empty" class={cn(selectEmptyClasses, local.classes?.empty)}>
                    {typeof local.emptyRender === 'string' ? local.emptyRender : 'No options'}
                  </div>
                }
              >
                {(local.emptyRender as (ctx: SelectEmptyRenderContext) => JSX.Element)({
                  inputValue: currentInputText(),
                  multiple: isMultiple(),
                  hasMatches: hasMatches(),
                  selectedValues: [...selectedValueSet()].map((v) => {
                    const opt = findOptionByValue(v)
                    return opt ? (opt.raw.value ?? opt.value) : v
                  }) as SelectValue[],
                  isAtMaxCount:
                    isMultiple() && local.maxCount !== undefined
                      ? selectedValueSet().size >= local.maxCount
                      : false,
                  create: (value?: string): boolean => createTag(value),
                  close: () => kobalteCtx?.close(),
                })}
              </Show>
            }
          >
            <Show
              when={local.virtualized}
              fallback={
                <Combobox.Listbox
                  // ref={bindListboxScroll}
                  data-slot="listbox"
                  class={cn(selectListboxClasses, local.classes?.listbox)}
                  onScrollEnd={handleListboxScroll}
                />
              }
            >
              <Combobox.Listbox
                data-slot="listbox"
                class={cn(selectListboxClasses, local.classes?.listbox)}
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
      id={componentId()}
      name={field.name()}
      options={effectiveOptions()}
      optionValue="value"
      optionLabel="label"
      optionDisabled="disabled"
      optionTextValue="label"
      optionGroupChildren={hasGroups() ? 'options' : undefined}
      placeholder={isMultiple() && selectedValueSet().size > 0 ? '' : local.placeholder}
      onInputChange={handleInputChange}
      defaultFilter={kobalteFilter()}
      triggerMode="manual"
      disabled={field.disabled()}
      required={local.required}
      validationState={isInvalid() ? 'invalid' : 'valid'}
      allowsEmptyCollection={true}
      shouldFocusWrap={true}
      virtualized={local.virtualized}
      itemComponent={local.virtualized ? undefined : SelectItemComponent}
      sectionComponent={local.virtualized ? undefined : SelectSectionComponent}
      multiple={isMultiple() as any}
      value={kobalteValue()}
      defaultValue={kobalteDefaultValue()}
      onChange={(isMultiple() ? handleMultipleChange : handleSingleChange) as any}
      closeOnSelection={!isMultiple()}
      removeOnBackspace={isMultiple()}
      data-slot="root"
      class={cn(selectRootClasses, local.classes?.root, local.class)}
      {...field.ariaAttrs()}
      {...rest}
      overflowPadding={-6}
    >
      <ContextBridge />
      <Combobox.Control<NormalizedOption>
        data-slot="control"
        class={selectControlVariants(
          {
            size: resolvedSize(),
            color: resolvedColor(),
            variant: local.variant,
            highlight: field.highlight(),
            disabled: field.disabled(),
            invalid: isInvalid(),
          },
          local.classes?.control,
        )}
      >
        {(state) => renderTrigger(state)}
      </Combobox.Control>

      {renderContent()}
      <Combobox.HiddenSelect />
    </Combobox>
  )
}
