import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

import { useControllableValue } from '../../shared/use-controllable-value.ts'
import type { UseFormFieldReturn } from '../form/form-context.ts'

import type { BaseSelectT } from './base-select.types.ts'

/** Query-state options shared by searchable selection controls. */
export interface SearchValueOptions {
  /** Controlled query text. */
  searchValue?: string
  /** Initial uncontrolled query text. @default '' */
  defaultSearchValue?: string
  /** Called after the query changes. */
  onSearch?: (value: string) => void
  /** Maximum committed query length. */
  searchMaxLength?: number
}

/** Query controller accepted by {@link useBaseSelectSearchInput}. */
export interface SearchValue {
  readonly query: Accessor<string>
  setQuery: (value: string) => string
}

/** The BaseSelect state used to bind a custom search input. */
export interface BaseSelectSearchInputState {
  field: Pick<UseFormFieldReturn, 'id' | 'disabled' | 'readOnly' | 'emit'>
  listboxId: Accessor<string>
  open: Accessor<boolean>
  setOpen: (next: boolean) => void
  highlightedValue: Accessor<BaseSelectT.Value | undefined>
  itemId: (value: BaseSelectT.Value) => string
  locked: Accessor<boolean>
  focusOwner: Accessor<HTMLElement | undefined>
  setFocusOwner: (element: HTMLElement | undefined) => void
  registerCompositionDiscarder: (discard: () => void) => void
  keyDown: (event: KeyboardEvent, textInput?: boolean) => void
}

/** Creates controlled or uncontrolled query state for a custom searchable picker. */
export function useSearchValue(options: SearchValueOptions = {}): SearchValue {
  const [text, setText] = useControllableValue<string>({
    value: () => options.searchValue,
    defaultValue: () => options.defaultSearchValue ?? '',
  })
  const query = () => text() ?? ''
  function setQuery(value: string) {
    const next =
      options.searchMaxLength === undefined ? value : value.slice(0, options.searchMaxLength)
    if (next === query()) {
      return next
    }
    setText(next)
    options.onSearch?.(next)
    return next
  }
  return { query, setQuery }
}

/**
 * Returns query input bindings for a custom searchable BaseSelect composition.
 * The input stays owned by the caller while BaseSelect keeps navigation and popup state.
 */
export function useBaseSelectSearchInput(
  state: BaseSelectSearchInputState,
  options: Pick<SearchValueOptions, 'searchMaxLength'>,
  enabled: Accessor<boolean>,
  search: SearchValue,
  display: Accessor<string> = search.query,
  transformInput: (value: string) => string = (value) => value,
) {
  const { query, setQuery } = search
  const [composing, setComposing] = createSignal(false)
  const [draft, setDraft] = createSignal('')
  function commit(value: string) {
    const next = setQuery(transformInput(value))
    if (next.trim()) {
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
    if (!composing()) {
      return undefined
    }
    setComposing(false)
    return value
  }
  function discardComposition() {
    if (!composing()) {
      return
    }
    setComposing(false)
    setDraft('')
  }
  createEffect(on([], () => state.registerCompositionDiscarder(discardComposition)))
  createEffect(
    on(query, (current, previous) => {
      if (previous !== undefined && current !== previous) {
        discardComposition()
      }
    }),
  )
  return {
    query,
    setQuery,
    commit,
    composing,
    setDraft,
    endComposition,
    discardComposition,
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
        return options.searchMaxLength
      },
      get value() {
        return composing() ? draft() : display()
      },
      ref(element: HTMLInputElement) {
        state.setFocusOwner(element)
        onCleanup(() => {
          if (state.focusOwner() === element) {
            state.setFocusOwner(undefined)
          }
        })
      },
      onInput: input,
      onCompositionStart(event: CompositionEvent) {
        startComposition((event.currentTarget as HTMLInputElement).value)
      },
      onCompositionEnd(event: CompositionEvent) {
        const target = event.currentTarget as HTMLInputElement
        const committed = endComposition(target.value)
        if (committed === undefined) {
          target.value = display()
          return
        }
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
