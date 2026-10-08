import type { Accessor } from 'solid-js'
import {
  For,
  batch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  untrack,
} from 'solid-js'

import { createStyles } from '../../provider/create-styles'
import { createControllableValue } from '../../shared/controllable-value'
import { createContextProvider } from '../../shared/create-context-provider'
import { HiddenInput } from '../../shared/hidden-input'
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
} from '../shared/select/collection'
import { useFormReset } from '../shared/use-form-reset'

import { baseSelectRecipe } from './base-select.recipe'
import type { BaseSelectProps, BaseSelectT, BaseSelectValue } from './base-select.types'

function selectionToFormValue<T extends BaseSelectValue>(
  values: readonly T[],
  multiple: boolean,
): T[] | T | null {
  return multiple ? [...values] : (values[0] ?? null)
}

export function createSelectState<T extends BaseSelectT.Item>(
  props: BaseSelectProps<T>,
  slotOwner: Accessor<string>,
) {
  const slotName = (slot: string) => dataSlotName(slotOwner(), slot)
  type Value = readonly T['value'][]
  const normalize = (values: Value): T['value'][] =>
    normalizeSelection(values, props.multiple === true)
  const id = createId(() => props.id, 'select')
  const initial = untrack(() => normalize(props.defaultValue ?? []))
  const field = useFormField(
    () => props,
    () => ({
      defaultId: id(),
      initialValue: selectionToFormValue(initial, props.multiple === true),
    }),
  )
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
  createEffect(on(items, diagnoseDuplicateItems))
  function getCanonicalItem(value: T['value']): T | undefined {
    return props.getItemByValue ? props.getItemByValue(value) : itemByValue().get(value)
  }
  const [selection, setSelection] = createControllableValue<Value>({
    value: () => {
      if (props.value !== undefined) {
        return props.value
      }
      const value = field.value()
      if (props.multiple && Array.isArray(value)) {
        return value
      }
      if (!props.multiple && value === null) {
        return []
      }
      if (!props.multiple && (typeof value === 'string' || typeof value === 'number')) {
        if (value === '' && !getCanonicalItem(value)) {
          return []
        }
        return [value]
      }
      return undefined
    },
    defaultValue: () => initial,
  })
  const value = createMemo(() => normalize(selection()))
  const itemDisabled = (item: T) => {
    const canonical = getCanonicalItem(item.value) ?? item
    return Boolean(canonical.disabled || props.isItemDisabled?.(canonical, value()))
  }
  const [open, setOpenValue] = createControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const [highlightedValue, setHighlightedValue] = createSignal<T['value']>()
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [focusOwner, setFocusOwner] = createSignal<HTMLElement>()
  createEffect(
    on(focusOwner, (element) => {
      field.setControlRef(element)
    }),
  )
  const listboxId = () => `${field.id()}-listbox`
  const itemId = (value: BaseSelectValue) =>
    `${listboxId()}-${encodeURIComponent(`${typeof value}:${String(value)}`)}`
  const styleState = createStyles(baseSelectRecipe, props, {
    rootSlot: 'control',
    inheritedVariants: () => ({ size: field.size() ?? undefined }),
  })
  const stylePresentation = {
    get classes() {
      return props.classes
    },
    get styles() {
      return props.styles
    },
  }
  const locked = () => field.disabled() || field.readOnly()
  let formInput: HTMLInputElement | undefined

  function setOpen(next: boolean) {
    if (next && field.disabled()) {
      return
    }
    if (next === open()) {
      return
    }
    setOpenValue(next)
    props.onOpenChange?.(next)
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
    setSelection(after)
    if (props.value === undefined) {
      field.setFormValue(selectionToFormValue(after, props.multiple === true))
    }
    props.onValueChange?.(after)
    if (props.value !== undefined) {
      field.setFormValue(selectionToFormValue(normalize(props.value), props.multiple === true))
    }
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
    batch(() => {
      if (props.closeOnSelect ?? !props.multiple) {
        setOpen(false)
      }
      change(
        props.multiple
          ? value().includes(item.value)
            ? value().filter((value) => !sameValue(value, item.value))
            : [...value(), item.value]
          : [item.value],
      )
    })
    if (props.closeOnSelect ?? !props.multiple) {
      const target = focusOwner()
      // oxlint-disable-next-line subf/solid-reactivity -- Delayed focus validates the current control and open state.
      queueMicrotask(() => {
        if (!open() && target === focusOwner() && target?.isConnected) {
          target.focus()
        }
      })
    }
  }
  const enabled = createMemo(() => items().filter((item) => !itemDisabled(item)))
  createEffect(
    on([open, enabled, highlightedValue, value], ([isOpen, items, current, selected]) => {
      if (!isOpen) {
        return
      }
      if (!items.some((item) => sameValue(item.value, current) && !itemDisabled(item))) {
        const next =
          items.find((item) => !itemDisabled(item) && selected.includes(item.value)) ??
          items.find((item) => !itemDisabled(item))
        setHighlightedValue(next ? next.value : undefined)
      }
    }),
  )
  const typeahead = createTypeahead({
    getItems: items,
    getStartIndex: () =>
      items().findIndex((item) =>
        open() ? sameValue(item.value, highlightedValue()) : value().includes(item.value),
      ),
    getText: (item) => labelString(item, props.itemToLabelString),
    isDisabled: (item) => itemDisabled(item),
    onMatch: (item) => (open() ? setHighlightedValue(item.value) : select(item)),
  })
  function keyDown(event: KeyboardEvent, textInput = false) {
    if (event.defaultPrevented || field.disabled() || event.isComposing) {
      return
    }
    if (!textInput && typeahead.handleKeyDown(event)) {
      return
    }
    const key = event.key
    if (key === 'Tab') {
      setOpen(false)
      return
    }
    if (key === 'Escape') {
      if (open()) {
        event.preventDefault()
        setOpen(false)
      }
      return
    }
    if (key === 'ArrowDown' || key === 'ArrowUp' || (open() && (key === 'Home' || key === 'End'))) {
      event.preventDefault()
      setOpen(true)
      const items = enabled()
      if (items.length === 0) {
        setHighlightedValue(undefined)
        return
      }
      const current = items.findIndex((item) => sameValue(item.value, highlightedValue()))
      const shouldLoop = props.loop ?? true
      const nextIndex = current + (key === 'ArrowUp' ? -1 : 1)
      const index =
        key === 'Home'
          ? 0
          : key === 'End'
            ? items.length - 1
            : current < 0
              ? key === 'ArrowUp'
                ? shouldLoop
                  ? items.length - 1
                  : 0
                : 0
              : shouldLoop
                ? (nextIndex + items.length) % items.length
                : Math.max(0, Math.min(items.length - 1, nextIndex))
      setHighlightedValue(items[index] ? items[index].value : undefined)
      return
    }
    if (key === 'Enter' || (!textInput && (key === ' ' || key === 'Spacebar'))) {
      event.preventDefault()
      if (!open()) {
        setOpen(true)
        return
      }
      const item = items().find((item) => sameValue(item.value, highlightedValue()))
      if (item) {
        select(item)
      }
    }
  }
  createEffect(
    on(
      [value, field.value, () => props.value !== undefined],
      ([current, formValue, controlled]) => {
        if (!controlled) {
          return
        }
        const projected = selectionToFormValue(current, props.multiple === true)
        if (props.multiple) {
          if (!Array.isArray(formValue) || !selectionEqual(current, formValue as T['value'][])) {
            field.setFormValue(projected)
          }
        } else if (projected !== formValue) {
          field.setFormValue(projected)
        }
      },
    ),
  )
  let compositionDiscarder: (() => void) | undefined
  function registerCompositionDiscarder(discard: () => void) {
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
    on(value, (current, previous) => {
      if (previous !== undefined && !selectionEqual(current, previous)) {
        discardComposition()
      }
    }),
  )
  const serialized = createMemo(() => {
    const selected = value()
    if (!selected.length) {
      return []
    }
    return selected.flatMap((value) => {
      const serialized = props.serializeValue
        ? props.serializeValue(value)
        : getCanonicalItem(value)?.disabled
          ? undefined
          : String(value)
      return serialized === undefined ? [] : [serialized]
    })
  })
  const hasSelection = () => value().length > 0
  const primarySerializedValue = () => serialized()[0] ?? ''

  useFormReset(
    () => formInput?.form,
    () => {
      discardComposition()
      setSelection(initial)
      const next = props.value !== undefined ? normalize(props.value) : initial
      field.setFormValue(selectionToFormValue(next, props.multiple === true))
      if (formInput) {
        formInput.checked = next.length > 0
        formInput.value = primarySerializedValue()
      }
      props.onReset?.()
    },
  )
  const presentation: BaseSelectT.TriggerRenderProps<T> = {
    get open() {
      return open()
    },
    get value() {
      return value()
    },
    get disabled() {
      return field.disabled()
    },
    get readOnly() {
      return field.readOnly()
    },
  }
  const context: BaseSelectT.Context<T> = {
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
    invalid: field.invalid,
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
    focus: (event) => field.emit('focus', event),
    blur: (event) => field.emit('blur', event),
  }
  return {
    context,
    props,
    items,
    value,
    open,
    setOpen,
    highlightedValue,
    setHighlightedValue,
    anchor,
    setAnchor,
    focusOwner,
    setFocusOwner,
    listboxId,
    itemId,
    field,
    stylePresentation,
    slotName,
    get styleSize() {
      return styleState.variants.size
    },
    locked,
    change,
    select,
    keyDown,
    presentation,
    itemDisabled,
    registerCompositionDiscarder,
    formControls: () => (
      <>
        <HiddenInput
          ref={(element) => {
            formInput = element
          }}
          type="checkbox"
          aria-hidden="true"
          autocomplete="off"
          disabled={field.disabled()}
          required={field.required()}
          tabIndex={-1}
          checked={hasSelection()}
          name={serialized().length > 0 ? field.name() : undefined}
          value={primarySerializedValue()}
          onInput={(event) => {
            event.currentTarget.checked = hasSelection()
            event.currentTarget.value = primarySerializedValue()
          }}
          onChange={(event) => {
            event.currentTarget.checked = hasSelection()
            event.currentTarget.value = primarySerializedValue()
          }}
          onInvalid={(event) => {
            event.preventDefault()
            focusOwner()?.focus()
          }}
        />
        <For each={serialized().slice(1)}>
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
      </>
    ),
  }
}

export type SelectState<T extends BaseSelectT.Item> = ReturnType<typeof createSelectState<T>>
const [SelectProvider, readSelectContext] =
  /* @__PURE__ */ createContextProvider<SelectState<BaseSelectT.Item>>('BaseSelect')
/** Private state shared by built-in select parts. */
export function useSelectContext<T extends BaseSelectT.Item = BaseSelectT.Item>(): SelectState<T> {
  return readSelectContext() as unknown as SelectState<T>
}

export { SelectProvider }
