import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

import type { useSelectState } from './base-select.tsx'

export type BaseSelectSearchInputState = Pick<
  ReturnType<typeof useSelectState>,
  | 'field'
  | 'listboxId'
  | 'open'
  | 'setOpen'
  | 'highlightedValue'
  | 'itemId'
  | 'locked'
  | 'focusOwner'
  | 'setFocusOwner'
  | 'registerCompositionDiscarder'
  | 'keyDown'
>

export interface BaseSelectSearchInputOptions {
  state: BaseSelectSearchInputState
  searchValue: Accessor<string>
  setSearchValue: (value: string) => string
  enabled?: Accessor<boolean>
  displayValue?: Accessor<string>
  transformInput?: (value: string) => string
  maxLength?: number
  autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']
}

/** Binds a caller-owned input to BaseSelect state. */
export function useBaseSelectSearchInput(options: BaseSelectSearchInputOptions) {
  const state = options.state
  const [compositionDraft, setCompositionDraft] = createSignal<string>()
  const isComposing = () => compositionDraft() !== undefined
  const displayValue = () => options.displayValue?.() ?? options.searchValue()
  const enabled = () => options.enabled?.() ?? true

  function commit(value: string): string {
    const next = options.setSearchValue(options.transformInput?.(value) ?? value)
    if (next.trim()) {
      state.setOpen(true)
    }
    return next
  }

  function discardComposition(): void {
    setCompositionDraft(undefined)
  }

  state.registerCompositionDiscarder(discardComposition)
  createEffect(
    on(options.searchValue, (current, previous) => {
      if (previous !== undefined && current !== previous) {
        discardComposition()
      }
    }),
  )

  const inputProps = {
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
    get 'aria-autocomplete'() {
      return state.field.readOnly() || !enabled() ? ('none' as const) : ('list' as const)
    },
    get 'aria-activedescendant'() {
      const highlighted = state.highlightedValue()
      return state.open() && highlighted !== undefined ? state.itemId(highlighted) : undefined
    },
    get disabled() {
      return state.field.disabled()
    },
    get readOnly() {
      return state.field.readOnly() || !enabled()
    },
    get maxLength() {
      return options.maxLength
    },
    get autocomplete() {
      return options.autocomplete ?? 'off'
    },
    get value() {
      return compositionDraft() ?? displayValue()
    },
    ref(element: HTMLInputElement) {
      state.setFocusOwner(element)
      onCleanup(() => {
        if (state.focusOwner() === element) {
          state.setFocusOwner(undefined)
        }
      })
    },
    onInput(event: InputEvent) {
      const target = event.currentTarget as HTMLInputElement
      if (state.locked()) {
        target.value = displayValue()
        return
      }
      if (isComposing() || event.isComposing) {
        setCompositionDraft(target.value)
        return
      }
      commit(target.value)
    },
    onCompositionStart(event: CompositionEvent) {
      setCompositionDraft((event.currentTarget as HTMLInputElement).value)
    },
    onCompositionEnd(event: CompositionEvent) {
      const target = event.currentTarget as HTMLInputElement
      if (!isComposing()) {
        target.value = displayValue()
        return
      }
      const value = target.value
      discardComposition()
      target.value = commit(value)
    },
    onKeyDown(event: KeyboardEvent) {
      if (!isComposing()) {
        state.keyDown(event, enabled())
      }
    },
    onFocus(event: FocusEvent) {
      state.field.emit('focus', event)
    },
    onBlur(event: FocusEvent) {
      state.field.emit('blur', event)
    },
  }

  return { inputProps, isComposing, discardComposition }
}
