import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import type { Accessor, JSX } from 'solid-js'

import { createCompositionState, isComposingKeyEvent } from '../../overlay/base/utils'

import type { BaseSelectT } from './base-select.types'

function isAndroidUserAgent(): boolean {
  return /android/i.test(globalThis.navigator?.userAgent ?? '')
}

export interface BaseSelectSearchInputOptions<TItem extends BaseSelectT.Item = BaseSelectT.Item> {
  state: Pick<
    BaseSelectT.Context<TItem>,
    | 'id'
    | 'listboxId'
    | 'open'
    | 'setOpen'
    | 'highlightedValue'
    | 'itemId'
    | 'locked'
    | 'disabled'
    | 'readOnly'
    | 'focusOwner'
    | 'setFocusOwner'
    | 'registerCompositionDiscarder'
    | 'keyDown'
    | 'focus'
    | 'blur'
  >
  searchValue: Accessor<string>
  setSearchValue: (value: string) => string
  enabled?: Accessor<boolean>
  displayValue?: Accessor<string>
  transformInput?: (value: string) => string
  maxLength?: number
  autocomplete?: JSX.InputHTMLAttributes<HTMLInputElement>['autocomplete']
}

/** Binds a caller-owned input to BaseSelect state. */
export function createBaseSelectSearchInput<TItem extends BaseSelectT.Item = BaseSelectT.Item>(
  options: BaseSelectSearchInputOptions<TItem>,
) {
  const state = options.state
  const [compositionDraft, setCompositionDraft] = createSignal<string>()
  const composition = createCompositionState()
  const isComposing = () => compositionDraft() !== undefined
  const displayValue = () => options.displayValue?.() ?? options.searchValue()
  const enabled = () => options.enabled?.() ?? true
  onCleanup(() => composition.dispose())

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
      return state.id()
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
      return state.readOnly() || !enabled() ? ('none' as const) : ('list' as const)
    },
    get 'aria-activedescendant'() {
      const highlighted = state.highlightedValue()
      return state.open() && highlighted !== undefined ? state.itemId(highlighted) : undefined
    },
    get disabled() {
      return state.disabled()
    },
    get readOnly() {
      return state.readOnly() || !enabled()
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
      if (!isAndroidUserAgent() && (isComposing() || event.isComposing)) {
        setCompositionDraft(target.value)
        return
      }
      commit(target.value)
    },
    onCompositionStart(event: CompositionEvent) {
      if (isAndroidUserAgent()) {
        return
      }
      composition.onCompositionStart()
      setCompositionDraft((event.currentTarget as HTMLInputElement).value)
    },
    onCompositionEnd(event: CompositionEvent) {
      composition.onCompositionEnd()
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
      if (isComposing() || isComposingKeyEvent(event, composition)) {
        return
      }
      state.keyDown(event, enabled())
    },
    onFocus(event: FocusEvent) {
      state.focus(event)
    },
    onBlur(event: FocusEvent) {
      state.blur(event)
    },
  }

  return { inputProps, isComposing, discardComposition }
}
