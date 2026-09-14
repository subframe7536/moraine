import { createMemo, createSignal } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useControllableValue } from '../../../shared/use-controllable-value.ts'
import { useSelectState } from '../base-select.tsx'
import type { BaseSelectT } from '../base-select.types.ts'

import { filterView, labelString } from './collection.ts'
import type { SearchProps, SelectView } from './types.ts'

export function useSelectSearch<T extends BaseSelectT.Item>(
  props: SearchProps<T>,
  enabled: Accessor<boolean>,
  source: Accessor<SelectView<T>>,
  resolve: Accessor<((item: T) => string) | undefined>,
) {
  const [text, setText] = useControllableValue<string>({
    value: () => props.searchValue,
    defaultValue: () => props.defaultSearchValue ?? '',
  })
  const query = () => text() ?? ''
  function setQuery(value: string) {
    const next = props.searchMaxLength === undefined ? value : value.slice(0, props.searchMaxLength)
    if (next === query()) {
      return next
    }
    setText(next)
    props.onSearch?.(next)
    return next
  }
  const view = createMemo(() => {
    if (!enabled() || props.filterItem === false || !query()) {
      return source()
    }
    const input = query().toLowerCase()
    return filterView(source(), (item) => {
      if (typeof props.filterItem === 'function') {
        return props.filterItem(query(), item)
      }
      const text = labelString(item, resolve()).toLowerCase()
      if (props.filterItem === 'startsWith') {
        return text.startsWith(input)
      }
      if (props.filterItem === 'endsWith') {
        return text.endsWith(input)
      }
      return text.includes(input)
    })
  })
  return { query, setQuery, view }
}

/** Input interaction stays inside the control owner; query and filtering live above BaseSelect. */
export function useSelectSearchInput<T extends BaseSelectT.Item>(
  props: SearchProps<T>,
  enabled: Accessor<boolean>,
  search: Pick<ReturnType<typeof useSelectSearch<T>>, 'query' | 'setQuery'>,
  display: Accessor<string> = search.query,
) {
  const state = useSelectState<T>()
  const { query, setQuery } = search
  const [composing, setComposing] = createSignal(false)
  const [draft, setDraft] = createSignal('')
  function commit(value: string) {
    const next = setQuery(value)
    if (value.trim()) {
      state.setOpen(true)
    }
    return next
  }
  function input(event: InputEvent) {
    const target = event.currentTarget as HTMLInputElement
    if (state.locked()) {
      target.value = display()
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
        return state.open() && state.highlightedValue() !== undefined
          ? state.itemId(state.highlightedValue()!)
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
        return composing() ? draft() : display()
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
