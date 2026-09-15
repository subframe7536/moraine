import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'

export interface TagsFieldEntry<TValue> {
  value: TValue
  label: import('solid-js').JSX.Element
  title: string
  removable: boolean
}

export interface TagsFieldOptions<TValue> {
  values: Accessor<readonly TValue[]>
  resolve: (value: TValue) => TagsFieldEntry<TValue>
  change: (values: TValue[]) => void
  getInput: Accessor<HTMLInputElement | undefined>
  maxVisible?: Accessor<number | undefined>
}

/** Shared tag presentation, removal, and keyboard focus behavior. */
export function createTagsField<TValue>(options: TagsFieldOptions<TValue>) {
  const tags = createMemo(() => options.values().map(options.resolve))
  const visible = createMemo(() => {
    const max = options.maxVisible?.()
    return max === undefined ? tags() : tags().slice(0, Math.max(0, max))
  })
  const removeButtons: Array<HTMLButtonElement | undefined> = []

  function remove(index: number): boolean {
    const tag = tags()[index]
    if (!tag?.removable) {
      return false
    }
    options.change(options.values().filter((_, valueIndex) => valueIndex !== index))
    return true
  }

  function focusNearest(index: number, direction: -1 | 1): void {
    for (let next = index + direction; next >= 0 && next < tags().length; next += direction) {
      if (tags()[next]?.removable && removeButtons[next]) {
        removeButtons[next]?.focus()
        return
      }
    }
    options.getInput()?.focus()
  }

  function onInputKeyDown(event: KeyboardEvent, inputValue: string): boolean {
    if (event.key === 'Backspace' && !inputValue) {
      for (let index = tags().length - 1; index >= 0; index -= 1) {
        if (remove(index)) {
          event.preventDefault()
          return true
        }
      }
    }
    if (event.key === 'ArrowLeft' && event.currentTarget instanceof HTMLInputElement) {
      const input = event.currentTarget
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        for (let index = tags().length - 1; index >= 0; index -= 1) {
          if (tags()[index]?.removable && removeButtons[index]) {
            event.preventDefault()
            removeButtons[index]?.focus()
            return true
          }
        }
      }
    }
    return false
  }

  function onRemoveKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      focusNearest(index, event.key === 'ArrowLeft' ? -1 : 1)
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      const direction = event.key === 'Backspace' ? -1 : 1
      if (remove(index)) {
        // oxlint-disable-next-line subf/solid-reactivity -- Delayed focus reads the post-removal tag list.
        queueMicrotask(() => focusNearest(index - (direction === 1 ? 1 : 0), direction))
      }
    }
  }

  function isolatePointer(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    options.getInput()?.focus()
  }

  return {
    tags,
    visible,
    overflow: () => tags().length - visible().length,
    remove,
    onInputKeyDown,
    onRemoveKeyDown,
    isolatePointer,
    registerRemove(index: number, element: HTMLButtonElement): void {
      removeButtons[index] = element
    },
  }
}
