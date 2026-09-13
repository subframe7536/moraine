import type { Accessor, Component, JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { List } from '../../elements/list'
import type { ListProps, ListT } from '../../elements/list'
import { useFloatingPosition } from '../../overlays/base/floating'
import { useOverlayInteraction } from '../../overlays/base/interaction'
import { acquireBodyScrollLock } from '../../overlays/base/utils.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { createComponentStyles, useCn } from '../../shared/provider'
import { renderComponentOrElement } from '../../shared/render-prop'
import type { ComponentOrElement } from '../../shared/render-prop'
import { createTypeahead } from '../../shared/typeahead'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useSelectableCollectionNavigation } from '../../shared/use-selectable-collection-navigation'
import { useTransitionPresence } from '../../shared/use-transition-presence'
import { callHandler, callRef, useId } from '../../shared/utils'
import { useFormReset } from '../shared/use-form-reset'

import { BaseSelectClear } from './base-select-clear'
import { BaseSelectContent } from './base-select-content'
import { BaseSelectProvider } from './base-select-context'
import { BaseSelectControl } from './base-select-control'
import { BaseSelectEmpty } from './base-select-empty'
import { BaseSelectGroup } from './base-select-group'
import { BaseSelectInput } from './base-select-input'
import { BaseSelectItem } from './base-select-item'
import { BaseSelectGroupLabel, BaseSelectLabel } from './base-select-label'
import { BaseSelectListbox } from './base-select-listbox'
import { BaseSelectSeparator } from './base-select-separator'
import { BaseSelectTrigger } from './base-select-trigger'
import type { BaseSelectProps, BaseSelectT } from './base-select.types'
import {
  flattenOptions,
  mapNormalizedToRawValue,
  normalizeOptions,
  resolveSelectedOptions,
  useSelectField,
  useSelectMenuControl,
} from './shared'
import type { NormalizedGroup, NormalizedOption, SelectFilterMode } from './shared'

export type { BaseSelectT, BaseSelectProps } from './base-select.types'

const SELECT_FILTER_STRATEGIES: Record<SelectFilterMode, (text: string, input: string) => boolean> =
  {
    startsWith: (text, input) => text.startsWith(input),
    endsWith: (text, input) => text.endsWith(input),
    contains: (text, input) => text.includes(input),
  }

function resolveSelectContentSide(placement: string): 'top' | 'bottom' {
  const [side] = placement.split('-')

  return side === 'top' ? 'top' : 'bottom'
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

function useSelectNavigation<TItem extends BaseSelectT.Item>(options: {
  highlightedKey: Accessor<string | undefined>
  isOpen: Accessor<boolean>
  isPresent: Accessor<boolean>
  selectedOptionIds: Accessor<Set<string>>
  setHighlightedKey: (key: string | undefined) => void
  visibleFlatOptions: Accessor<NormalizedOption<TItem>[]>
}) {
  const { focusBoundary, focusByOffset } = useSelectableCollectionNavigation<
    NormalizedOption<TItem>,
    string
  >({
    items: options.visibleFlatOptions,
    getValue: (option) => option.id,
    isDisabled: (option) => option.disabled,
    activationMode: () => 'manual',
    focusValue: options.setHighlightedKey,
    onSelect: () => undefined,
    loop: () => true,
  })

  function getFocusedOption(): NormalizedOption<TItem> | undefined {
    const key =
      options.highlightedKey() ??
      options.visibleFlatOptions().find((option) => !option.disabled)?.id
    if (!key) {
      return undefined
    }

    return options.visibleFlatOptions().find((option) => option.id === key)
  }

  const visibleOptionSnapshot = () =>
    options.visibleFlatOptions().map((option) => ({ id: option.id, disabled: option.disabled }))

  createEffect(
    on(
      [
        options.isPresent,
        options.isOpen,
        options.highlightedKey,
        visibleOptionSnapshot,
        options.selectedOptionIds,
      ],
      ([present, open, highlighted, visibleOptions, selectedIds]) => {
        if (!present) {
          options.setHighlightedKey(undefined)
          return
        }
        if (!open) {
          return
        }
        const enabledIds = visibleOptions
          .filter((option) => !option.disabled)
          .map((option) => option.id)
        if (!highlighted || !enabledIds.includes(highlighted)) {
          options.setHighlightedKey(enabledIds.find((id) => selectedIds.has(id)) ?? enabledIds[0])
        }
      },
    ),
  )

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
  getControlElement: () => HTMLElement | undefined
  gutter: Accessor<number>
  isOpen: Accessor<boolean>
  menuControl: ReturnType<typeof useSelectMenuControl>
  onPlacementChange: (placement: `${'top' | 'right' | 'bottom' | 'left'}${string}`) => void
  overflowPadding: Accessor<number>
  positionerElement: Accessor<HTMLDivElement | undefined>
}) {
  let disposed = false
  onCleanup(() => {
    disposed = true
  })

  useFloatingPosition({
    contentElement: options.contentElement,
    floatingElement: options.positionerElement,
    getReferenceElement: options.getControlElement,
    gutter: options.gutter,
    onPositionedChange: () => undefined,
    onPlacementChange: options.onPlacementChange,
    open: options.contentPresence.present,
    overflowPadding: options.overflowPadding,
    placement: () => 'bottom-start',
  })

  createEffect(
    on(options.contentPresence.present, (present) => {
      if (!present) {
        options.contentPresence.setElement(undefined)
        return
      }

      onCleanup(acquireBodyScrollLock(options.getControlElement()))
    }),
  )

  createEffect(
    on([options.positionerElement, options.contentElement], ([positioner, content]) => {
      if (!positioner || !content) {
        return
      }

      queueMicrotask(() => {
        if (
          disposed ||
          options.positionerElement() !== positioner ||
          options.contentElement() !== content
        ) {
          return
        }

        positioner.style.zIndex = getComputedStyle(content).zIndex
      })
    }),
  )

  useOverlayInteraction({
    containsTarget: (node) => {
      const positioner = options.positionerElement()
      return Boolean(options.getControlElement()?.contains(node) || positioner?.contains(node))
    },
    onPointerOutside: (event) => {
      if (event.defaultPrevented) {
        return
      }

      options.menuControl.onContentInteractOutside()
      options.closeMenu()
    },
    onFocusOutside: (event) => {
      if (event.defaultPrevented) {
        return
      }

      options.menuControl.onContentInteractOutside()
      options.closeMenu()
    },
    onEscape: (event, context) => {
      const target = event.target
      if ((target instanceof Node && context.isInside(target)) || event.defaultPrevented) {
        return
      }

      event.preventDefault()
      options.closeMenu()
    },
    contentElement: options.contentElement,
    enabled: options.isOpen,
    outsidePressEvent: 'pointerdown',
    requireContent: true,
    triggerElement: options.getControlElement,
  })
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BaseSelect<TItem extends BaseSelectT.Item = BaseSelectT.Item>(
  props: BaseSelectProps<TItem>,
): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props as BaseSelectProps<TItem> & Record<string, unknown>, [
    'ref',
    'id',
    'name',
    'required',
    'disabled',
    'readOnly',
    'size',
    'resolvedStyles',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'options',
    'open',
    'defaultOpen',
    'onOpenChange',
    'virtualRender',
    'scrollToItem',
    'listboxProps',
    'itemProps',
    'search',
    'searchValue',
    'defaultSearchValue',
    'onSearch',
    'searchMaxLength',
    'filterOption',
    'selectedValues',
    'multiple',
    'initialValue',
    'children',
    'onOptionSelect',
    'onFormReset',
    'isValueControlled',
    'onInputKeyDown',
    'onScrollBottom',
    'scrollBottomThreshold',
    'overflowPadding',
    'gutter',
    'closeOnSelect',
    'value',
    'defaultValue',
    'onChange',
    'placeholder',
    'loading',
    'loadingIcon',
    'leadingIcon',
    'trailingIcon',
    'closeIcon',
    'labelRender',
    'tagRender',
    'allowClear',
    'onClear',
    'tokenSeparators',
    'allowCreate',
    'maxCount',
    'maxTagCount',
  ])
  const merged = mergeProps(
    {
      closeOnSelect: true,
    },
    local as BaseSelectProps<TItem>,
  )
  const virtualRender = createMemo(() => merged.virtualRender)
  const listboxId = useId(() => merged.id && `${merged.id}-listbox`, 'base-select-listbox')
  const getOptionId = (key: string): string => `${listboxId()}-${encodeURIComponent(key)}`

  const field = useSelectField(() => ({
    id: merged.id,
    name: merged.name,
    size: merged.size ?? undefined,
    disabled: merged.disabled,
    required: local.required,
    readOnly: merged.readOnly,
    initialValue: merged.initialValue,
  }))
  const isSearchable = createMemo(() => Boolean(merged.search))
  const [registeredItems, setRegisteredItems] = createSignal<Accessor<TItem>[]>([])
  const hasRegisteredItems = createMemo(() => registeredItems().length > 0)

  const normalizedOptions = createMemo<Array<NormalizedOption<TItem> | NormalizedGroup<TItem>>>(
    () =>
      normalizeOptions(
        (hasRegisteredItems() ? registeredItems().map((item) => item()) : merged.options) as never,
      ) as Array<NormalizedOption<TItem> | NormalizedGroup<TItem>>,
  )
  const allFlatOptions = createMemo<NormalizedOption<TItem>[]>(() =>
    flattenOptions(normalizedOptions()),
  )
  const propSelectedValues = createMemo(() => merged.selectedValues ?? [])
  const [hasClearedSelection, setHasClearedSelection] = createSignal(false)
  const selectedValues = createMemo<BaseSelectT.Value[]>(() => {
    if (merged.isValueControlled) {
      return propSelectedValues()
    }

    const value = field.value()
    if (merged.multiple) {
      return Array.isArray(value)
        ? value.filter(
            (item): item is BaseSelectT.Value =>
              typeof item === 'string' || typeof item === 'number',
          )
        : hasClearedSelection()
          ? []
          : propSelectedValues()
    }

    if (value === null) {
      return []
    }

    return typeof value === 'string' || typeof value === 'number'
      ? [value]
      : hasClearedSelection()
        ? []
        : propSelectedValues()
  })

  const formValueSnapshot = () => {
    const value = field.value()
    return Array.isArray(value) ? value.slice() : value
  }
  const propSelectedValuesSnapshot = () => propSelectedValues().slice()

  createEffect(
    on(
      [
        () => merged.isValueControlled,
        propSelectedValuesSnapshot,
        () => merged.multiple,
        formValueSnapshot,
      ],
      ([controlled, values, multiple, currentValue]) => {
        if (!controlled) {
          return
        }
        const nextValue = multiple ? values : (values[0] ?? '')
        const isEqual = Array.isArray(nextValue)
          ? Array.isArray(currentValue) &&
            nextValue.length === currentValue.length &&
            nextValue.every((value, index) => Object.is(value, currentValue[index]))
          : Object.is(nextValue, currentValue)
        if (!isEqual) {
          field.setFormValue(nextValue)
        }
      },
    ),
  )

  const selectedResolution = createMemo(() =>
    resolveSelectedOptions(allFlatOptions(), selectedValues()),
  )
  const selectedOptions = createMemo(() => selectedResolution().options)
  const [selectedOptionCache, setSelectedOptionCache] = createSignal<NormalizedOption<TItem>[]>([])
  const selectedOptionIds = createMemo(() => new Set(selectedOptions().map((option) => option.id)))
  const formValues = createMemo(() => {
    if (!merged.multiple && selectedValues().length === 0) {
      return ['']
    }
    return selectedResolution().entries.flatMap((entry) =>
      entry.type === 'unmatched'
        ? [String(entry.value)]
        : entry.option.disabled
          ? []
          : [String(entry.option.value)],
    )
  })
  // A text input participates in required validation; hidden inputs only serialize values.
  const validationValue = () => {
    const values = selectedValues()
    const hasValue = merged.multiple ? values.length > 0 : String(values[0] ?? '') !== ''
    return hasValue ? 'selected' : ''
  }

  const [openState, setOpenState] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(openState()))

  let controlRef: HTMLElement | undefined
  let comboboxRef: HTMLElement | undefined
  let listboxRef: HTMLDivElement | undefined
  let validationInputRef: HTMLInputElement | undefined
  let hasReachedScrollBottom = false
  let disposed = false

  onCleanup(() => {
    disposed = true
  })

  const [currentInputText, setCurrentInputText] = createSignal(merged.defaultSearchValue ?? '')
  const [highlightedKey, setHighlightedKey] = createSignal<string | undefined>()
  const [contentSide, setContentSide] = createSignal<'top' | 'bottom'>('bottom')
  const resolved = untrack(
    () =>
      local.resolvedStyles ??
      createComponentStyles('baseSelect', props, {
        inheritedVariants: () => ({ size: field.size() ?? undefined }),
      }),
  )

  const [positionerElement, setPositionerElement] = createSignal<HTMLDivElement | undefined>()
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>()
  const [contentRegistrations, setContentRegistrations] = createSignal(0)
  const hasCustomContent = createMemo(() => contentRegistrations() > 0)
  const [controlRegistrations, setControlRegistrations] = createSignal(0)
  const hasRegisteredControl = createMemo(() => controlRegistrations() > 0)

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
    () => new Map(visibleFlatOptions().map((option) => [option.id, option])),
  )
  const visibleOptionPositionByKey = createMemo(
    () => new Map(visibleFlatOptions().map((option, index) => [option.id, index + 1])),
  )
  const virtualEntries = createMemo<BaseSelectT.VirtualEntry<TItem>[]>(() => {
    const entries: BaseSelectT.VirtualEntry<TItem>[] = []

    for (const [index, item] of visibleOptions().entries()) {
      if (!item.isGroup) {
        entries.push({
          type: 'item',
          key: item.id,
          item: item.raw,
          disabled: item.disabled,
        })
        continue
      }

      entries.push({
        type: 'label',
        key: `group-${index}`,
        label: item.label,
        optionKeys: item.options.map((option) => option.id),
      })

      for (const option of item.options) {
        entries.push({
          type: 'item',
          key: option.id,
          item: option.raw,
          disabled: option.disabled,
        })
      }
    }

    return entries
  })

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
    isPresent: contentPresence.present,
    selectedOptionIds,
    setHighlightedKey,
    visibleFlatOptions,
  })
  const typeahead = createTypeahead({
    getItems: visibleFlatOptions,
    getStartIndex: () => {
      const options = visibleFlatOptions()
      return isOpen()
        ? options.findIndex((option) => option.id === highlightedKey())
        : options.findIndex((option) => selectedOptionIds().has(option.id))
    },
    getText: (option) => option.key,
    isDisabled: (option) => option.disabled,
    onMatch: (option) => {
      if (isOpen()) {
        setHighlightedKey(option.id)
        return
      }

      selectOption(option)
    },
  })

  function handleTypeaheadKeyDown(event: KeyboardEvent): boolean {
    if (isSearchable() || merged.multiple || event.ctrlKey || event.metaKey || event.altKey) {
      return false
    }

    return typeahead.handleKeyDown(event)
  }

  function setInputValue(inputValue: string): void {
    if (!menuControl.isDismissing()) {
      setCurrentInputText(inputValue)
    }

    merged.onSearch?.(inputValue)
  }

  function selectOption(option: NormalizedOption<TItem>): void {
    if (option.disabled || field.readOnly()) {
      return
    }

    if (!merged.multiple) {
      setSelectedOptionCache([option])
    }

    if (merged.onOptionSelect) {
      merged.onOptionSelect(option, {
        allFlatOptions,
        field,
        setInputValue,
      })
    } else {
      const rawVal = mapNormalizedToRawValue(option)
      if (merged.multiple) {
        const current = selectedValues()
        const valStr = option.value
        const next = current.includes(valStr)
          ? current.filter((v) => v !== valStr)
          : [...current, valStr]
        field.setFormValue(next)
      } else {
        field.setFormValue(rawVal ?? '')
        setInputValue(option.key ?? '')
      }
    }

    if (merged.closeOnSelect && isOpen()) {
      closeMenu()
      const focusTarget = comboboxRef
      // oxlint-disable-next-line subf/solid-reactivity -- Delayed focus must validate the latest open state.
      queueMicrotask(() => {
        if (!disposed && !isOpen() && comboboxRef === focusTarget && focusTarget?.isConnected) {
          focusTarget.focus()
        }
      })
    }
  }

  function clear(): void {
    if (field.readOnly() || field.disabled()) {
      return
    }

    if (merged.onOptionSelect) {
      merged.onOptionSelect(null, {
        allFlatOptions,
        field,
        setInputValue,
      })
    } else {
      field.setFormValue(merged.multiple ? [] : '')
      setHasClearedSelection(true)
    }
    setSelectedOptionCache([])
    setInputValue('')
    closeMenu()
  }

  useFormReset(
    () => validationInputRef?.form,
    () => {
      if (disposed) {
        return
      }

      merged.onFormReset?.({
        allFlatOptions,
        field,
        setInputValue,
      })
      if (validationInputRef) {
        validationInputRef.value = validationValue()
      }
    },
  )

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
    if (!isSearchable() || field.readOnly()) {
      if (field.readOnly()) {
        ;(event.currentTarget as HTMLInputElement).value = currentInputText()
      }
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

    if (handleTypeaheadKeyDown(event)) {
      return
    }

    if ((event.key === ' ' || event.key === 'Spacebar') && !isSearchable()) {
      event.preventDefault()

      if (!isOpen()) {
        setMenuOpen(true)
        return
      }

      const option = navigation.getFocusedOption()
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
      if (!isOpen()) {
        return
      }

      event.preventDefault()
      navigation.focusBoundaryItem('first')
      return
    }

    if (event.key === 'End') {
      if (!isOpen()) {
        return
      }

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

  const activeDescendantId = createMemo(() => {
    const key = highlightedKey()
    return key ? getOptionId(key) : undefined
  })

  const controlProps = createMemo<JSX.HTMLAttributes<HTMLDivElement>>(() => {
    const sharedProps: JSX.HTMLAttributes<HTMLDivElement> = {
      ref: (element: HTMLDivElement | undefined) => {
        controlRef = element
        if (!isSearchable()) {
          comboboxRef = element
        }
      },
      onPointerDown: (event: PointerEvent) => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
          event.preventDefault()
          comboboxRef?.focus()
        }
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
    readonly: field.readOnly(),
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

  createEffect(
    on(
      [highlightedKey, isOpen, contentElement, visibleOptionByKey, virtualRender, virtualEntries],
      ([key, open, content, options, virtual, virtualItems]) => {
        if (!key || !open || !content || !listboxRef) {
          return
        }
        const option = options.get(key)
        if (!option) {
          return
        }
        const entries = virtual ? virtualItems : undefined
        const scrollToItem = merged.scrollToItem
        if (entries && scrollToItem) {
          const entryIndex = entries.findIndex(
            (entry) => entry.type === 'item' && entry.key === key,
          )
          if (entryIndex >= 0) {
            scrollToItem(option.raw, entryIndex)
            return
          }
        }
        const listbox = listboxRef
        // oxlint-disable-next-line subf/solid-reactivity -- Delayed scrolling must validate the latest highlight and popup state.
        queueMicrotask(() => {
          if (
            disposed ||
            !isOpen() ||
            highlightedKey() !== key ||
            listboxRef !== listbox ||
            contentElement() !== content
          ) {
            return
          }

          scrollHighlightedItemIntoView(listbox)
        })
      },
    ),
  )

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
    itemRender?: ComponentOrElement<BaseSelectT.ListboxItemRenderProps<TItem>>,
  ): JSX.Element {
    const isSelected = createMemo(() => selectedOptionIds().has(option.id))
    const renderContext = createMemo(() => ({
      ...option.renderItem,
      isSelected: isSelected(),
      isHighlighted: highlightedKey() === option.id,
      isDisabled: option.disabled,
    }))
    const itemAttributes = createMemo(() => merged.itemProps?.(renderContext()))

    return (
      <div
        id={getOptionId(option.id)}
        role="option"
        tabIndex={-1}
        data-slot="item"
        data-disabled={option.disabled ? '' : undefined}
        data-highlighted={highlightedKey() === option.id ? '' : undefined}
        data-selected={isSelected() ? '' : undefined}
        aria-disabled={option.disabled || undefined}
        aria-selected={isSelected() ? 'true' : 'false'}
        aria-posinset={virtualRender() ? visibleOptionPositionByKey().get(option.id) : undefined}
        aria-setsize={virtualRender() ? visibleFlatOptions().length : undefined}
        {...itemAttributes()}
        {...virtualProps}
        ref={(element) => {
          callRef(itemAttributes()?.ref, element)
          virtualProps?.ref?.(element)
        }}
        class={cn(resolved.slot('item').class, [itemAttributes()?.class, virtualProps?.class])}
        style={{
          ...toStyleObject(itemAttributes()?.style),
          ...toStyleObject(virtualProps?.style),
          ...resolved.slot('item').style,
        }}
        onPointerMove={(event) => {
          callHandler(event, itemAttributes()?.onPointerMove)
          callHandler(event, virtualProps?.onPointerMove)
          if (!event.defaultPrevented && event.pointerType === 'mouse' && !option.disabled) {
            setHighlightedKey(option.id)
          }
        }}
        onPointerDown={(event) => {
          callHandler(event, itemAttributes()?.onPointerDown)
          callHandler(event, virtualProps?.onPointerDown)
          if (
            !event.defaultPrevented &&
            event.pointerType !== 'touch' &&
            event.pointerType !== 'pen'
          ) {
            event.preventDefault()
          }
        }}
        onClick={(event) => {
          callHandler(event, itemAttributes()?.onClick)
          callHandler(event, virtualProps?.onClick)
          if (event.defaultPrevented || option.disabled) {
            return
          }

          setHighlightedKey(option.id)
          selectOption(option)
        }}
      >
        <Show when={itemRender !== undefined} fallback={option.label ?? option.key}>
          {renderComponentOrElement(itemRender, {
            get option() {
              return renderContext()
            },
          })}
        </Show>
      </div>
    )
  }

  function renderVirtualEntry(
    entry: BaseSelectT.VirtualEntry<TItem>,
    _index: number,
    virtualProps?: ListT.RowProps<HTMLDivElement>,
    itemRender?: ComponentOrElement<BaseSelectT.ListboxItemRenderProps<TItem>>,
  ): JSX.Element {
    if (entry.type === 'label') {
      const labelId = `${listboxId()}-${entry.key}-label`

      return (
        <div
          role="group"
          aria-labelledby={labelId}
          aria-owns={entry.optionKeys.map(getOptionId).join(' ') || undefined}
          data-slot="group"
          {...virtualProps}
          class={cn(resolved.slot('group').class, virtualProps?.class)}
          style={{ ...toStyleObject(virtualProps?.style), ...resolved.slot('group').style }}
        >
          <span id={labelId} data-slot="label" aria-hidden="true" {...resolved.slot('label')}>
            {entry.label}
          </span>
        </div>
      )
    }

    return (
      <Show when={visibleOptionByKey().get(entry.key)}>
        {(option) => renderVisibleOption(option(), virtualProps, itemRender)}
      </Show>
    )
  }

  type SelectListEntry =
    | BaseSelectT.VirtualEntry<TItem>
    | NormalizedOption<TItem>
    | NormalizedGroup<TItem>

  const listEntries = createMemo<readonly SelectListEntry[]>(() =>
    virtualRender() ? virtualEntries() : visibleOptions(),
  )
  const RuntimeList = List as unknown as Component<
    ListProps<SelectListEntry, 'div', HTMLDivElement> & JSX.HTMLAttributes<HTMLDivElement>
  >

  function renderListEntry(
    entry: SelectListEntry,
    index: number,
    rowProps?: ListT.RowProps<HTMLDivElement>,
    itemRender?: ComponentOrElement<BaseSelectT.ListboxItemRenderProps<TItem>>,
  ): JSX.Element {
    if (virtualRender()) {
      return renderVirtualEntry(
        entry as BaseSelectT.VirtualEntry<TItem>,
        index,
        rowProps,
        itemRender,
      )
    }

    const option = entry as NormalizedOption<TItem> | NormalizedGroup<TItem>
    if (!option.isGroup) {
      return renderVisibleOption(option, undefined, itemRender)
    }

    const groupLabelId = `${listboxId()}-group-${index}-label`

    return (
      <div
        data-slot="group"
        role="group"
        aria-labelledby={groupLabelId}
        {...resolved.slot('group')}
      >
        <span id={groupLabelId} data-slot="label" aria-hidden="true" {...resolved.slot('label')}>
          {option.label}
        </span>
        <For each={option.options}>
          {(item) => renderVisibleOption(item, undefined, itemRender)}
        </For>
      </div>
    )
  }

  function displayValue(): JSX.Element {
    const selected = selectedOptions()
    const displayedSelected = selected.length > 0 ? selected : selectedOptionCache()
    if (displayedSelected.length === 1) {
      return displayedSelected[0]?.label ?? displayedSelected[0]?.key
    }
    if (displayedSelected.length > 1) {
      return displayedSelected
        .map((s) => (typeof s.label === 'string' || typeof s.label === 'number' ? s.label : s.key))
        .join(', ')
    }
    return undefined
  }

  const controlApi: BaseSelectT.ControlApi<TItem> = {
    ...stateApi,
    controlProps,
    focusInput: () => comboboxRef?.focus(),
    inputProps,
    isSearchable,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    toggle: menuControl.toggleMenu,
    resolved,
  }

  function renderDefaultListbox(listboxProps?: BaseSelectT.ListboxProps<TItem>): JSX.Element {
    const [lbLocal, lbRest] = splitProps(listboxProps ?? {}, [
      'class',
      'style',
      'ref',
      'itemRender',
      'emptyRender',
    ])
    const itemRender = () => lbLocal.itemRender
    const emptyRender = () => lbLocal.emptyRender

    return (
      <Show
        when={visibleFlatOptions().length > 0}
        fallback={
          emptyRender() !== undefined ? (
            renderComponentOrElement(emptyRender(), stateApi)
          ) : itemRender() !== undefined ? (
            renderComponentOrElement(itemRender(), { option: null })
          ) : (
            <div data-slot="empty" {...resolved.slot('empty')}>
              No data
            </div>
          )
        }
      >
        <RuntimeList
          as="div"
          items={listEntries()}
          itemRender={(context) =>
            renderListEntry(context.item, context.index, context.props, itemRender())
          }
          virtualRender={
            virtualRender() as
              | Component<ListT.VirtualRenderProps<SelectListEntry, HTMLElement, HTMLDivElement>>
              | undefined
          }
          id={listboxId()}
          role="listbox"
          aria-multiselectable={merged.multiple || undefined}
          data-slot="listbox"
          {...merged.listboxProps}
          {...lbRest}
          ref={(element: HTMLDivElement) => {
            listboxRef = element
            callRef(merged.listboxProps?.ref, element)
            callRef(lbLocal.ref, element)
          }}
          class={cn(resolved.slot('listbox').class, merged.listboxProps?.class, lbLocal.class)}
          style={{
            ...toStyleObject(merged.listboxProps?.style),
            ...resolved.slot('listbox').style,
            ...toStyleObject(lbLocal.style),
          }}
          onScroll={(event: Event) => {
            const { defaultPrevented } = callHandler(event, merged.listboxProps?.onScroll)
            if (!defaultPrevented) {
              handleListboxScroll(event)
            }
          }}
        />
      </Show>
    )
  }

  const contextValue = {
    isOpen,
    setOpen: setOpenState,
    close: closeMenu,
    toggle: menuControl.toggleMenu,
    highlightedKey,
    setHighlightedKey,
    inputValue: currentInputText,
    setInputValue,
    isSearchable,
    field,
    selectedValues,
    selectedOptions,
    selectedOptionIds,
    visibleOptions,
    visibleFlatOptions,
    allFlatOptions,
    listboxId,
    getOptionId,
    controlProps,
    inputProps,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    selectOption,
    clear,
    focusInput: () => comboboxRef?.focus(),
    resolved,
    contentPresence,
    contentSide,
    setPositionerElement,
    setContentElement,
    setControlRef: (el: HTMLElement | undefined) => {
      controlRef = el
      if (!isSearchable() && (!comboboxRef || comboboxRef === controlRef)) {
        comboboxRef = el
      }
    },
    hasControlRef: hasRegisteredControl,
    registerControl: () => {
      setControlRegistrations((count) => count + 1)
      return () => setControlRegistrations((count) => Math.max(0, count - 1))
    },
    setComboboxRef: (el: HTMLElement | undefined) => {
      comboboxRef = el
    },
    setListboxRef: (el: HTMLDivElement | undefined) => {
      listboxRef = el
    },
    registerContent: () => {
      setContentRegistrations((prev) => prev + 1)
      return () => setContentRegistrations((prev) => Math.max(0, prev - 1))
    },
    hasCustomContent,
    registerItem: (item: Accessor<TItem>) => {
      setRegisteredItems((items) => [...items, item])
      return () => setRegisteredItems((items) => items.filter((entry) => entry !== item))
    },
    getRegisteredOption: (item: Accessor<TItem>) => {
      const registration = (item() as TItem & { __baseSelectRegistration?: object })
        .__baseSelectRegistration
      return allFlatOptions().find(
        (option) =>
          (option.raw as TItem & { __baseSelectRegistration?: object }).__baseSelectRegistration ===
          registration,
      )
    },
    displayValue,
    renderDefaultListbox,
    multiple: () => merged.multiple,
    handleListboxScroll,
    stateApi,
    controlApi,
  }

  return (
    <BaseSelectProvider value={contextValue}>
      <div
        ref={(element) => callRef(local.ref, element)}
        data-slot="root"
        data-disabled={field.disabled() ? '' : undefined}
        data-invalid={field.invalid() ? '' : undefined}
        data-required={field.required() ? '' : undefined}
        data-readonly={field.readOnly() ? '' : undefined}
        {...rest}
        {...resolved.root}
      >
        <HiddenInput
          ref={(element) => {
            validationInputRef = element
          }}
          type="text"
          aria-hidden="true"
          autocomplete="off"
          disabled={field.disabled()}
          required={field.required()}
          tabIndex={-1}
          value={validationValue()}
          onInput={(event) => {
            event.currentTarget.value = validationValue()
          }}
          onChange={(event) => {
            event.currentTarget.value = validationValue()
          }}
          onInvalid={(event) => {
            event.preventDefault()
            comboboxRef?.focus()
          }}
        />
        <For each={formValues()}>
          {(value) => (
            <HiddenInput
              type="hidden"
              visuallyHidden={false}
              name={field.name()}
              value={value}
              disabled={field.disabled()}
            />
          )}
        </For>

        {(() => {
          const content = local.children
          return typeof content === 'function' ? (content as any)(controlApi) : content
        })()}
      </div>
    </BaseSelectProvider>
  )
}

BaseSelect.Root = BaseSelect
BaseSelect.Control = BaseSelectControl
BaseSelect.Input = BaseSelectInput
BaseSelect.Clear = BaseSelectClear
BaseSelect.Trigger = BaseSelectTrigger
BaseSelect.Content = BaseSelectContent
BaseSelect.Listbox = BaseSelectListbox
BaseSelect.Item = BaseSelectItem
BaseSelect.Group = BaseSelectGroup
BaseSelect.GroupLabel = BaseSelectGroupLabel
BaseSelect.Label = BaseSelectLabel
BaseSelect.Separator = BaseSelectSeparator
BaseSelect.Empty = BaseSelectEmpty
