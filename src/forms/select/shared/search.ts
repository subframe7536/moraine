import { createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useControllableValue } from '../../../shared/use-controllable-value.ts'
import { useSelectState } from '../base-select.tsx'
import type { BaseSelectT } from '../base-select.types.ts'

import { isGroup, labelString } from './collection.ts'
import type { SearchProps } from './types.ts'

export function useSelectSearch<T extends BaseSelectT.Item>(
  props: SearchProps<T>,
  enabled: Accessor<boolean>,
) {
  const state = useSelectState<T>()
  const [text, setText] = useControllableValue<string>({
    value: () => props.searchValue,
    defaultValue: () => props.defaultSearchValue ?? '',
  })
  const query = () => text() ?? ''
  const [composing, setComposing] = createSignal(false)
  const [draft, setDraft] = createSignal('')
  let pendingSelectionQuery: string | undefined
  function setQuery(value: string) {
    const next = props.searchMaxLength === undefined ? value : value.slice(0, props.searchMaxLength)
    if (next === query()) {
      return next
    }
    setText(next)
    props.onSearch?.(next)
    return next
  }
  function commit(value: string) {
    const next = setQuery(value)
    if (value.trim()) {
      state.setOpen(true)
    }
    return next
  }
  const view = createMemo(() => {
    const entries = state.collection().entries
    if (!enabled() || props.filterItem === false || !query()) {
      return entries
    }
    const input = query().toLowerCase()
    const matches = (item: T) => {
      if (typeof props.filterItem === 'function') {
        return props.filterItem(query(), item)
      }
      const text = labelString(item, state.props.itemToLabelString).toLowerCase()
      if (props.filterItem === 'startsWith') {
        return text.startsWith(input)
      }
      if (props.filterItem === 'endsWith') {
        return text.endsWith(input)
      }
      return text.includes(input)
    }
    return entries.flatMap<BaseSelectT.Entry<T>>((entry) => {
      if (!isGroup(entry)) {
        return matches(entry) ? [entry] : []
      }
      const items = entry.items.filter(matches)
      return items.length ? [{ ...entry, items }] : []
    })
  })
  state.setViewSource(() => view)
  onCleanup(() => state.setViewSource(undefined))
  createEffect(on(state.resetVersion, () => setQuery(''), { defer: true }))
  createEffect(
    on(
      state.selectionVersion,
      () => {
        const item = state.selectedItems()[0]
        const next = state.props.multiple
          ? ''
          : item
            ? labelString(item, state.props.itemToLabelString)
            : ''
        if (!state.props.multiple && !state.open() && state.contentPresent()) {
          pendingSelectionQuery = next
          return
        }
        pendingSelectionQuery = undefined
        setQuery(next)
      },
      { defer: true },
    ),
  )
  createEffect(
    on(state.contentPresent, (present) => {
      if (!present && pendingSelectionQuery !== undefined) {
        const next = pendingSelectionQuery
        pendingSelectionQuery = undefined
        setQuery(next)
      }
    }),
  )
  createEffect(
    on(
      state.open,
      (open) => {
        if (!open && state.visibleItems().length === 0) {
          setQuery('')
        }
      },
      { defer: true },
    ),
  )
  function input(event: InputEvent) {
    const target = event.currentTarget as HTMLInputElement
    if (state.locked()) {
      target.value = query()
      return
    }
    if (composing() || event.isComposing) {
      setDraft(target.value)
      return
    }
    commit(target.value)
  }
  function startComposition(value: string) {
    setDraft(value)
    setComposing(true)
  }
  function endComposition(value: string) {
    setComposing(false)
    return value
  }
  return {
    query,
    setQuery,
    commit,
    composing,
    setDraft,
    endComposition,
    input,
    binding: {
      get id() {
        return state.field.id()
      },
      role: 'combobox' as const,
      get 'aria-controls'() {
        return state.listboxId()
      },
      get 'aria-expanded'() {
        return state.open() ? ('true' as const) : ('false' as const)
      },
      'aria-haspopup': 'listbox' as const,
      'aria-autocomplete': 'list' as const,
      get 'aria-activedescendant'() {
        return state.open() && state.highlight()
          ? `${state.listboxId()}-${encodeURIComponent(state.highlight()!)}`
          : undefined
      },
      get disabled() {
        return state.field.disabled()
      },
      get readOnly() {
        return state.field.readOnly() || !enabled()
      },
      get maxLength() {
        return props.searchMaxLength
      },
      get value() {
        return composing() ? draft() : query()
      },
      ref(element: HTMLInputElement) {
        state.setControl(element)
      },
      onInput: input,
      onCompositionStart(event: CompositionEvent) {
        startComposition((event.currentTarget as HTMLInputElement).value)
      },
      onCompositionEnd(event: CompositionEvent) {
        const target = event.currentTarget as HTMLInputElement
        const committed = endComposition(target.value)
        target.value = committed
        commit(committed)
      },
      onKeyDown(event: KeyboardEvent) {
        if (!composing()) {
          state.keyDown(event, enabled())
        }
      },
      onFocus(event: FocusEvent) {
        state.field.emit('focus', event)
      },
      onBlur(event: FocusEvent) {
        state.field.emit('blur', event)
      },
    },
  }
}
