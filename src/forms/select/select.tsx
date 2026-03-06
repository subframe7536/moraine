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

import { Icon, IconButton } from '../../elements/icon'
import type { IconName } from '../../elements/icon'
import { overlayMenuContentVariants } from '../../overlays/shared-overlay-menu/menu.class'
import type { SlotClasses } from '../../shared/slot-class'
import { cn, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
  FormValueOptions,
} from '../form-field/form-options'
import { FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS } from '../form-field/form-options'

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

export type SelectOptionRender = (option: SelectOption & SelectOptionRenderState) => JSX.Element

export type SelectTagRender = (option: SelectOption & { onClose: () => void }) => JSX.Element

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
  | 'base'
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

  /** Enable search input. Defaults to `false`. */
  showSearch?: boolean
  /** Controlled search value. */
  searchValue?: string
  /** Default search value. */
  defaultSearchValue?: string
  /** Called when the search input changes. */
  onSearch?: (value: string) => void
  /** Maximum search text length applied on final commit. */
  searchMaxLength?: number
  /** Filter function or boolean. `false` disables filtering. */
  filterOption?: boolean | ((inputValue: string, option: SelectOption) => boolean)
  /** Property on option to filter by (default: label). */
  optionFilterProp?: string
  /** Controls which click target can open the menu. */
  openOnClick?: 'control' | 'trigger'

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

interface SelectControlState {
  selectedOptions: () => NormalizedOption[]
  remove: (option: NormalizedOption) => void
  clear: () => void
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
      variant: 'outlined' as const,
      placeholder: '',
      allowClear: false,
      triggerIcon: 'icon-chevron-down',
      loadingIcon: 'icon-loading',
      openOnClick: 'control' as const,
    },
    props,
  )

  const [formProps, searchInteractionProps, renderDisplayProps, styleProps, restProps] = splitProps(
    merged as SelectProps,
    [...FORM_ID_NAME_VALUE_REQUIRED_DISABLED_KEYS, 'onChange'],
    [
      'multiple',
      'showSearch',
      'searchValue',
      'defaultSearchValue',
      'onSearch',
      'searchMaxLength',
      'filterOption',
      'optionFilterProp',
      'openOnClick',
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
    () => ({
      bind: false,
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: formProps.defaultValue || searchInteractionProps.multiple ? [] : '',
    }),
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

  // ---- Input ref for controlled search ----
  let inputRef: HTMLInputElement | undefined

  // ---- Current input text tracking (for create-tag item) ----
  const [currentInputText, setCurrentInputText] = createSignal('')

  createEffect(
    on(
      () => searchInteractionProps.searchValue,
      (searchValue) => {
        if (searchValue === undefined || !inputRef) {
          return
        }

        if (inputRef.value !== searchValue) {
          inputRef.value = searchValue
        }
        setCurrentInputText(searchValue)
      },
    ),
  )

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

    field.setFormValue(nextValue ?? '')
    formProps.onChange?.(nextValue as SelectValue | null)
    field.emit('change')
    field.emit('input')
  }

  function handleMultipleChange(options: NormalizedOption[]): void {
    setSelectedValueSet(new Set(options.map((o) => o.value)))

    const nextValue = options.map((o) => (o.raw.value ?? o.value) as SelectValue)

    field.setFormValue(nextValue)
    formProps.onChange?.(nextValue)
    field.emit('change')
    field.emit('input')
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
    field.setFormValue(isMultiple() ? [] : '')
    searchInteractionProps.onClear?.()
    field.emit('change')
    field.emit('input')
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
  // When the dropdown closes via interact-outside, prevent FocusScope from
  // pulling focus back to the input.
  let closedByInteractOutside = false

  // ---- Trigger mode ----
  // Use 'manual' so the dropdown only opens on explicit user actions
  // (click, arrow-down, typing in searchable mode) — never on bare focus.
  // This prevents Tab from retriggering the menu via FocusScope's delayed
  // unmount-auto-focus.

  function SelectOptionRenderNode(props: {
    option: SelectOption
    state: SelectOptionRenderState
    indicatorIcon: IconName
    fallbackLabel: JSX.Element
  }): JSX.Element {
    function ItemLabel(): JSX.Element {
      return (
        <Combobox.ItemLabel
          data-slot="itemLabel"
          class={cn('col-start-1 truncate', styleProps.classes?.itemLabel)}
        >
          <Show when={renderDisplayProps.labelRender} fallback={props.fallbackLabel}>
            {renderDisplayProps.labelRender!(props.option)}
          </Show>
        </Combobox.ItemLabel>
      )
    }
    return (
      <Show
        when={!renderDisplayProps.optionRender}
        fallback={renderDisplayProps.optionRender!({ ...props.option, ...props.state })}
      >
        <Show when={props.option.icon} fallback={<ItemLabel />}>
          {(icon) => (
            <span class="flex gap-2 col-start-1 items-center">
              <Icon name={icon()} />
              {<ItemLabel />}
            </span>
          )}
        </Show>

        <Show when={props.option.description}>
          {(desc) => (
            <Combobox.ItemDescription
              data-slot="itemDescription"
              class={cn(
                'col-start-1 text-xs text-muted-foreground',
                styleProps.classes?.itemDescription,
              )}
            >
              {desc()}
            </Combobox.ItemDescription>
          )}
        </Show>

        <Combobox.ItemIndicator
          data-slot="itemTrailing"
          class={cn(
            'col-start-2 inline-flex items-center justify-center text-sm',
            styleProps.classes?.itemTrailing,
          )}
        >
          <Icon name={props.indicatorIcon} />
        </Combobox.ItemIndicator>
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
        <SelectOptionRenderNode
          option={raw()}
          state={renderState()}
          indicatorIcon="icon-check"
          fallbackLabel={itemProps.item.rawValue.label}
        />
      </Combobox.Item>
    )
  }

  const SelectSectionComponent: Component<ComboboxRootSectionComponentProps<NormalizedGroup>> = (
    sectionProps,
  ) => (
    <Combobox.Section
      data-slot="group"
      class={cn('[&:not(:first-child)]:mt-1.5', styleProps.classes?.group)}
    >
      <span
        data-slot="label"
        class={cn(
          'block px-2 py-1.5 font-medium text-muted-foreground text-xs',
          styleProps.classes?.label,
        )}
      >
        {sectionProps.section.rawValue.label}
      </span>
    </Combobox.Section>
  )

  function SelectTriggerIcon(props: Record<string, unknown>): JSX.Element {
    return (
      <IconButton
        data-slot="trigger"
        name={renderDisplayProps.triggerIcon}
        class={selectTriggerIconVariants({ size: field.size() }, styleProps.classes?.trigger)}
        loading={renderDisplayProps.loading}
        loadingIcon={renderDisplayProps.loadingIcon}
        {...props}
        tabIndex={-1}
      />
    )
  }

  function SelectTriggerContent(props: SelectControlState): JSX.Element {
    const context = useComboboxContext()

    const visibleTags = createMemo(() => {
      const selected = props.selectedOptions()

      if (searchInteractionProps.maxTagCount === undefined) {
        return selected
      }

      return selected.slice(0, searchInteractionProps.maxTagCount)
    })

    const overflowCount = createMemo(() => {
      if (searchInteractionProps.maxTagCount === undefined) {
        return 0
      }
      const total = props.selectedOptions().length

      return Math.max(0, total - searchInteractionProps.maxTagCount!)
    })

    function openMenu(): void {
      if (!context.isOpen()) {
        context.open(false, 'manual')
      }
    }

    function Input(): JSX.Element {
      return (
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
          maxLength={searchInteractionProps.searchMaxLength}
          onInput={(event: InputEvent) => {
            if (!isSearchable()) {
              return
            }

            const nextValue = (event.currentTarget as HTMLInputElement).value
            if (nextValue.trim() !== '') {
              openMenu()
            }
          }}
          onClick={() => {
            if (searchInteractionProps.openOnClick === 'control') {
              // With triggerMode="manual", clicks don't auto-open.
              // Open explicitly so click-to-open works.
              openMenu()
            }
          }}
          onKeyDown={(e: KeyboardEvent) => {
            // Flag dismiss keys so handleInputChange skips setCurrentInputText
            // during Kobalte's synchronous resetInputValue call that follows.
            if (e.key === 'Escape' || (e.key === 'Tab' && context.isOpen())) {
              isDismissing = true
              queueMicrotask(() => {
                isDismissing = false
              })
            }

            if (e.key === 'Tab') {
              if (context.isOpen()) {
                const selectionManager = context.listState().selectionManager()
                const focusedKey = selectionManager.focusedKey()

                if (focusedKey && !selectionManager.isDisabled(focusedKey)) {
                  if (isMultiple()) {
                    selectionManager.toggleSelection(focusedKey)
                  } else {
                    selectionManager.select(focusedKey)
                  }
                }

                // Keep focus on the select after the first Tab when menu is open.
                e.preventDefault()
              }
              return
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
              const current = props.selectedOptions()
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
          onFocus={() => field.emit('focus')}
          onBlur={() => field.emit('blur')}
        />
      )
    }

    return (
      <>
        {/* Leading icon */}
        <Show when={renderDisplayProps.leadingIcon}>
          {(icon) => (
            <Icon
              name={icon()}
              data-slot="leading"
              class={selectLeadingIconVariants({ size: field.size() }, styleProps.classes?.leading)}
            />
          )}
        </Show>

        {/* Multiple mode: tags + input in one flex-wrap container */}
        <Show when={isMultiple()} fallback={<Input />}>
          <div
            data-slot="tagsContainer"
            class={cn(
              'flex flex-1 cursor-pointer select-none flex-wrap items-center gap-1 p-1.5',
              styleProps.classes?.tagsContainer,
            )}
            onPointerDown={(e) => {
              e.preventDefault()
              inputRef?.focus()
              if (searchInteractionProps.openOnClick === 'control') {
                // With triggerMode="manual", focus alone won't open.
                // Open explicitly so clicking the tags area opens the dropdown.
                openMenu()
              }
            }}
          >
            <Show when={!isSearchable() && props.selectedOptions().length === 0}>
              <span class="text-sm text-muted-foreground px-1">
                {renderDisplayProps.placeholder}
              </span>
            </Show>
            <For each={visibleTags()}>
              {(option) => {
                const onClose = () => props.remove(option)
                return (
                  <Show
                    when={!renderDisplayProps.tagRender}
                    fallback={renderDisplayProps.tagRender!({ ...option.raw, onClose })}
                  >
                    <span
                      data-slot="tag"
                      class={selectTagVariants({ size: field.size() }, styleProps.classes?.tag)}
                    >
                      {option.label}
                      <IconButton
                        name={renderDisplayProps.closeIcon ?? 'icon-close'}
                        data-slot="tagRemove"
                        class={cn('size-4 outline-none', styleProps.classes?.tagRemove)}
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                        }}
                      />
                    </span>
                  </Show>
                )
              }}
            </For>

            <Show when={overflowCount() > 0}>
              <span
                data-slot="tagOverflow"
                class="text-xs text-muted-foreground px-1 flex items-center"
              >
                +{overflowCount()}
              </span>
            </Show>

            <Input />
          </div>
        </Show>

        {/* Clear button */}
        <Show when={searchInteractionProps.allowClear && props.selectedOptions().length > 0}>
          <IconButton
            name="icon-close"
            data-slot="clear"
            class={selectClearVariants({ size: field.size() }, styleProps.classes?.clear)}
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation()
              handleClear(props.clear)
            }}
          />
        </Show>

        {/* Trigger icon */}
        <Combobox.Trigger
          as={SelectTriggerIcon}
          onClick={(event: MouseEvent) => {
            // fireEvent.click doesn't emit pointerdown; provide a click fallback.
            if (!(event.currentTarget as HTMLElement).dataset.pointerType) {
              openMenu()
            }
          }}
        />
      </>
    )
  }

  function SelectEmptyNode(): JSX.Element {
    const context = useComboboxContext()

    return (
      <Show
        when={typeof renderDisplayProps.emptyRender === 'function'}
        fallback={
          <div
            data-slot="empty"
            class={cn('p-2 text-center text-muted-foreground text-sm', styleProps.classes?.empty)}
          >
            {typeof renderDisplayProps.emptyRender === 'string'
              ? renderDisplayProps.emptyRender
              : 'No options'}
          </div>
        }
      >
        {(renderDisplayProps.emptyRender as Exclude<SelectEmptyRender, string>)({
          inputValue: currentInputText(),
          multiple: isMultiple(),
          hasMatches: hasMatches(),
          selectedValues: [...selectedValueSet()].map((value) => {
            const option = findOptionByValue(value)
            return option ? (option.raw.value ?? option.value) : value
          }) as SelectValue[],
          isAtMaxCount:
            isMultiple() && searchInteractionProps.maxCount !== undefined
              ? selectedValueSet().size >= searchInteractionProps.maxCount
              : false,
          create: (value?: string): boolean => createTag(value),
          close: () => context.close(),
        })}
      </Show>
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
            if (closedByInteractOutside) {
              e.preventDefault()
              closedByInteractOutside = false
            }
          }}
        >
          <Show
            when={hasMatches()}
            fallback={
              /* Empty state */
              <SelectEmptyNode />
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
      class={cn('relative inline-flex w-full h-fit', styleProps.classes?.root)}
      {...field.ariaAttrs()}
      {...restProps}
      overflowPadding={-2}
    >
      <Combobox.Control<NormalizedOption>
        data-slot="base"
        data-invalid={field.invalid() ? '' : undefined}
        class={selectControlVariants(
          {
            size: field.size(),
            variant: styleProps.variant,
            highlight: field.highlight(),
            disabled: field.disabled(),
          },
          styleProps.classes?.base,
        )}
      >
        {(state) => <SelectTriggerContent {...state} />}
      </Combobox.Control>

      {renderContent()}
      <Combobox.HiddenSelect />
    </Combobox>
  )
}
