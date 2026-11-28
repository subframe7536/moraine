import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import {
  DEV,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onFlush,
  onSettled,
  untrack,
  For,
  createProjection,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { createContextProvider } from '../../shared/create-context-provider'
import { HiddenInput } from '../../shared/hidden-input'
import { createKeyDownHandler } from '../../shared/keyboard'
import type { KeyEvent } from '../../shared/keyboard'
import { createTypeahead } from '../../shared/typeahead'
import { createId } from '../../shared/utils'
import { dataSlotName } from '../../theme/data-slot'
import { useFormField } from '../field/field-context'
import {
  diagnoseDuplicateItems,
  labelString,
  normalizeSelection,
  sameValue,
  selectionEqual,
} from '../shared/form/select/collection'
import { useFormReset } from '../shared/form/use-form-reset'
import { useHiddenInputValidation } from '../shared/form/use-hidden-input-validation'

import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectProps, BaseSelectT, BaseSelectValue } from './base-select.types'
/** Projects the selection onto the native form value: an array, or a scalar (`null` when empty). */
function toFormValue<T extends BaseSelectValue>(
  values: ReadonlyArray<T>,
  multiple: boolean,
): Array<T> | T | null {
  return multiple ? [...values] : (values[0] ?? null)
}

/** Inverse of `toFormValue`. An empty string is a selection only when `emptyIsValue` is set. */
function fromFormValue<T extends BaseSelectValue>(
  formValue: unknown,
  multiple: boolean,
  emptyIsValue: boolean,
): Array<T> {
  if (multiple) {
    return Array.isArray(formValue) ? formValue : []
  }
  if (typeof formValue === 'string' || typeof formValue === 'number') {
    return formValue === '' && !emptyIsValue ? [] : [formValue as T]
  }
  return []
}

function formValueMatches(
  values: ReadonlyArray<BaseSelectValue>,
  formValue: unknown,
  multiple: boolean,
) {
  return multiple
    ? Array.isArray(formValue) && selectionEqual(values, formValue)
    : Object.is(values[0] ?? null, formValue)
}

export function createSelectState<T extends BaseSelectT.Item>(
  props: BaseSelectProps<T>,
  slotOwner: Accessor<string>,
) {
  const slotName = (slot: string) => dataSlotName(slotOwner(), slot)
  type Value = ReadonlyArray<T['value']>
  const normalize = (values: Value): Array<T['value']> =>
    normalizeSelection(values, props.multiple === true)
  const id = createId(() => props.id, 'select')
  const initial = untrack(() => normalize(props.defaultValue ?? []))
  const field = useFormField(props, {
    get defaultId() {
      return id()
    },
    get initialValue() {
      // An empty initial single selection stays undefined so the mount write is a no-op.
      return props.multiple === true ? toFormValue(initial, true) : initial[0]
    },
  })
  const [mounted, setMounted] = createSignal(false)
  onSettled(() => {
    setMounted(true)
  })
  const items = () => props.items ?? []
  const itemByValue = createMemo(() => {
    const byValue = new Map<T['value'], T>()
    for (const item of items()) {
      if (!byValue.has(item.value)) {
        byValue.set(item.value, item)
      }
    }
    return byValue
  })
  createEffect(items, diagnoseDuplicateItems)
  /**
   * Resolves a selection value to its canonical item representation.
   * Uses caller-provided `getItemByValue` if supplied (e.g. Combobox),
   * falling back to the internal `items` collection map (e.g. Select, MultiSelect).
   */
  function getCanonicalItem(value: T['value']): T | undefined {
    const customLookup = props.getItemByValue
    if (customLookup) {
      return customLookup(value)
    }
    return itemByValue().get(value)
  }
  const [selection, setSelection] = createControllableValue<Value>({
    value: () => {
      if (props.value !== undefined) {
        return props.value
      }
      if (!field.bound()) {
        return undefined
      }
      const formValue = field.value()
      if (formValue === undefined) {
        // Before mount (and on SSR) the binding has no input yet: stay
        // uncontrolled so defaultValue shows and hydration stays identical.
        return mounted() ? [] : undefined
      }
      return fromFormValue<T['value']>(
        formValue,
        props.multiple === true,
        formValue === '' && getCanonicalItem('') !== undefined,
      )
    },
    defaultValue: () => initial,
  })
  const value = createMemo(() => normalize(selection()), { equals: selectionEqual })
  const selectedValues = createMemo(() => new Set(value()))
  const itemDisabled = (item: T) => {
    const canonical = getCanonicalItem(item.value) ?? item
    return Boolean(canonical.disabled || props.isItemDisabled?.(canonical, value()))
  }
  const [open, setOpenValue] = createControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  })
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [focusOwner, setFocusOwner] = createSignal<HTMLElement>()
  createEffect(focusOwner, (element) => {
    field.setControlRef(element)
  })
  const listboxId = () => `${field.id()}-listbox`
  const itemId = (value: BaseSelectValue) =>
    `${listboxId()}-${encodeURIComponent(`${typeof value}:${String(value)}`)}`
  const { variants } = useRecipe(baseSelectRecipe, props, {
    slot: 'control',
    context: () => ({ variants: { size: field.size() ?? undefined } }),
  })
  /** Presentation context every part passes to its `useRecipe` call. */
  const recipeContext = () => ({
    variants: { size: variants.size },
    classes: props.classes,
    styles: props.styles,
  })
  const locked = () => field.disabled() || field.readOnly()
  const { nativeInvalid, resetNativeInvalid, onInvalid } = useHiddenInputValidation({
    focusTarget: focusOwner,
  })
  const invalid = () => field.invalid() || nativeInvalid()
  const ariaAttrs = (): JSX.AriaAttributes =>
    nativeInvalid() ? { ...field.ariaAttrs(), 'aria-invalid': 'true' } : field.ariaAttrs()
  let formInput: HTMLInputElement | undefined

  function setOpen(next: boolean) {
    // Open writes arrive from unowned delegated handlers; settle them.
    if (!next || !field.disabled()) {
      setOpenValue(next)
    }
  }
  function change(next: Value) {
    if (locked()) {
      return
    }
    const before = value()
    const after = normalize(next)
    if (selectionEqual(before, after)) {
      return
    }
    resetNativeInvalid()
    setSelection(after)
    if (props.value === undefined) {
      field.setFormValue(toFormValue(after, props.multiple === true))
    }
    props.onValueChange?.(after)
    field.emit('change')
    field.emit('input')
  }
  function select(item: T) {
    if (locked() || itemDisabled(item)) {
      return
    }
    if (!itemByValue().has(item.value)) {
      return
    }
    discardComposition()
    const shouldClose = props.closeOnSelect ?? !props.multiple
    if (shouldClose) {
      setOpen(false)
    }
    change(
      props.multiple
        ? selectedValues().has(item.value)
          ? value().filter((value) => !sameValue(value, item.value))
          : [...value(), item.value]
        : [item.value],
    )
    if (shouldClose) {
      const target = focusOwner()
      onFlush(() => {
        if (!open() && target === focusOwner() && target?.isConnected) {
          target.focus()
        }
      })
    }
  }
  /** Enabled items in navigation order, indexed by value (first occurrence wins). */
  const navigation = createMemo(() => {
    const enabledItems = items().filter((item) => !itemDisabled(item))
    const indexByValue = new Map<T['value'], number>()
    enabledItems.forEach((item, index) => {
      if (!indexByValue.has(item.value)) {
        indexByValue.set(item.value, index)
      }
    })
    return { items: enabledItems, indexByValue }
  })
  const [highlightedValue, setHighlightedValue] = createSignal<T['value'] | undefined>(
    (previous) => {
      const isOpen = open()
      const nav = navigation()
      const selected = selectedValues()
      if (!isOpen || (previous !== undefined && nav.indexByValue.has(previous))) {
        return previous
      }
      const next = nav.items.find((item) => selected.has(item.value)) ?? nav.items[0]
      return next?.value
    },
  )
  const highlightedIndex = () => {
    const current = highlightedValue()
    return current === undefined ? -1 : (navigation().indexByValue.get(current) ?? -1)
  }
  const toValueKey = (value: T['value']): string =>
    typeof value === 'number' ? `n:${value}` : `s:${value}`
  let previousHighlightedKey: string | undefined
  const highlightedMap = createProjection<Record<string, boolean>>((draft) => {
    const next = highlightedValue()
    const nextKey = next === undefined ? undefined : toValueKey(next)
    if (previousHighlightedKey !== undefined && previousHighlightedKey !== nextKey) {
      delete draft[previousHighlightedKey]
    }
    if (nextKey !== undefined) {
      draft[nextKey] = true
    }
    previousHighlightedKey = nextKey
  }, {})
  const isHighlighted = (value: T['value']): boolean => highlightedMap[toValueKey(value)] === true

  let previousSelectedKeys = new Set<string>()
  const selectedMap = createProjection<Record<string, boolean>>((draft) => {
    const nextKeys = new Set<string>()
    for (const value of selectedValues()) {
      const key = toValueKey(value)
      nextKeys.add(key)
      if (!previousSelectedKeys.has(key)) {
        draft[key] = true
      }
    }
    for (const key of previousSelectedKeys) {
      if (!nextKeys.has(key)) {
        delete draft[key]
      }
    }
    previousSelectedKeys = nextKeys
  }, {})
  const isSelected = (value: T['value']): boolean => selectedMap[toValueKey(value)] === true
  const typeahead = createTypeahead({
    getItems: items,
    getStartIndex: () =>
      items().findIndex((item) =>
        open() ? sameValue(item.value, highlightedValue()) : selectedValues().has(item.value),
      ),
    getText: (item) => labelString(item, props.getItemLabel),
    isDisabled: (item) => itemDisabled(item),
    onMatch: (item) => (open() ? setHighlightedValue(item.value) : select(item)),
  })
  function moveHighlight(offset: number): void {
    setOpen(true)
    const { items } = navigation()
    if (items.length === 0) {
      setHighlightedValue(undefined)
      return
    }
    const current = highlightedIndex()
    const shouldLoop = props.loop ?? true
    if (current < 0) {
      setHighlightedValue(items[offset < 0 && shouldLoop ? items.length - 1 : 0]?.value)
      return
    }
    const nextIndex = current + offset
    const index = shouldLoop
      ? (nextIndex + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, nextIndex))
    setHighlightedValue(items[index]?.value)
  }

  function highlightBoundary(last = false): void {
    setOpen(true)
    const { items } = navigation()
    setHighlightedValue(items[last ? items.length - 1 : 0]?.value)
  }

  /**
   * Items-per-page for PageUp/PageDown: the enabled options that fit in the
   * listbox's viewport, or a fixed page when layout is unavailable (jsdom, SSR).
   */
  function pageStep(event: KeyEvent): number {
    const listbox = event.currentTarget.ownerDocument.getElementById(listboxId())
    const option = listbox?.querySelector<HTMLElement>('[role="option"]')
    if (listbox && option && listbox.clientHeight > 0 && option.offsetHeight > 0) {
      return Math.max(1, Math.floor(listbox.clientHeight / option.offsetHeight))
    }
    return 10
  }

  function commitActivation(event: KeyboardEvent, closeOnUnresolved: boolean): void {
    if (!open()) {
      event.preventDefault()
      setOpen(true)
      return
    }
    const item = navigation().items[highlightedIndex()]
    if (item) {
      event.preventDefault()
      select(item)
      return
    }
    if (closeOnUnresolved) {
      setOpen(false)
    }
  }

  /** Closes the popup unless the dismissal is disabled, in which case it reports the attempt. */
  function dismiss(enabled = true): void {
    if (enabled) {
      setOpen(false)
    } else {
      props.onClosePrevented?.()
    }
  }

  const keyDown = createKeyDownHandler<HTMLElement, [boolean?]>({
    disabled: () => field.disabled(),
    keys: (_event, textInput) => ({
      Tab: { preventDefault: false, handle: () => setOpen(false) },
      Escape: { when: () => open(), handle: () => dismiss(props.closeOnEscape) },
      ArrowDown: () => moveHighlight(1),
      ArrowUp: () => moveHighlight(-1),
      Home: {
        when: () => open() && !textInput,
        handle: () => highlightBoundary(),
      },
      End: {
        when: () => open() && !textInput,
        handle: () => highlightBoundary(true),
      },
      PageUp: {
        when: () => open(),
        handle: (event) => moveHighlight(-pageStep(event)),
      },
      PageDown: {
        when: () => open(),
        handle: (event) => moveHighlight(pageStep(event)),
      },
      Enter: { preventDefault: false, handle: (event) => commitActivation(event, true) },
      ...(textInput
        ? {}
        : {
            ' ': {
              preventDefault: false,
              // A pending typeahead search treats Space as a search character.
              handle: (event) => {
                if (!typeahead.handleKeyDown(event)) {
                  commitActivation(event, false)
                }
              },
            },
          }),
    }),
    onUnhandled: (event, textInput) => {
      if (!textInput) {
        typeahead.handleKeyDown(event)
      }
    },
  })

  createEffect(
    () => [value(), props.value !== undefined, props.multiple === true] as const,
    ([current, controlled, multiple]) => {
      if (!controlled) {
        return
      }
      const formValue = untrack(field.value)
      if (!formValueMatches(current, formValue, multiple)) {
        field.setFormValue(toFormValue(current, multiple))
      }
    },
  )
  let compositionDiscarder: (() => void) | undefined
  function registerCompositionDiscarder(discard: () => void) {
    if (DEV && compositionDiscarder && compositionDiscarder !== discard) {
      console.warn(
        '[moraine] BaseSelect: multiple composition discarders registered; overwriting previous discarder.',
      )
    }
    compositionDiscarder = discard
    onCleanup(() => {
      if (compositionDiscarder === discard) {
        compositionDiscarder = undefined
      }
    })
  }
  function discardComposition() {
    compositionDiscarder?.()
  }
  createEffect(
    value,
    (current, previous) => {
      if (previous !== undefined && !selectionEqual(current, previous)) {
        discardComposition()
      }
    },
    { defer: true },
  )
  /** Form string of a value; `undefined` omits it from the submission. */
  function serialize(selected: T['value']): string | undefined {
    if (props.serializeValue) {
      return props.serializeValue(selected)
    }
    return getCanonicalItem(selected)?.disabled ? undefined : String(selected)
  }
  const serialized = createMemo(() => value().flatMap((selected) => serialize(selected) ?? []))
  /** Native autofill writes the text of an enabled item's form string or label into the input. */
  function findAutofillItem(text: string): T | undefined {
    const target = text.toLowerCase()
    return navigation().items.find(
      (item) =>
        serialize(item.value)?.toLowerCase() === target ||
        labelString(item, props.getItemLabel).toLowerCase() === target,
    )
  }
  const hasSelection = () => value().length > 0
  const primarySerializedValue = () => serialized()[0] ?? ''
  const secondarySerializedValues = createMemo(() => serialized().slice(1), {
    equals: (prev, next) =>
      prev.length === next.length && prev.every((item, index) => item === next[index]),
  })

  useFormReset(
    () => formInput?.form,
    () => {
      discardComposition()
      resetNativeInvalid()
      setSelection(initial)
      const next = props.value !== undefined ? normalize(props.value) : initial
      field.setFormValue(toFormValue(next, props.multiple === true))
      if (formInput) {
        formInput.value = next.flatMap((selected) => serialize(selected) ?? [])[0] ?? ''
      }
      props.onReset?.()
    },
  )
  // A superset of the public `BaseSelectT.Context`: the same object serves built-in parts and
  // `BaseSelect.useContext`, whose cast in `base-select.tsx` checks the public part.
  return {
    items,
    value,
    open,
    setOpen,
    highlightedValue,
    setHighlightedValue,
    id: field.id,
    disabled: field.disabled,
    readOnly: field.readOnly,
    required: field.required,
    invalid,
    locked,
    focusOwner,
    setFocusOwner,
    listboxId,
    itemId,
    itemDisabled,
    change,
    select,
    keyDown,
    registerCompositionDiscarder,
    focus: (event: FocusEvent) => field.emit('focus', event),
    blur: (event: FocusEvent) => field.emit('blur', event),
    props,
    slotName,
    recipeContext,
    ariaAttrs,
    isHighlighted,
    isSelected,
    anchor,
    setAnchor,
    dismiss,
    formControls: () => (
      <>
        <HiddenInput
          ref={(element) => {
            formInput = element
          }}
          type="text"
          aria-hidden="true"
          disabled={field.disabled()}
          required={field.required() && !hasSelection()}
          tabindex={-1}
          form={props.form}
          name={serialized().length > 0 ? field.name() : undefined}
          value={primarySerializedValue()}
          onChange={(event) => {
            if (props.multiple || locked()) {
              event.currentTarget.value = primarySerializedValue()
              return
            }
            const match = findAutofillItem(event.currentTarget.value)
            if (match) {
              change([match.value])
              return
            }
            event.currentTarget.value = primarySerializedValue()
          }}
          onInvalid={onInvalid}
        />
        <For each={secondarySerializedValues()} keyed={false}>
          {(value) => (
            <HiddenInput
              type="hidden"
              visuallyHidden={false}
              form={props.form}
              name={field.name()}
              value={value()}
              disabled={field.disabled()}
            />
          )}
        </For>
      </>
    ),
  }
}

export type SelectState<T extends BaseSelectT.Item> = ReturnType<typeof createSelectState<T>>
/**
 * Private state shared by built-in select parts. The context is created for the erased item type;
 * the provider and hook are retyped here once so callers pick their item type per read.
 */
export const [SelectProvider, useSelectContext] = /* @__PURE__ */ createContextProvider(
  'BaseSelect',
) as unknown as readonly [
  <T extends BaseSelectT.Item = BaseSelectT.Item>(props: {
    value: SelectState<T>
    children?: JSX.Element
  }) => JSX.Element,
  <T extends BaseSelectT.Item = BaseSelectT.Item>() => SelectState<T>,
]
