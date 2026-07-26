import type { Accessor, Component, JSX } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js'
import { Portal } from 'solid-js/web'

import type { IconT } from '../../elements/icon'
import { List } from '../../elements/list'
import type { ListT } from '../../elements/list'
import {
  overlayMenuContentVariants,
  useOverlayMenuDismiss,
  useOverlayMenuFloatingPosition,
} from '../../overlays/base/menu'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { callHandler, cn, useId } from '../../shared/utils'
import type { UseFormFieldReturn } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
} from '../form-field/form-options'

import type { SelectControlVariantProps } from './select.class'
import { selectItemVariants } from './select.class'
import { flattenOptions, normalizeOptions, useSelectField, useSelectMenuControl } from './shared'
import type { BaseSelectItems, NormalizedGroup, NormalizedOption, SelectFilterMode } from './shared'

export namespace BaseSelectT {
  export type Value = string | number

  export interface OptionRenderState {
    /** Whether the option is currently selected. */
    isSelected: boolean
    /** Whether the option is currently highlighted/focused. */
    isHighlighted: boolean
    /** Whether the option is disabled. */
    isDisabled: boolean
  }

  export interface Item<Val extends Value = Value> extends BaseSelectItems<Item<Val>> {
    /** Label to display for the option, or the option group title. */
    label?: string | JSX.Element
    /** Text key used for filtering and matching; set this when `label` is not a string. */
    key?: string
    /** Value of the option. */
    value?: Val
    /** Whether the option is disabled. */
    disabled?: boolean
    /** Description shown below the label. */
    description?: string | JSX.Element
    /** Icon shown next to the label. */
    icon?: IconT.Name
    /** One-layer child options for grouped select. */
    children?: Omit<Item<Val>, 'children'>[]
  }

  export interface StateApi<TItem extends Item> {
    allFlatOptions: Accessor<NormalizedOption<TItem>[]>
    close: () => void
    field: UseFormFieldReturn
    highlightedKey: Accessor<string | undefined>
    inputValue: Accessor<string>
    isOpen: Accessor<boolean>
    setInputValue: (value: string) => void
    visibleFlatOptions: Accessor<NormalizedOption<TItem>[]>
  }

  export interface ControlApi<TItem extends Item> extends StateApi<TItem> {
    controlProps: Accessor<JSX.HTMLAttributes<HTMLDivElement>>
    focusInput: () => void
    inputProps: Accessor<JSX.InputHTMLAttributes<HTMLInputElement>>
    isSearchable: Accessor<boolean>
    onInput: (event: InputEvent) => void
    onKeyDown: (event: KeyboardEvent) => void
    toggle: () => void
  }

  export interface OptionSelectContext<TItem extends Item> {
    allFlatOptions: Accessor<NormalizedOption<TItem>[]>
    field: UseFormFieldReturn
    setInputValue: (value: string) => void
  }

  export interface VirtualLabelEntry {
    /** Structural entry rendered before a grouped option collection. */
    type: 'label'
    /** Stable key used by a virtualizer. */
    key: string
    /** Group label content. */
    label: JSX.Element
  }

  export interface VirtualItemEntry<TItem extends Item> {
    /** Selectable option entry. */
    type: 'item'
    /** Stable normalized option key. */
    key: string
    /** Source option passed to Select or MultiSelect. */
    item: TItem
    /** Whether the option cannot be selected. */
    disabled: boolean
  }

  export type VirtualEntry<TItem extends Item> = VirtualLabelEntry | VirtualItemEntry<TItem>

  export type VirtualRenderProps<TItem extends Item> = ListT.VirtualRenderProps<
    VirtualEntry<TItem>,
    HTMLDivElement,
    HTMLDivElement
  >

  export interface Slot<T = unknown> {
    /**
     * Select root that owns open state, value display, and popup positioning.
     */
    root?: T

    /** Popup panel that contains search input, options, groups, and empty state. */
    content?: T

    /** ARIA listbox that contains selectable options. */
    listbox?: T

    /** Selectable option row inside the listbox. */
    item?: T

    /** Option group wrapper inside the listbox. */
    group?: T

    /** Group label or option label text, depending on context. */
    label?: T
  }

  export type Variant = SelectControlVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base<TItem extends Item>
    extends FormIdentityOptions, FormRequiredOption, FormDisableOption {
    /** Available options. */
    options?: TItem[]
    /** Controlled open state. */
    open?: boolean
    /**
     * Initial open state.
     * @default false
     */
    defaultOpen?: boolean
    /** Called whenever the popup open state changes. */
    onOpenChange?: (open: boolean) => void
    /** Renders flattened group labels and options through a caller-provided virtualization layer. */
    virtualRender?: Component<VirtualRenderProps<TItem>>
    /** Scrolls a highlighted raw option into view using its flattened entry index. */
    scrollToItem?: (item: TItem, entryIndex: number) => void
    /** Additional attributes for the listbox element. */
    listboxProps?: ElementProps<HTMLDivElement>
    /** Additional attributes for an option row. */
    itemProps?: (option: TItem & OptionRenderState) => ElementProps<HTMLDivElement> | undefined
    /**
     * Enable search input.
     * @default false
     */
    search?: boolean
    /** Controlled search value. */
    searchValue?: string
    /**
     * Default search value.
     * @default ''
     */
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
      | ((inputValue: string, option: TItem) => boolean)
    /**
     * Current selected values used only to derive selected option state.
     * @default []
     */
    selectedValues?: Value[]
    /** Internal flag that selects native single or multiple form semantics. */
    multiple?: boolean
    /** Form value used when the field initializes. */
    initialValue?: unknown
    /** Render the trigger/control surface. */
    children: (api: ControlApi<TItem>) => JSX.Element
    /** Renderer for each option in the dropdown. Receives `null` when no option matches. */
    optionRender: (option: (TItem & OptionRenderState) | null) => JSX.Element
    /** Custom rendered empty state. */
    emptyRender?: (context: StateApi<TItem>) => JSX.Element | undefined
    /** Called when an option is selected by pointer or keyboard. */
    onOptionSelect: (option: NormalizedOption<TItem>, context: OptionSelectContext<TItem>) => void
    /**
     * Called on option item keydown. Can be used to intercept keys for custom behavior.
     */
    onInputKeyDown?: (event: KeyboardEvent, context: StateApi<TItem>) => void
    /**
     * Called when the listbox is scrolled to bottom. Useful for infinite loading scenarios. Make sure to set `overflowPadding` and `scrollBottomThreshold` appropriately to ensure the callback is triggered at the right time.
     */
    onScrollBottom?: () => void
    /**
     * Distance (px) from the bottom at which onScrollBottom fires.
     * @default 20
     */
    scrollBottomThreshold?: number
    /**
     * Padding (px) used when calculating popup overflow and viewport collision.
     * @default 4
     */
    overflowPadding?: number
    /**
     * Gap (px) between the control and popup content.
     * @default 0
     */
    gutter?: number
    /**
     * Whether the select closes after selection.
     * @default true
     */
    closeOnSelect?: boolean
  }

  export interface Props<TItem extends Item> extends BaseProps<Base<TItem>, Variant, Slot> {}
}

export interface BaseSelectProps<TItem extends BaseSelectT.Item> extends BaseSelectT.Props<TItem> {}

const SELECT_FILTER_STRATEGIES: Record<SelectFilterMode, (text: string, input: string) => boolean> =
  {
    startsWith: (text, input) => text.startsWith(input),
    endsWith: (text, input) => text.endsWith(input),
    contains: (text, input) => text.includes(input),
  }

function resolveSelectContentSide(placement: string): 'top' | 'right' | 'bottom' | 'left' {
  const [side] = placement.split('-')

  if (side === 'top' || side === 'right' || side === 'bottom' || side === 'left') {
    return side
  }

  return 'bottom'
}

function resolveSelectContentOrigin(
  side: 'top' | 'right' | 'bottom' | 'left',
): 'bottom center' | 'center left' | 'top center' | 'center right' {
  switch (side) {
    case 'top':
      return 'bottom center'
    case 'right':
      return 'center left'
    case 'left':
      return 'center right'
    default:
      return 'top center'
  }
}

function matchesFilter<TOption extends { key: string }>(
  option: TOption,
  inputValue: string,
  filter: SelectFilterMode | ((option: TOption, inputValue: string) => boolean),
): boolean {
  if (typeof filter === 'function') {
    return filter(option, inputValue)
  }

  const input = inputValue.toLowerCase()
  const text = option.key.toLowerCase()
  return (SELECT_FILTER_STRATEGIES[filter] ?? SELECT_FILTER_STRATEGIES.contains)(text, input)
}

function scrollHighlightedItemIntoView(listbox: HTMLElement | undefined): void {
  const highlightedItem = listbox?.querySelector<HTMLElement>(
    '[data-slot="item"][data-highlighted]',
  )

  highlightedItem?.scrollIntoView?.({ block: 'nearest' })
}

function toStyleObject(
  style: string | JSX.CSSProperties | undefined,
): JSX.CSSProperties | undefined {
  return typeof style === 'object' ? style : undefined
}

function callRef<T extends HTMLElement>(
  ref: T | ((element: T) => void) | undefined,
  element: T,
): void {
  if (typeof ref === 'function') {
    ref(element)
  }
}

function useSelectNavigation<TItem extends BaseSelectT.Item>(options: {
  highlightedKey: Accessor<string | undefined>
  isOpen: Accessor<boolean>
  selectedValues: Accessor<BaseSelectT.Value[]>
  setHighlightedKey: (key: string | undefined) => void
  visibleFlatOptions: Accessor<NormalizedOption<TItem>[]>
}) {
  const { focusBoundary, focusByOffset } = useSelectableCollectionNavigation<
    NormalizedOption<TItem>,
    string
  >({
    items: options.visibleFlatOptions,
    getValue: (option) => option.key,
    isDisabled: (option) => option.disabled,
    activationMode: () => 'manual',
    focusValue: options.setHighlightedKey,
    onSelect: () => undefined,
    loop: () => true,
  })

  function getFocusedOption(): NormalizedOption<TItem> | undefined {
    const key =
      options.highlightedKey() ??
      options.visibleFlatOptions().find((option) => !option.disabled)?.key
    if (!key) {
      return undefined
    }

    return options.visibleFlatOptions().find((option) => option.key === key)
  }

  createEffect(() => {
    if (!options.isOpen()) {
      options.setHighlightedKey(undefined)
      return
    }

    const highlighted = options.highlightedKey()
    const enabledOptions = options.visibleFlatOptions().filter((option) => !option.disabled)
    if (highlighted && enabledOptions.some((option) => option.key === highlighted)) {
      return
    }

    const selectedValueSet = new Set(options.selectedValues().map((value) => String(value)))
    const selectedOption = enabledOptions.find((option) => selectedValueSet.has(option.value))

    options.setHighlightedKey(selectedOption?.key ?? enabledOptions[0]?.key)
  })

  return {
    focusBoundaryItem: focusBoundary,
    focusItemByOffset: (delta: number) => focusByOffset(options.highlightedKey(), delta),
    getFocusedOption,
  }
}

function useBaseSelectOverlay(options: {
  closeMenu: () => void
  contentElement: Accessor<HTMLDivElement | undefined>
  contentPresence: ReturnType<typeof useTransitionPresence>
  getControlElement: () => HTMLDivElement | undefined
  gutter: Accessor<number>
  isOpen: Accessor<boolean>
  menuControl: ReturnType<typeof useSelectMenuControl>
  onPlacementChange: (placement: `${'top' | 'right' | 'bottom' | 'left'}${string}`) => void
  overflowPadding: Accessor<number>
  positionerElement: Accessor<HTMLDivElement | undefined>
}) {
  useOverlayMenuFloatingPosition({
    contentElement: options.contentElement,
    floatingElement: options.positionerElement,
    getReferenceElement: options.getControlElement,
    gutter: options.gutter,
    onPositionedChange: () => undefined,
    onPlacementChange: options.onPlacementChange,
    open: options.isOpen,
    overflowPadding: options.overflowPadding,
    placement: () => 'bottom-start',
  })

  createEffect(() => {
    if (!options.contentPresence.present()) {
      options.contentPresence.setElement(undefined)
    }
  })

  createEffect(() => {
    const positioner = options.positionerElement()
    const content = options.contentElement()
    if (!positioner || !content) {
      return
    }

    queueMicrotask(() => {
      positioner.style.zIndex = getComputedStyle(content).zIndex
    })
  })

  useOverlayMenuDismiss({
    containsTarget: (node) => {
      const positioner = options.positionerElement()
      return Boolean(
        options.getControlElement()?.contains(node as Node) || positioner?.contains(node as Node),
      )
    },
    onClose: () => {
      options.menuControl.onContentInteractOutside()
      options.closeMenu()
    },
    open: options.isOpen,
  })
}

export function BaseSelect<TItem extends BaseSelectT.Item>(
  props: BaseSelectProps<TItem>,
): JSX.Element {
  const merged = mergeProps(
    {
      variant: 'outline',
      filterOption: true,
      overflowPadding: 4,
      closeOnSelect: true,
    },
    props,
  )
  const listboxId = useId(() => merged.id && `${merged.id}-listbox`, 'base-select-listbox')

  const field = useSelectField(() => ({
    id: merged.id,
    name: merged.name,
    size: merged.size,
    disabled: merged.disabled,
    initialValue: merged.initialValue,
  }))
  const isSearchable = createMemo(() => Boolean(merged.search))

  const normalizedOptions = createMemo<Array<NormalizedOption<TItem> | NormalizedGroup<TItem>>>(
    () =>
      normalizeOptions(merged.options as never) as Array<
        NormalizedOption<TItem> | NormalizedGroup<TItem>
      >,
  )
  const allFlatOptions = createMemo<NormalizedOption<TItem>[]>(() =>
    flattenOptions(normalizedOptions()),
  )
  const selectedValues = createMemo(() =>
    (merged.selectedValues ?? []).map((value) => String(value)),
  )
  const nativeFormOptions = createMemo<NormalizedOption<TItem>[]>(() => {
    const optionsByValue = new Map(allFlatOptions().map((option) => [option.value, option]))
    const selected = selectedValues()
      .map((value) => optionsByValue.get(value))
      .filter((option): option is NormalizedOption<TItem> => option !== undefined)
    const selectedValuesSet = new Set(selected.map((option) => option.value))

    return [
      ...selected,
      ...allFlatOptions().filter((option) => !selectedValuesSet.has(option.value)),
    ]
  })

  const [openState, setOpenState] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(openState()))

  let controlRef: HTMLDivElement | undefined
  let comboboxRef: HTMLElement | undefined
  let listboxRef: HTMLDivElement | undefined
  let nativeFormSelectRef: HTMLSelectElement | undefined
  let hasReachedScrollBottom = false

  const [currentInputText, setCurrentInputText] = createSignal(merged.defaultSearchValue ?? '')
  const [highlightedKey, setHighlightedKey] = createSignal<string | undefined>()
  const [contentSide, setContentSide] = createSignal<'top' | 'right' | 'bottom' | 'left'>('bottom')
  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const contentPresence = useTransitionPresence({
    open: isOpen,
  })

  createEffect(
    on(
      () => merged.searchValue,
      (searchValue) => {
        if (searchValue === undefined) {
          return
        }

        setCurrentInputText(searchValue)
      },
    ),
  )

  createEffect(() => {
    const select = nativeFormSelectRef
    if (!select) {
      return
    }

    const values = new Set(selectedValues())
    for (const option of select.options) {
      option.selected = option.hasAttribute('data-empty-option')
        ? !merged.multiple && values.size === 0
        : values.has(option.value)
    }
  })

  const visibleOptions = createMemo<Array<NormalizedOption<TItem> | NormalizedGroup<TItem>>>(() => {
    const options = normalizedOptions()
    const inputValue = currentInputText()
    const filterOption = merged.filterOption

    if (!isSearchable() || filterOption === false || inputValue.trim() === '') {
      return options
    }

    const filter:
      | boolean
      | 'startsWith'
      | 'endsWith'
      | 'contains'
      | ((option: NormalizedOption<TItem>, inputValue: string) => boolean) =
      typeof filterOption === 'function'
        ? (option, value) => filterOption(value, option.raw)
        : filterOption === true || filterOption === undefined
          ? 'contains'
          : filterOption

    const result: Array<NormalizedOption<TItem> | NormalizedGroup<TItem>> = []

    for (const item of options) {
      if (item.isGroup) {
        const options = item.options.filter((option) => matchesFilter(option, inputValue, filter))
        if (options.length > 0) {
          result.push({ ...item, options })
        }
        continue
      }

      if (matchesFilter(item, inputValue, filter)) {
        result.push(item)
      }
    }

    return result
  })

  const visibleFlatOptions = createMemo<NormalizedOption<TItem>[]>(() =>
    flattenOptions(visibleOptions()),
  )
  const visibleOptionByKey = createMemo(
    () => new Map(visibleFlatOptions().map((option) => [option.key, option])),
  )
  const visibleOptionPositionByKey = createMemo(
    () => new Map(visibleFlatOptions().map((option, index) => [option.key, index + 1])),
  )
  const virtualEntries = createMemo<BaseSelectT.VirtualEntry<TItem>[]>(() => {
    const entries: BaseSelectT.VirtualEntry<TItem>[] = []

    for (const [index, item] of visibleOptions().entries()) {
      if (!item.isGroup) {
        entries.push({
          type: 'item',
          key: item.key,
          item: item.raw,
          disabled: item.disabled,
        })
        continue
      }

      entries.push({
        type: 'label',
        key: `group-${index}`,
        label: item.label,
      })

      for (const option of item.options) {
        entries.push({
          type: 'item',
          key: option.key,
          item: option.raw,
          disabled: option.disabled,
        })
      }
    }

    return entries
  })
  const selectedValueSet = createMemo(() => new Set(selectedValues()))

  function setMenuOpen(nextOpen: boolean): void {
    if (field.disabled()) {
      return
    }

    setOpenState(nextOpen)
    merged.onOpenChange?.(nextOpen)
  }

  function closeMenu(): void {
    if (isSearchable() && visibleFlatOptions().length === 0) {
      setCurrentInputText('')
      merged.onSearch?.('')
    }

    setMenuOpen(false)
  }

  const menuControl = useSelectMenuControl({
    close: closeMenu,
    isOpen,
    open: () => setMenuOpen(true),
  })
  const navigation = useSelectNavigation({
    highlightedKey,
    isOpen,
    selectedValues: () => merged.selectedValues ?? [],
    setHighlightedKey,
    visibleFlatOptions,
  })

  function setInputValue(inputValue: string): void {
    if (!menuControl.isDismissing()) {
      setCurrentInputText(inputValue)
    }

    merged.onSearch?.(inputValue)
  }

  function selectOption(option: NormalizedOption<TItem>): void {
    if (option.disabled) {
      return
    }

    merged.onOptionSelect(option, {
      allFlatOptions,
      field,
      setInputValue,
    })

    if (merged.closeOnSelect) {
      closeMenu()
      queueMicrotask(() => comboboxRef?.focus())
    }
  }

  const stateApi: BaseSelectT.StateApi<TItem> = {
    allFlatOptions,
    close: closeMenu,
    field,
    highlightedKey,
    inputValue: currentInputText,
    isOpen,
    setInputValue,
    visibleFlatOptions,
  }

  function handleInput(event: InputEvent): void {
    if (!isSearchable()) {
      return
    }

    const nextValue = (event.currentTarget as HTMLInputElement).value
    if (nextValue.trim() !== '') {
      menuControl.openMenu()
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || (event.key === 'Tab' && isOpen())) {
      menuControl.markDismissing()
    }

    if (event.key === 'Tab') {
      return
    }

    merged.onInputKeyDown?.(event, stateApi)
    if (event.defaultPrevented) {
      return
    }

    if ((event.key === ' ' || event.key === 'Spacebar') && isOpen()) {
      const option = navigation.getFocusedOption()
      event.preventDefault()
      if (option && !option.disabled) {
        selectOption(option)
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen()) {
        setMenuOpen(true)
      }
      navigation.focusItemByOffset(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen()) {
        setMenuOpen(true)
      }
      navigation.focusItemByOffset(-1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      navigation.focusBoundaryItem('first')
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      navigation.focusBoundaryItem('last')
      return
    }

    if (event.key === 'Enter') {
      if (!isOpen()) {
        setMenuOpen(true)
        return
      }

      const option = navigation.getFocusedOption()
      if (!option || option.disabled) {
        return
      }

      event.preventDefault()
      selectOption(option)
      return
    }

    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault()
      closeMenu()
    }
  }

  const activeDescendantId = createMemo(() =>
    highlightedKey() ? `${listboxId()}-${encodeURIComponent(String(highlightedKey()))}` : undefined,
  )

  const controlProps = createMemo<JSX.HTMLAttributes<HTMLDivElement>>(() => {
    const sharedProps: JSX.HTMLAttributes<HTMLDivElement> = {
      ref: (element: HTMLDivElement | undefined) => {
        controlRef = element
        if (!isSearchable()) {
          comboboxRef = element
        }
      },
      onPointerDown: (event: PointerEvent) => {
        event.preventDefault()
        comboboxRef?.focus()
      },
      onClick: menuControl.toggleMenu,
    }

    if (isSearchable()) {
      return sharedProps
    }

    return {
      ...sharedProps,
      id: field.id(),
      role: 'combobox',
      'aria-controls': listboxId(),
      'aria-expanded': isOpen() ? 'true' : 'false',
      'aria-haspopup': 'listbox',
      'aria-activedescendant': activeDescendantId(),
      'aria-invalid': field.invalid() ? 'true' : undefined,
      'aria-required': merged.required || undefined,
      'aria-disabled': field.disabled() || undefined,
      tabIndex: field.disabled() ? undefined : 0,
      onKeyDown: handleKeyDown,
      onFocus: (event) => field.emit('focus', event),
      onBlur: (event) => field.emit('blur', event),
      ...field.ariaAttrs(),
    }
  })

  const inputProps = createMemo<JSX.InputHTMLAttributes<HTMLInputElement>>(() => ({
    ref: (element: HTMLInputElement | undefined) => {
      if (element) {
        comboboxRef = element
      }
    },
    id: field.id(),
    role: 'combobox',
    'aria-controls': listboxId(),
    'aria-expanded': isOpen() ? 'true' : 'false',
    'aria-haspopup': 'listbox',
    'aria-autocomplete': 'list',
    'aria-activedescendant': activeDescendantId(),
    disabled: field.disabled(),
    'aria-invalid': field.invalid() ? 'true' : undefined,
    'aria-required': merged.required || undefined,
    'aria-disabled': field.disabled() || undefined,
    maxLength: merged.searchMaxLength,
    value: currentInputText(),
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    onFocus: (event) => field.emit('focus', event),
    onBlur: (event) => field.emit('blur', event),
    ...field.ariaAttrs(),
  }))

  useBaseSelectOverlay({
    closeMenu,
    contentElement,
    contentPresence,
    getControlElement: () => controlRef,
    gutter: () => merged.gutter ?? 0,
    isOpen,
    menuControl,
    onPlacementChange: (placement) => {
      setContentSide(resolveSelectContentSide(placement))
    },
    overflowPadding: () => merged.overflowPadding ?? 4,
    positionerElement,
  })

  createEffect(() => {
    const key = highlightedKey()
    if (!isOpen() || !key || !contentElement() || !listboxRef) {
      return
    }

    const option = visibleOptionByKey().get(key)
    if (!option) {
      return
    }

    if (merged.virtualRender && merged.scrollToItem) {
      const entryIndex = virtualEntries().findIndex(
        (entry) => entry.type === 'item' && entry.key === key,
      )
      if (entryIndex >= 0) {
        merged.scrollToItem(option.raw, entryIndex)
        return
      }
    }

    queueMicrotask(() => {
      scrollHighlightedItemIntoView(listboxRef)
    })
  })

  function handleListboxScroll(event: Event): void {
    const target = event.currentTarget as HTMLElement | null
    if (!target) {
      return
    }

    const threshold = merged.scrollBottomThreshold ?? 20
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold
    if (isAtBottom) {
      if (hasReachedScrollBottom) {
        return
      }
      hasReachedScrollBottom = true
      merged.onScrollBottom?.()
      return
    }

    hasReachedScrollBottom = false
  }

  function renderVisibleOption(
    option: NormalizedOption<TItem>,
    virtualProps?: ListT.RowProps<HTMLDivElement>,
  ): JSX.Element {
    const isSelected = createMemo(() => selectedValueSet().has(option.value))
    const renderContext = createMemo(() => ({
      ...option.raw,
      isSelected: isSelected(),
      isHighlighted: highlightedKey() === option.key,
      isDisabled: option.disabled,
    }))
    const itemAttributes = createMemo(() => merged.itemProps?.(renderContext()))

    return (
      <div
        id={`${listboxId()}-${encodeURIComponent(option.key)}`}
        role="option"
        tabIndex={-1}
        data-slot="item"
        data-disabled={option.disabled ? '' : undefined}
        data-highlighted={highlightedKey() === option.key ? '' : undefined}
        aria-disabled={option.disabled || undefined}
        aria-selected={isSelected() ? 'true' : 'false'}
        aria-posinset={
          merged.virtualRender ? visibleOptionPositionByKey().get(option.key) : undefined
        }
        aria-setsize={merged.virtualRender ? visibleFlatOptions().length : undefined}
        {...itemAttributes()}
        {...virtualProps}
        ref={(element) => {
          callRef(itemAttributes()?.ref, element)
          virtualProps?.ref?.(element)
        }}
        style={{
          ...merged.styles?.item,
          ...toStyleObject(itemAttributes()?.style),
          ...toStyleObject(virtualProps?.style),
        }}
        class={selectItemVariants(
          { size: merged.size },
          merged.classes?.item,
          itemAttributes()?.class,
          virtualProps?.class,
        )}
        onPointerMove={(event) => {
          callHandler(event, itemAttributes()?.onPointerMove)
          callHandler(event, virtualProps?.onPointerMove)
          if (!event.defaultPrevented && event.pointerType === 'mouse' && !option.disabled) {
            setHighlightedKey(option.key)
          }
        }}
        onPointerDown={(event) => {
          callHandler(event, itemAttributes()?.onPointerDown)
          callHandler(event, virtualProps?.onPointerDown)
          if (!event.defaultPrevented) {
            event.preventDefault()
          }
        }}
        onClick={(event) => {
          callHandler(event, itemAttributes()?.onClick)
          callHandler(event, virtualProps?.onClick)
          if (event.defaultPrevented || option.disabled) {
            return
          }

          setHighlightedKey(option.key)
          selectOption(option)
        }}
      >
        {merged.optionRender(renderContext())}
      </div>
    )
  }

  function renderVirtualEntry(
    entry: BaseSelectT.VirtualEntry<TItem>,
    _index: number,
    virtualProps?: ListT.RowProps<HTMLDivElement>,
  ): JSX.Element {
    if (entry.type === 'label') {
      return (
        <div
          role="presentation"
          data-slot="group"
          {...virtualProps}
          style={{
            ...merged.styles?.group,
            ...toStyleObject(virtualProps?.style),
          }}
          class={cn('[&:not(:first-child)]:mt-1.5', merged.classes?.group, virtualProps?.class)}
        >
          <span
            data-slot="label"
            style={merged.styles?.label}
            class={cn(
              'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
              merged.classes?.label,
            )}
          >
            {entry.label}
          </span>
        </div>
      )
    }

    return (
      <Show when={visibleOptionByKey().get(entry.key)}>
        {(option) => renderVisibleOption(option(), virtualProps)}
      </Show>
    )
  }

  type SelectListEntry =
    | BaseSelectT.VirtualEntry<TItem>
    | NormalizedOption<TItem>
    | NormalizedGroup<TItem>

  const listEntries = createMemo<readonly SelectListEntry[]>(() =>
    merged.virtualRender ? virtualEntries() : visibleOptions(),
  )

  function renderListEntry(
    entry: SelectListEntry,
    index: number,
    rowProps?: ListT.RowProps<HTMLDivElement>,
  ): JSX.Element {
    if (merged.virtualRender) {
      return renderVirtualEntry(entry as BaseSelectT.VirtualEntry<TItem>, index, rowProps)
    }

    const option = entry as NormalizedOption<TItem> | NormalizedGroup<TItem>
    if (!option.isGroup) {
      return renderVisibleOption(option)
    }

    return (
      <div
        data-slot="group"
        role="group"
        style={merged.styles?.group}
        class={cn('[&:not(:first-child)]:mt-1.5', merged.classes?.group)}
      >
        <span
          data-slot="label"
          style={merged.styles?.label}
          class={cn(
            'text-xs text-muted-foreground font-medium px-2 py-1.5 block',
            merged.classes?.label,
          )}
        >
          {option.label}
        </span>
        <For each={option.options}>{(item) => renderVisibleOption(item)}</For>
      </div>
    )
  }

  return (
    <div
      data-slot="root"
      data-disabled={field.disabled() ? '' : undefined}
      data-invalid={field.invalid() ? '' : undefined}
      data-required={merged.required ? '' : undefined}
      style={{ ...merged.styles?.root, ...merged.style }}
      class={cn('inline-flex h-fit w-full relative', merged.classes?.root, merged.class)}
    >
      <select
        ref={(element) => {
          nativeFormSelectRef = element
        }}
        aria-hidden="true"
        class="sr-only"
        disabled={field.disabled()}
        multiple={merged.multiple}
        name={field.name()}
        required={merged.required}
        tabIndex={-1}
      >
        <Show when={!merged.multiple}>
          <option data-empty-option value="" selected={selectedValues().length === 0} />
        </Show>
        <For each={nativeFormOptions()}>
          {(option) => (
            <option
              value={option.value}
              disabled={option.disabled}
              selected={selectedValues().includes(option.value)}
            >
              {option.key}
            </option>
          )}
        </For>
      </select>

      {props.children({
        ...stateApi,
        controlProps,
        focusInput: () => comboboxRef?.focus(),
        inputProps,
        isSearchable,
        onInput: handleInput,
        onKeyDown: handleKeyDown,
        toggle: menuControl.toggleMenu,
      })}

      <Show when={contentPresence.present()}>
        <Portal>
          <div
            ref={(element) => {
              setPositionerElement(element)
              if (element) {
                element.style.position = 'fixed'
                element.style.visibility = 'hidden'
              }
            }}
            data-slot="positioner"
            class="left-0 top-0 fixed"
          >
            <div
              {...contentPresence.dataAttrs()}
              ref={(element) => {
                setContentElement(element)
                contentPresence.setElement(element)
              }}
              data-slot="content"
              style={{
                ...merged.styles?.content,
                '--mo-popper-content-transform-origin': resolveSelectContentOrigin(contentSide()),
              }}
              class={overlayMenuContentVariants(
                { side: contentSide() },
                'w-$mo-popper-anchor-width min-w-$mo-popper-anchor-width max-w-$mo-popper-content-available-width',
                merged.classes?.content,
              )}
            >
              <Show
                when={visibleFlatOptions().length > 0}
                fallback={merged.emptyRender?.(stateApi) ?? merged.optionRender(null)}
              >
                <List<SelectListEntry, 'div', HTMLDivElement>
                  as="div"
                  items={listEntries()}
                  itemRender={(context) =>
                    renderListEntry(context.item, context.index, context.props)
                  }
                  virtualRender={
                    merged.virtualRender as
                      | Component<
                          ListT.VirtualRenderProps<SelectListEntry, HTMLElement, HTMLDivElement>
                        >
                      | undefined
                  }
                  id={listboxId()}
                  role="listbox"
                  aria-multiselectable={merged.multiple || undefined}
                  data-slot="listbox"
                  {...merged.listboxProps}
                  ref={(element) => {
                    listboxRef = element
                    callRef(merged.listboxProps?.ref, element)
                  }}
                  style={{
                    ...merged.styles?.listbox,
                    ...toStyleObject(merged.listboxProps?.style),
                  }}
                  class={cn(
                    'outline-none max-h-$mo-popper-content-available-height overflow-y-auto',
                    merged.classes?.listbox,
                    merged.listboxProps?.class,
                  )}
                  onScroll={(event) => {
                    const { defaultPrevented } = callHandler(event, merged.listboxProps?.onScroll)
                    if (!defaultPrevented) {
                      handleListboxScroll(event)
                    }
                  }}
                />
              </Show>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  )
}
